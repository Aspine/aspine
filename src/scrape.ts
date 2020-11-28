import fetch from "node-fetch";
import { URLSearchParams } from "url";

import type { Session, PDFFileInfo, PDFFile, ClassInfo } from "./types";
// Using `import type` with an enum disallows accessing the enum variants
import { Quarter } from "./types";

async function get_student(
  username: string, password: string, quarter: Quarter
) {
  return await get_session(username, password, async session => {
    const { student_name, student_oid } = await get_student_info(session);
    const quarter_oids = await get_quarter_oids(session);
    return await get_academics(session, student_oid, quarter_oids);
  });
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
    const [, quarter] = /^Q(\d)$/.exec(gradeTermId) || [];
    const quarter_num = parseInt(quarter) ?? -1;
    if (quarter_num in Quarter) {
      mapping.set(quarter_num, oid);
    }
  }
  mapping.set(Quarter.Current, "current");
  return mapping;
}

/**
 * Get basic information (name, term grades, and OID) about classes
 */
async function get_academics(
  { session_id }: Session, student_oid: string,
  quarter_oids: Map<Quarter, string>
): Promise<ClassInfo[]> {
  const get_classes = async (quarter_oid: string) => await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?" +
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
  return all_classes.map(({ oid, relSscMstOid_mstDescription: name }) => {
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
    return { name, oid, grades };
  });
}

/**
 * Return an array containing all PDF files
 */
async function get_pdf_files(
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
  const [, session_id] = /sessionId='(.+)';/.exec(login_page) || [];
  const [, apache_token] =
    /name="org.apache.struts.taglib.html.TOKEN" value="(.+)"/.exec(
      login_page
    ) || [];

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
    console.log,
    e => console.error(`Error: ${e.message}`)
  );
}

module.exports = {
  get_student,
  get_pdf_files,
};
