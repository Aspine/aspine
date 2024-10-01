/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import fetch, { FetchError } from "node-fetch";
import { URLSearchParams } from "url";
import { JSDOM } from "jsdom";
import puppeteer from 'puppeteer-extra';
import { Buffer } from "buffer";
import randomUseragent from 'random-useragent';
import puppeteerStealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(puppeteerStealthPlugin());
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
import { createValidAbsoluteUrl } from "pdfjs-dist";
const encode = (str: string):string => Buffer.from(str, 'binary').toString('base64');
export async function get_student(
  username: string, password: string, quarter: Quarter = Quarter.Current,
  year: Year = Year.Current
): Promise<StudentData> {
  console.log('get_student')
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
        "PE 10-12 Wellness Elective", "PE RSTA", "Falcon Block Balance", "Falcon Pathway",
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
  console.log('get pdfs')
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
  console.log('get_sechedule')
  return await get_session(username, password, async session => {
    const current_quarter = await get_current_quarter(session, Year.Current);
    let current_semester;
    if (current_quarter <= 2) {
      current_semester = 1;
    }
    else {
      current_semester = 2;
    }
    const initial_page = await (await fetch(
      "https://aspen.cpsd.us/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list", {
        headers: {
          "Cookie": `JSESSIONID=${session.session_id};`,
        },
      }
    )).text();
    // This is a term OID that is specific to the schedule view (not the same
    // as the OIDs in the output of get_quarter_oids)
    // currently uses semester view to scrape, quarter view behaved weirdly, can switch back easily though
    const [, term_oid] = new RegExp(
      String.raw`<option value="(.+)">S${current_semester}</option>`
    ).exec(initial_page) as RegExpExecArray;

    const schedule_page = await (await fetch(
      "https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?" +
      new URLSearchParams({
        "navkey": "myInfo.sch.matrix",
        "termOid": term_oid,
      }), {
        headers: {
          "Cookie": `JSESSIONID=${session.session_id}; deploymentId=x2sis; showNavbar=true`,
        },
      }
    )).text();

    const { window: { document } } = new JSDOM(schedule_page);

    const rows = document.querySelectorAll(
      "table[cellspacing='1'] > tbody > tr:not([class])"
    );

    // Get a matrix of the cells in the first three columns of the table, then
    // transpose it to get a list of periods, a list of silver day classes
    // (from Thursday), and a list of black day classes (from Friday).

    const transpose = <T>(matrix: T[][]): T[][] =>
      matrix[0].map((col, i) => matrix.map(row => row[i]));
    // Transpose algorithm: https://stackoverflow.com/a/46805290

    // row => [1, 5, 6] will get the periods from column 1 and all the class names from Thursday (row 5) and Friday (row 6)
    const [periods, silver_html, black_html] = transpose([...rows].map(row =>
      [1, 5, 6].map(n =>
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
  quarter_id: string, year: Year, student_oid:String
): Promise<Stats | {}> {
  console.log('get_stats')
  return await get_session(username, password, async ({ session_id }) => {
    // The REST API does not expose assignment statistics (as far as we know),
    // so we need to use the regular Aspen desktop site. Aspen is picky about
    // the order in which requests are made, so we need to carry out some
    // preliminaries:

    // Get list of classes
    const class_list_page = await (await fetch( // BROKEN
      `https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?count=25&customParams=selectedYear%7Ccurrent;selectedTerm%7Ccurrent&fieldSetOid=fsnX2ClsMbl+++&filter=%23%23%23all&offset=1&selectedStudent=${student_oid}&sort=default&unique=true`,
      {
        "headers": {
          "Cookie": `JSESSIONID=${session_id};`,
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
        "Cookie": `JSESSIONID=${session_id};`,
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
          "Cookie": `deploymentId=x2sis; JSESSIONID=${session_id};`,
        },
      }
    );

    // Change term in assignments list
    await fetch("https://aspen.cpsd.us/aspen/portalAssignmentList.do", {
      headers: {
        "Cookie": `JSESSIONID=${session_id};`
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
        "Cookie": `JSESSIONID=${session_id};`,
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
        "Cookie": `JSESSIONID=${session.session_id}; deploymentId=x2sis; showNavbar=true`,
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
  [...document.querySelectorAll("gradebookScore")].map(x => {
    let item = Object.fromEntries([
      "date", "classname", "grade", "assignmentname",
    ].map(att => [att, x.getAttribute(att)])) as any;

    item.score = item.grade;
    item.assignment = item.assignmentname;
    delete item.grade;
    delete item.assignmentname;
    return item as ActivityEvent;
  });
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
  // TODO: this
  // If not current year, the "current" quarter is undefined and we can just
  // let it be Q1
  if (year != Year.Current) {
    return Quarter.Q1;
  }

  let oid: string;
  if (class_info) {
    console.log("class ifno");
    ({ oid } = class_info);
  } else {
    const { student_oid } = await get_student_info(session);
    var param = new URLSearchParams({
      "selectedStudent": student_oid,
      "customParams": `selectedYear|${year};selectedTerm|all`,
    });
    // console.log(param);
    var url = "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?count=25&" + param + "&fieldSetOid=fsnX2Cls++++++";
    [{ oid }] = await (await fetch(
      url, {
        headers: {
          "Cookie": `JSESSIONID=${session.session_id}; deploymentId=x2sis; showNavbar=true`,
        },
      }
    )).json();
  }

  const { currentTermIndex } = await (await fetch(
    `https://aspen.cpsd.us/aspen/rest/studentSchedule/${oid}/gradeTerms`, {
      headers: {
        "Cookie": `JSESSIONID=${session.session_id}; deploymentId=x2sis; showNavbar=true`,
      },
    }
  )).json();

  if (currentTermIndex + 1 in Quarter) {
    return currentTermIndex + 1;
  } else {
    return Quarter.Q2;
  }
}

/**
 * Get a list of published reports (PDF files)
 */
async function list_pdf_files({ session_id }: Session): Promise<PDFFileInfo[]> {
  const pdf_files: any[] = await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/reports", {
      headers: {
        "Cookie": `JSESSIONID=${session_id};`,
      },
    }
  )).json();
  try{
    return pdf_files.filter(({ contentTypeId }) => contentTypeId == "cttPdf");
  } catch (e) {
    console.log(pdf_files)
    return [];
  }
}

/**
 * Get name and OID of student
 */
async function get_student_info({ session_id }: Session): Promise<{
  student_name: string, student_oid: string
}> {
  const a =  await fetch(
    "https://aspen.cpsd.us/aspen/rest/users/students", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
    }
  )
  console.log(a)
  const [{ name: student_name, studentOid: student_oid }] = await (a.json());
  console.log(student_name, student_oid);
  return { student_name, student_oid };
}

async function get_quarter_oids(
  session: Session, year: Year
): Promise<Map<Quarter, string>> {
  const mapping = new Map<Quarter, string>();
  const terms: { gradeTermId: string, oid: string }[] = await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list/studentGradeTerms?count=25&customParams=selectedYear%7Ccurrent;selectedTerm%7Ccurrent&fieldSetOid=fsnX2ClsMbl+++&filter=%23%23%23all&offset=1&selectedStudent=stdX2002104931&sort=default&unique=true", {
      headers: {
        "Cookie": `JSESSIONID=${session.session_id}; deploymentId=x2sis; showNavbar=true`,
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
  // ISSUE IS THAT STUDENT_OID = NULL https://aspen.cpsd.us/aspen/rest/users/students?count=25&customParams=selectedYear%7Ccurrent;selectedTerm%7Ccurrent&fieldSetOid=fsnX2ClsMbl+++&filter=%23%23%23all&offset=1&selectedStudent=stdX2002104931&sort=default&unique=true
  //    "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list/studentGradeTerms?count=25&customParams=selectedYear%7Ccurrent;selectedTerm%7Ccurrent&fieldSetOid=fsnX2ClsMbl+++&filter=%23%23%23all&offset=1&selectedStudent=stdX2002104931&sort=default&unique=true", {

  const get_classes = async (quarter_oid: string) => await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?" +
    new URLSearchParams({
      "count":"25",
      "customParams": `selectedYear|${year};selectedTerm|${quarter_oid}`,
      "selectedStudent": student_oid,
    }) + "&fieldSetOid=fsnX2ClsMbl++++++&filter=%23%23%23all&offset=1&sort=default&unique=true", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}; deploymentId=x2sis; showNavbar=true`,
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
        "Cookie": `JSESSIONID=${session_id}; deploymentId=x2sis; showNavbar=true`,
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
          "Cookie": `JSESSIONID=${session_id}; deploymentId=x2sis; showNavbar=true`,
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
        "Cookie": `JSESSIONID=${session_id}; deploymentId=x2sis; showNavbar=true`,
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
export async function get_session<T>(
  username: string, password: string,
  callback: (session: Session) => Promise<T>
): Promise<any> {
  // Get a session from Aspen by visiting the login page, and check if Aspen is
  // currently down
  const headless = false; // if I put /?headless=false then it will have a head, for debugging
  const userAgent = randomUseragent.getRandom();
  
  const browser = await puppeteer.launch({ headless });
	const page = await browser.newPage();
  await page.setViewport({
    width: 1920 + Math.floor(Math.random() * 100),
    height: 3000 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: true,
});
await page.setUserAgent(userAgent);
await page.setJavaScriptEnabled(true);
// await page.setDefaultNavigationTimeout(0);
  const url = 'https://aspen.cpsd.us/aspen/logonSSO.do?deploymentId=ma-cambridge&districtId=*dst&idpName=Cambridge%20Google%20SAML'
  // var windowVar = localStorage.getItem('windowVar')
  
	try { 
    // console.log(globalThis.window)
    // let win = globalThis.window?.open(url, '_blank');
    
    // console.log(win)
    // window.document.write('<iframe src="https://aspen.cpsd.us/aspen/logonSSO.do?deploymentId=ma-cambridge&districtId=*dst&idpName=Cambridge%20Google%20SAML"></iframe>');
		// nice thing of aspen to make a page just to redirect to the write sso link
		await page.goto(
			'https://aspen.cpsd.us/aspen/logonSSO.do?deploymentId=ma-cambridge&districtId=*dst&idpName=Cambridge%20Google%20SAML'
		);
    
    await page.setDefaultNavigationTimeout(60000); // increase the timeout cus aspen be slow
    let waitForSelectorOptions = { visible: true, timeout: 3000 };
		// because its google sso, input the email
		await page.waitForSelector('input[type="email"]');
		console.log('inputting email:', username);
		await page.type('input[type="email"]', username);
		await page.keyboard.press('Enter');
		console.log('email entered');
		// input password once it exists on the page
    try{
		  await page.waitForSelector('input[type="password"]', waitForSelectorOptions);
    }
    catch (e) {
      console.log(e)
      // for debugging  
      if (false){
      let sshot = await page.screenshot();
      function encode (input: Uint8Array) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
    
        while (i < input.length) {
            chr1 = input[i++];
            chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
            chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here
    
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
    
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                      keyStr.charAt(enc3) + keyStr.charAt(enc4);
        }
        return output;
    }
      // let file = new File([new Uint8Array(sshot)], 'screenshot.png', { type: 'png' });
      let img = 'data:image/png;base64,'+encode(sshot);
      console.log(img)
  }
      throw new Error(AspineErrorCode.LOGINFAIL);


    }
		console.log('inputting password');
		await page.type('input[type="password"]', password);
		await page.keyboard.press('Enter');
		console.log('password entered');
		// wait for it to go back to aspen
		await page.waitForNavigation();
    await page.waitForNetworkIdle();
		console.log('navigated back to aspen');
		// only work if its cpsd.us, there are some edge cases where it was trying to load the wrong url and hanging
		const currentUrl = page.url();
		if (currentUrl.includes('.cpsd.us')) {
			console.log('got aspen');
			const jsessionid = currentUrl.match(/jsessionid=([^&]*)/)![1];

			// store the session id as a cooky
			await page.setCookie({
				name: 'JSESSIONID',
				value: jsessionid,
				domain: '.cpsd.us',
				path: '/',
				//maxAge: 900 // im guessing 15 min for session length
			}); // TODO: whenever we need to get something from aspen, if the request fails, expire the cookie
			console.log('set cookie')
			console.log('JSESSIONID:', jsessionid);
      const page_content = await page.content();
      const [, apache_token] =
      /name="org.apache.struts.taglib.html.TOKEN" value="(.+)"/.exec(
        page_content
      ) as RegExpExecArray;
			await browser.close();
			console.log('browser closed');
			// return the session
			return callback({ session_id: jsessionid, apache_token });
			
		} else {
			console.error('not a district domain: ' + currentUrl);
			await browser.close();
			return new Response(
				JSON.stringify({ error: 'not a district domain (json)' }),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}
	} catch (error) {
		console.error('puppet not happy :c so heres the error:', error);
		await browser.close();
		return new Response(JSON.stringify({ error: 'something went wrong' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
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
