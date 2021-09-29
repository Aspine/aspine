import fetch, { FetchError } from "node-fetch";
import { URLSearchParams } from "url";
import { JSDOM } from "jsdom";

import type {
  Session,
  PDFFileInfo,
  ClassInfo,
  ClassDetails,
  Category,
} from "./types";

import type {
  PDFFile,
  OverviewItem,
  Schedule,
  ScheduleItem,
  Assignment,
  StudentData,
  Class,
  Recent,
  AttendanceEvent,
  ActivityEvent,
  Stats,
  TermSpec,
} from "./types-shared";

// Using `import type` with an enum disallows accessing the enum variants
import { AspineErrorCode } from "./types";
import { Quarter, Year } from "./types-shared";

export async function get_student(
  username: string, password: string, quarter: Quarter = Quarter.Current,
  year: Year = Year.Current
): Promise<StudentData> {
  return await get_session(username, password, async session => {
    const { student_name, student_oid } = await get_student_info(session);
    const quarter_oids = await get_quarter_oids(session, year);

    const academics = await get_academics(
      session, student_oid, quarter_oids, year
    );
    const class_details = await Promise.all(academics.map(async class_info =>
      get_class_details(session, class_info)));
    const overview = assemble_overview(class_details);
    const assignments = await Promise.all(class_details.map(async details =>
      get_assignments(session, quarter, quarter_oids, details)));
    const recent = await get_recent(session);

    const isClass = function(x: Class | undefined): x is Class {
      return x !== undefined;
    };
    const classes = (await Promise.all(class_details.map(async (details, i) => {
      // Don't include a class if it does not exist in this quarter
      if (!details.grades.has(quarter)) {
        return undefined;
      }

      // For previous-year data, every class is listed under every quarter, so
      // we need to do an additional check using the "term" attribute
      if (year !== Year.Current && !await match_termspec(
        session, details.term, quarter, year
      )) {
        return undefined;
      }

      // exclude classes that don't recieve grades in Aspen
      if ([
        "Study Support", "Advisory", "Community Meeting", "PE Athletics",
        "PE 10-12 Wellness Elective", "PE RSTA",
      ].includes(details.name)) {
        return undefined;
      }

      let categories: { [key: string]: string } = {};
      for (const [cat, { weight} ] of details.categories) {
        categories[cat] = weight.toString();
      }
      return {
        name: details.name,
        grade: details.grades.get(quarter) || "",
        categories: categories,
        assignments: assignments[i],
        oid: details.oid,
      };
    }))).filter(isClass);
    const quarter_oid = quarter_oids.get(quarter) || "current";

    return { classes, recent, overview, username, quarter, quarter_oid };
  });
}

/**
 * Return an array containing all PDF files
 */
export async function get_pdf_files(
  username: string, password: string
): Promise<PDFFile[]> {
  return await get_session(username, password, async session => {
    const pdf_files = [];
    // Get PDF files sequentially to avoid rejection of requests
    for (const { id, filename } of await list_pdf_files(session)) {
      pdf_files.push({
        title: filename,
        content: await download_pdf(session, id),
      });
    }
    return pdf_files;
  });
}

export async function get_schedule(
  username: string, password: string
): Promise<Schedule> {
  return await get_session(username, password, async session => {
    const current_quarter = await get_current_quarter(session, Year.Current);
    const initial_page = await (await fetch(
      "https://aspen.cpsd.us/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list", {
        headers: {
          "Cookie": `JSESSIONID=${session.session_id}`,
        },
      }
    )).text();
    // This is a term OID that is specific to the schedule view (not the same
    // as the OIDs in the output of get_quarter_oids)
    const [, term_oid] = new RegExp(
      String.raw`<option value="(.+)">Q${current_quarter}</option>`
    ).exec(initial_page) as RegExpExecArray;

    const schedule_page = await (await fetch(
      "https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?" +
      new URLSearchParams({
        "navkey": "myInfo.sch.matrix",
        "termOid": term_oid,
      }), {
        headers: {
          "Cookie": `JSESSIONID=${session.session_id}`,
        },
      }
    )).text();

    const { window: { document } } = new JSDOM(schedule_page);

    const rows = document.querySelectorAll(
      "table[cellspacing='1'] > tbody > tr:not([class])"
    );

    // Get a matrix of the cells in the first three columns of the table, then
    // transpose it to get a list of periods, a list of silver day classes
    // (from Monday), and a list of black day classes (from Tuesday).

    const transpose = <T>(matrix: T[][]): T[][] =>
      matrix[0].map((col, i) => matrix.map(row => row[i]));
    // Transpose algorithm: https://stackoverflow.com/a/46805290

    const [periods, silver_html, black_html] = transpose([...rows].map(row =>
      [1, 2, 3].map(n =>
        row.querySelector(`td:nth-child(${n})`)
          ?.querySelector("td, th")?.innerHTML.trim() ?? ""
      )
    ));
    const isScheduleItem =
      function(x: ScheduleItem | undefined): x is ScheduleItem {
        return x !== undefined;
      };
    const [black, silver] = [black_html, silver_html].map(arr =>
      arr.map((x, i) => {
        if (x) {
          const lines = x.split("<br>");

          // Decode HTML entities (https://stackoverflow.com/a/7394787)
          const textarea = document.createElement("textarea");
          const [id, name, teacher, room] = lines.map(line => {
            textarea.innerHTML = line;
            return textarea.value.trim();
          });

          let aspenPeriod = periods[i];

          // Convert aspenPeriod from incorrect to correct period
          // TODO remove this once Aspen reports periods correctly
          let [num, per] = aspenPeriod.split("-");
          let match;
          if (per === "CM") {
            per = "02B";
          } else if ((match = per.match(/0\d/))) {
            let perNum = parseInt(match[0].slice(-1));
            if (perNum == 2 || perNum == 3) {
              per = `0${perNum + 1}B`;
            } else if (perNum >= 4) {
              per = "PM";
            }
          }
          aspenPeriod = `${num}-${per}`;

          if (name === "Study Support") {
            return undefined;
          }

          return { id, name, teacher, room, aspenPeriod };
        }
      }).filter(isScheduleItem)
    );

    return { black, silver };
  });
}

export async function get_stats(
  username: string, password: string, assignment_id: string, class_id: string,
  quarter_id: string, year: Year
): Promise<Stats | {}> {
  return await get_session(username, password, async ({ session_id }) => {
    // The REST API does not expose assignment statistics (as far as we know),
    // so we need to use the regular Aspen desktop site. Aspen is picky about
    // the order in which requests are made, so we need to carry out some
    // preliminaries:

    // Get list of classes
    const class_list_page = await (await fetch(
      "https://aspen.cpsd.us/aspen/portalClassList.do?navkey=academics.classes.list",
      {
        "headers": {
          "Cookie": `JSESSIONID=${session_id}`,
        },
      })).text();

    // Get updated Apache token
    const [, apache_token] =
      /name="org.apache.struts.taglib.html.TOKEN" value="(.+)"/.exec(
        class_list_page
      ) as RegExpExecArray;

    // Change term in classes list
    await fetch("https://aspen.cpsd.us/aspen/portalClassList.do", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}; deploymentId=x2sis`,
      },
      method: "POST",
      body: new URLSearchParams({
        "org.apache.struts.taglib.html.TOKEN": apache_token,
        "userEvent": "950",
        "termFilter": quarter_id,
        "yearFilter": year,
      }),
    });

    // Get class details
    await fetch("https://aspen.cpsd.us/aspen/portalClassList.do", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
      method: "POST",
      body: new URLSearchParams({
        "org.apache.struts.taglib.html.TOKEN": apache_token,
        "userEvent": "2100",
        "userParam": class_id,
      }),
    });

    // Get list of assignments
    await fetch(
      "https://aspen.cpsd.us/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd", {
        headers: {
          "Cookie": `deploymentId=x2sis; JSESSIONID=${session_id}`,
        },
      }
    );

    // Change term in assignments list
    await fetch("https://aspen.cpsd.us/aspen/portalAssignmentList.do", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`
      },
      method: "POST",
      body: new URLSearchParams({
        "org.apache.struts.taglib.html.TOKEN": apache_token,
        "userEvent": "2210",
        "gradeTermOid": quarter_id,
      }),
    });

    // Get assignment statistics
    const stats_page = await (await fetch("https://aspen.cpsd.us/aspen/portalAssignmentList.do", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
      method: "POST",
      body: new URLSearchParams({
        "org.apache.struts.taglib.html.TOKEN": apache_token,
        "userEvent": "2100",
        "userParam": assignment_id,
      }),
    })).text();

    const { window: { document } } = new JSDOM(stats_page);

    const rows = document.querySelectorAll('#mainTable td[width="50%"]:nth-of-type(2) tr:nth-child(n+3):nth-child(-n+6)');

    if (rows.length < 4) {
      return {};
    }

    const statistics: Partial<Stats> = {};

    for (const row of rows) {
      const stat_type_raw =
        row.querySelector("td:first-child")?.textContent?.trim() ?? "";
      const stat_value =
        row.querySelector("td:last-child")?.textContent?.trim() ?? "";

      let stat_type: keyof Stats;
      switch (stat_type_raw) {
        case "High":
          stat_type = "high";
          break;
        case "Low":
          stat_type = "low";
          break;
        case "Median":
          stat_type = "median";
          break;
        case "Average":
          stat_type = "mean";
          break;
        default:
          continue;
      }
      statistics[stat_type] = parseFloat(stat_value);
    }

    return statistics;
  });
}

async function get_recent(session: Session): Promise<Recent> {
  const page = await (await fetch(
    "https://aspen.cpsd.us/aspen/studentRecentActivityWidget.do?" +
    new URLSearchParams({
      "preferences":
      `<?xml version="1.0" encoding="UTF-8"?><preference-set>
        <pref id="dateRange" type="int">4</pref>
      </preference-set>`
    }),
    {
      headers: {
        "Cookie": `JSESSIONID=${session.session_id}`,
      },
    }
  )).text();

  const { window: { document } } = new JSDOM(page, { contentType: "text/xml" });
  const recentAttendanceArray =
    [...document.querySelectorAll("periodAttendance")].map(x =>
      Object.fromEntries([
        "date", "period", "code", "classname", "dismissed",
        "absent", "excused", "tardy",
      ].map(att => [att, x.getAttribute(att)])) as unknown as AttendanceEvent
    );
  const recentActivityArray =
    [...document.querySelectorAll("gradebookScore")].map(x =>
      Object.fromEntries([
        "date", "classname", "score", "assignment",
      ].map(att => [att, x.getAttribute(att)])) as unknown as ActivityEvent
    );
  return { recentAttendanceArray, recentActivityArray };
}

/**
 * Get the current quarter (Q1, Q2, Q3, Q4). In the absence of the OID of a
 * class (which can be fetched from get_academics), this function makes a
 * request to get the OID of one class.
 */
async function get_current_quarter(
  session: Session, year: Year, class_info?: ClassInfo
): Promise<Quarter> {
  // If not current year, the "current" quarter is undefined and we can just
  // let it be Q1
  if (year != Year.Current) {
    return Quarter.Q1;
  }

  let oid: string;
  if (class_info) {
    ({ oid } = class_info);
  } else {
    const { student_oid } = await get_student_info(session);
    [{ oid }] = await (await fetch(
      "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?fieldSetOid=fsnX2Cls++++++&" +
      new URLSearchParams({
        "selectedStudent": student_oid,
        "customParams": `selectedYear|${year};selectedTerm|all`,
      }), {
        headers: {
          "Cookie": `JSESSIONID=${session.session_id}`,
        },
      }
    )).json();
  }

  const { currentTermIndex } = await (await fetch(
    `https://aspen.cpsd.us/aspen/rest/studentSchedule/${oid}/gradeTerms`, {
      headers: {
        "Cookie": `JSESSIONID=${session.session_id}`,
      },
    }
  )).json();

  if (currentTermIndex + 1 in Quarter) {
    return currentTermIndex + 1;
  } else {
    return 1;
  }
}

/**
 * Get a list of published reports (PDF files)
 */
async function list_pdf_files({ session_id }: Session): Promise<PDFFileInfo[]> {
  const pdf_files: any[] = await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/reports", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
    }
  )).json();
  return pdf_files.filter(({ contentTypeId }) => contentTypeId == "cttPdf");
}

/**
 * Get name and OID of student
 */
async function get_student_info({ session_id }: Session): Promise<{
  student_name: string, student_oid: string
}> {
  const [{ name: student_name, studentOid: student_oid }] = await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/users/students", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
    }
  )).json();
  return { student_name, student_oid };
}

async function get_quarter_oids(
  session: Session, year: Year
): Promise<Map<Quarter, string>> {
  const mapping = new Map<Quarter, string>();
  const terms: { gradeTermId: string, oid: string }[] = await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list/studentGradeTerms", {
      headers: {
        "Cookie": `JSESSIONID=${session.session_id}`,
      },
    }
  )).json();
  for (const { gradeTermId, oid } of terms) {
    const [, quarter] = /^Q(\d)$/.exec(gradeTermId) as RegExpExecArray;
    const quarter_num = parseInt(quarter) ?? -1;
    if (quarter_num in Quarter) {
      mapping.set(quarter_num, oid);
    }
  }
  mapping.set(Quarter.Current,
    mapping.get(await get_current_quarter(session, year)) || "current");
  return mapping;
}

/**
 * Get basic information (name, grades, teacher, term, and OID) about classes
 */
async function get_academics(
  { session_id }: Session, student_oid: string,
  quarter_oids: Map<Quarter, string>, year: Year
): Promise<ClassInfo[]> {
  const get_classes = async (quarter_oid: string) => await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?fieldSetOid=fsnX2Cls++++++&" +
    new URLSearchParams({
      "selectedStudent": student_oid,
      "customParams": `selectedYear|${year};selectedTerm|${quarter_oid}`,
    }), {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
    }
  )).json() as any[];

  // Get classes from all terms in an array
  const all_classes = await get_classes("all");
  // Set up a mapping from quarters to mappings from OIDs to class info
  const term_classes_mapping = new Map<Quarter, Map<string, any>>();

  // Populate term_classes_mapping with data from each term
  await Promise.all([...quarter_oids.entries()].map(
    async ([quarter, quarter_oid]) =>
    term_classes_mapping.set(
      quarter,
      // Construct a 2D array with elements [oid, rest] where
      // rest is the object containing class info, then convert that to a
      // Map<string, any>
      new Map<string, any>((await get_classes(quarter_oid)).map(
        ({oid, ...rest}) => [oid, rest]
      ))
    )
  ));

  // For each class, assemble a ClassInfo object
  return all_classes.map(({
    oid,
    relSscMstOid_mstDescription: name,
    relSscMstOid_mstStaffView: teachers,
    sscTermView: term,
  }) => {
    // Mapping the terms in which this class meets to the corresponding term
    // averages
    const grades = new Map<Quarter, string>();

    for (const quarter of Object.values(Quarter)) {
      // Exclude enum variant names; we just want to iterate over
      // Current, Q1, Q2, etc.
      if (typeof quarter !== "number") continue;

      const term_data = term_classes_mapping.get(quarter)?.get(oid);
      // We don't want to count this term if the class does not have any data
      // for this term
      if (!term_data) continue;

      // Enter the grade for this term into the grades mapping
      grades.set(quarter, (term_data.cfTermAverage ?? "") as string);
    }

    let teacher = "";
    try {
      [{ name: teacher }] = teachers;
    } catch (e) {
      // In the case of a TypeError (if the class has no teachers),
      // let teacher be ""
      if (!(e instanceof TypeError)) {
        throw e;
      }
    }

    return { name, grades, teacher, term, oid };
  });
}

/**
 * Get extended information about a class (attendance, categories)
 */
async function get_class_details(
  { session_id }: Session, class_info: ClassInfo
): Promise<ClassDetails> {
  const { averageSummary, attendanceSummary } = await (await fetch(
    `https://aspen.cpsd.us/aspen/rest/studentSchedule/${class_info.oid}/academics`, {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
    }
  )).json();

  const attendance = { absent: 0, tardy: 0, dismissed: 0 };
  for (const { total, type } of attendanceSummary) {
    switch (type) {
      case "Absent": attendance.absent = total; break;
      case "Tardy": attendance.tardy = total; break;
      case "Dismissed": attendance.dismissed = total; break;
    }
  }
  const categories = new Map<string, Category>();
  for (const {
    category, categoryOid,
    percentageQ1, percentageQ2, percentageQ3, percentageQ4
  } of averageSummary) {
    if (category !== "Gradebook average") {
      categories.set(category, {
        weight: parseFloat(percentageQ1 || percentageQ2 || percentageQ3 ||
          percentageQ4) / 100.0,
        oid: categoryOid,
      });
    }
  }

  return { attendance, categories, ...class_info };
}

async function get_assignments(
  { session_id }: Session, quarter: Quarter, quarter_oids: Map<Quarter, string>,
  class_details: ClassDetails
): Promise<Assignment[]> {
  // If this class does not exist in the given quarter, then there are no
  // assignments
  if (!class_details.grades.has(quarter)) {
    return [];
  }

  const quarter_oid = quarter_oids.get(quarter);
  const [past_due, upcoming] = await Promise.all(["pastDue", "upcoming"].map(
    async x => await (await fetch(
      `https://aspen.cpsd.us/aspen/rest/studentSchedule/${class_details.oid}/categoryDetails/${x}?gradeTermOid=${quarter_oid}`, {
        headers: {
          "Cookie": `JSESSIONID=${session_id}`,
        },
      }
    )).json()
  ));
  return [...past_due, ...upcoming]
    .map(({
      name, categoryOid, assignedDate, dueDate, remark, oid,
      scoreElements: [{ score, pointMax }],
    }) => {
      // Get category name
      let category = "";
      for (const [cat, { oid }] of class_details.categories) {
        if (categoryOid === oid) {
          category = cat;
        }
      }

      return {
        name: name,
        category: category,
        date_assigned: new Date(assignedDate),
        date_due: new Date(dueDate),
        feedback: remark || "",
        assignment_id: oid,
        special: "",
        score: score,
        max_score: pointMax,
      };
    })
    .sort(({ date_due: d1, name: n1 }, { date_due: d2, name: n2 }) => {
      // Sort assignments in reverse chronological order by due date
      if (d1 > d2) return -1;
      if (d1 < d2) return 1;
      // If same due date, sort by name (case-insensitive)
      const n1u = n1.toUpperCase();
      const n2u = n2.toUpperCase();
      if (n1u < n2u) return -1;
      if (n1u > n2u) return 1;

      // Same due date and same name (up to capitalization differences)
      return 0;
    })
    // Convert Date objects to strings
    .map(({ date_assigned: da, date_due: dd, ...rest }) => ({
      date_assigned: da.toLocaleDateString("en-US"),
      date_due: dd.toLocaleDateString("en-US"),
      ...rest
    }));
}

function assemble_overview(class_details: ClassDetails[]): OverviewItem[] {
  return class_details.map(({
    name,
    grades,
    teacher,
    term,
    oid,
    attendance: { absent, tardy, dismissed },
  }) => {
    const [q1, q2, q3, q4] =
      [Quarter.Q1, Quarter.Q2, Quarter.Q3, Quarter.Q4].map(q =>
        parseFloat(grades.get(q) ?? ""));
    // Get all quarter grades that are not NaN, and average them to get the
    // year-to-date grade
    const quarter_grades = [q1, q2, q3, q4].filter(x => !isNaN(x));
    const ytd = quarter_grades.length ?
      quarter_grades.reduce((a, b) => a + b) / quarter_grades.length : NaN;
    // Custom function for formatting numbers so that NaN is mapped to the
    // empty string
    const format = (x: number) => isNaN(x) ? "" : x.toString();
    return {
      class: name,
      teacher: teacher,
      term: term,
      q1: format(q1),
      q2: format(q2),
      q3: format(q3),
      q4: format(q4),
      ytd: format(ytd),
      absent: format(absent),
      tardy: format(tardy),
      dismissed: format(dismissed),
    };
  });
}

/**
 * Download a PDF file by ID (from list_pdf_files)
 */
async function download_pdf(
  { session_id }: Session, id: string
): Promise<string> {
  return (await (await fetch(
    `https://aspen.cpsd.us/aspen/rest/reports/${id}/file`, {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
    }
  )).buffer()).toString("binary");
}

/**
 * Check if a quarter (e.g., Quarter.Q1) matches a term specification (e.g.,
 * "S1")
 */
async function match_termspec(
  session: Session, termspec: TermSpec, quarter: Quarter, year: Year
): Promise<boolean> {
  // Make sure that `quarter` is Q1, Q2, Q3, or Q4 and not Current
  if (quarter === Quarter.Current) {
    quarter = await get_current_quarter(session, year);
  }
  switch (termspec) {
    case "FY":
      return true;
    case "S1":
      return [Quarter.Q1, Quarter.Q2].includes(quarter);
    case "S2":
      return [Quarter.Q3, Quarter.Q4].includes(quarter);
    case "Q1":
      return quarter === Quarter.Q1;
    case "Q2":
      return quarter === Quarter.Q2;
    case "Q3":
      return quarter === Quarter.Q3;
    case "Q4":
      return quarter === Quarter.Q4;
    default: // Fallback in case Aspen gives some other termspec
      return true;
  }
}

/**
 * Log in to Aspen using a given username and password and execute the given
 * callback within that session, throwing an error upon an invalid login.
 */
async function get_session<T>(
  username: string, password: string,
  callback: (session: Session) => Promise<T>
): Promise<T> {
  // Get a session from Aspen by visiting the login page, and check if Aspen is
  // currently down
  let login_page;
  {
    let resp;
    try {
      resp = await fetch("https://aspen.cpsd.us/aspen/logon.do");
    } catch (e) {
      if (e instanceof FetchError) {
        throw new Error(AspineErrorCode.ASPENDOWN);
      } else {
        throw e;
      }
    }
    if (!resp.ok) {
      throw new Error(AspineErrorCode.ASPENDOWN);
    }
    login_page = await resp.text();
  }

  const [, session_id] = /sessionId='(.+)';/.exec(
    login_page
  ) as RegExpExecArray;
  const [, apache_token] =
    /name="org.apache.struts.taglib.html.TOKEN" value="(.+)"/.exec(
      login_page
    ) as RegExpExecArray;

  // Submit login username, password, and session information
  const login_response = await (await fetch(
    "https://aspen.cpsd.us/aspen/logon.do", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
      method: "POST",
      redirect: "manual",
      body: new URLSearchParams({
        "org.apache.struts.taglib.html.TOKEN": apache_token,
        "userEvent": "930",
        "deploymentId": "x2sis",
        "username": username,
        "password": password,
      }),
    }
  )).text();
  if (login_response.includes("Invalid login.")) {
    throw new Error(AspineErrorCode.LOGINFAIL);
  }

  const result = await callback({ session_id, apache_token });

  await (await fetch(
    "https://aspen.cpsd.us/aspen/logout.do", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
      redirect: "manual",
    }
  )).text();

  return result;
}

// Code for testing purposes
if (require.main === module) {
  get_student(
    process.env.USERNAME || "", process.env.PASSWORD || "", 1, Year.Previous
  ).then(
    console.log, e => {
      if (e.message === AspineErrorCode.LOGINFAIL) {
        console.error(`Error: ${e.message}`);
      } else {
        console.error(e);
      }
    }
  );
}
