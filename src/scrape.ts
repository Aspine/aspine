import fetch from "node-fetch";
import { URLSearchParams } from "url";
import { JSDOM } from "jsdom";

import type {
  Session,
  PDFFileInfo,
  ClassInfo,
  ClassDetails,
} from "./types";

import type {
  PDFFile,
  OverviewItem,
  Schedule,
  ScheduleItem
} from "./types-shared";

// Using `import type` with an enum disallows accessing the enum variants
import { Quarter } from "./types-shared";

export async function get_student(
  username: string, password: string, quarter: Quarter
) {
  return await get_session(username, password, async session => {
    const { student_name, student_oid } = await get_student_info(session);
    const quarter_oids = await get_quarter_oids(session);
    const academics = await get_academics(session, student_oid, quarter_oids);
    const class_details = await Promise.all(academics.map(async class_info =>
      get_class_details(session, class_info)));
    const overview = assemble_overview(class_details);
    return overview;
  });
}

/**
 * Return an array containing all PDF files
 */
export async function get_pdf_files(
  username: string, password: string
): Promise<PDFFile[]> {
  return await get_session(username, password, async session => {
    const pdf_files = await list_pdf_files(session);
    return await Promise.all(pdf_files.map(async ({ id, filename }) => ({
      title: filename,
      content: await download_pdf(session, id),
    })));
  });
}

export async function get_schedule(
  username: string, password: string
): Promise<Schedule> {
  return await get_session(username, password, async session => {
    const current_quarter = await get_current_quarter(session);
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
            return textarea.value;
          });
          const aspenPeriod = periods[i];

          return { id, name, teacher, room, aspenPeriod }
        }
      }).filter(isScheduleItem)
    );

    return { black, silver };
  });
}


/**
 * Get the current quarter (Q1, Q2, Q3, Q4). In the absence of the OID of a
 * class (which can be fetched from get_academics), this function makes a
 * request to get the OID of one class.
 */
async function get_current_quarter(
  session: Session, class_info?: ClassInfo
): Promise<Quarter> {
  let oid: string;
  if (class_info) {
    ({ oid } = class_info);
  } else {
    const { student_oid } = await get_student_info(session);
    [{ oid }] = await (await fetch(
      "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?fieldSetOid=fsnX2Cls++++++&" +
      new URLSearchParams({
        "selectedStudent": student_oid,
        "customParams": "selectedYear|current;selectedTerm|all",
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
  { session_id }: Session
): Promise<Map<Quarter, string>> {
  const mapping = new Map<Quarter, string>();
  const terms: { gradeTermId: string, oid: string }[] = await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list/studentGradeTerms", {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
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
  mapping.set(Quarter.Current, "current");
  return mapping;
}

/**
 * Get basic information (name, grades, teacher, term, and OID) about classes
 */
async function get_academics(
  { session_id }: Session, student_oid: string,
  quarter_oids: Map<Quarter, string>
): Promise<ClassInfo[]> {
  const get_classes = async (quarter_oid: string) => await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?fieldSetOid=fsnX2Cls++++++&" +
    new URLSearchParams({
      "selectedStudent": student_oid,
      "customParams": `selectedYear|current;selectedTerm|${quarter_oid}`,
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
  for (const [quarter, quarter_oid] of quarter_oids) {
    term_classes_mapping.set(
      quarter,
      // Construct a 2D array with elements [oid, rest] where
      // rest is the object containing class info, then convert that to a
      // Map<string, any>
      new Map<string, any>((await get_classes(quarter_oid)).map(
        ({oid, ...rest}) => [oid, rest]
      ))
    );
  }

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
  const categories: { [key: string]: string } = {};
  for (const {
    category, percentageQ1, percentageQ2, percentageQ3, percentageQ4
  } of averageSummary) {
    if (category !== "Gradebook average") {
      categories[category] = (parseFloat(percentageQ1 || percentageQ2 ||
        percentageQ3 || percentageQ4) / 100.0).toString();
    }
  }

  return { attendance, categories, ...class_info };
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
      quarter_grades.reduce((a, b) => a + b) : NaN;
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
  return await (await fetch(
    `https://aspen.cpsd.us/aspen/rest/reports/${id}/file`, {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
    }
  )).text();
}

/**
 * Log in to Aspen using a given username and password and execute the given
 * callback within that session, throwing an error upon an invalid login.
 */
async function get_session<T>(
  username: string, password: string,
  callback: (session: Session) => Promise<T>
): Promise<T> {
  // Get a session from Aspen by visiting the login page
  const login_page = await (await fetch(
    "https://aspen.cpsd.us/aspen/logon.do"
  )).text();
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
    throw new Error("Invalid login");
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
  const [username, password] = process.argv.slice(2);
  get_student(username, password, 1).then(
    console.log, e => {
      if (e.message === "Invalid login") {
        console.error(`Error: ${e.message}`);
      } else {
        console.error(e);
      }
    }
  );
}
