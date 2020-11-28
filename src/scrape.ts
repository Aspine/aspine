import fetch from "node-fetch";
import { URLSearchParams } from "url";

import type { Session, PDFFileInfo, PDFFile, ClassInfo } from "./types";
// Using `import type` with an enum disallows accessing the enum variants
import { Quarter } from "./types";

async function get_student(
  username: string, password: string, quarter: Quarter
) {
  const session = await login(username, password);
  const { student_name, student_oid } = await get_student_info(session);
  const quarter_oid = await get_quarter_oid(session, quarter);
  const academics = await get_academics(session, student_oid, quarter_oid);
  try {
    await logout(session);
  } catch (e) {}
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

async function get_quarter_oid(
  { session_id }: Session, quarter: Quarter
): Promise<string> {
  if (quarter !== Quarter.Current) {
    const term_mapping = await (await fetch(
      "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list/studentGradeTerms", {
        headers: {
          "Cookie": `JSESSIONID=${session_id}`,
        },
      }
    )).json();
    for (const { gradeTermId, oid } of term_mapping) {
      if (gradeTermId === `Q${quarter}`) {
        return oid;
      }
    }
  }
  return "current";
}

/**
 * Get basic information about classes
 */
async function get_academics(
  { session_id }: Session, student_oid: string, quarter_oid: string
): Promise<ClassInfo[]> {
  const classes: any[] = await (await fetch(
    "https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?" +
    new URLSearchParams({
      "selectedStudent": student_oid,
      "customParams": `selectedYear|current;selectedTerm|${quarter_oid}`,
    }), {
      headers: {
        "Cookie": `JSESSIONID=${session_id}`,
      },
    }
  )).json();
  return classes.map(({
    cfTermAverage, oid, relSscMstOid_mstDescription
  }) => ({
    name: relSscMstOid_mstDescription,
    grade: cfTermAverage,
    oid: oid,
  }));
}

/**
 * Return an array containing all PDF files
 */
async function get_pdf_files(session: Session): Promise<PDFFile[]> {
  const pdf_files = await list_pdf_files(session);
  return await Promise.all(pdf_files.map(async ({ id, filename }) => ({
    title: filename,
    content: await download_pdf(session, id),
  })));
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
 * Log in to Aspen using a given username and password, returning a session.
 * Always make sure to close the session afterwards with logout().
 */
async function login(username: string, password: string): Promise<Session> {
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
  const page = await (await fetch("https://aspen.cpsd.us/aspen/logon.do", {
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
  })).text();

  if (page.includes("Invalid login.")) {
    throw new Error("Invalid login");
  }

  return { session_id, apache_token };
}

/**
 * Log out of Aspen, destroying the given session.
 */
async function logout({ session_id }: Session): Promise<void> {
  const page = await (await fetch("https://aspen.cpsd.us/aspen/logout.do", {
    headers: {
      "Cookie": `JSESSIONID=${session_id}`,
    },
    redirect: "manual",
  })).text();

  if (page.includes("You are not logged on or your session has expired.")) {
    throw new Error("Logout failed");
  }
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
