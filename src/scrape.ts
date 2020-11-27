import fetch from "node-fetch";
import { URLSearchParams } from "url";

type Session = {
  session_id: string,
  apache_token: string,
};

type PDFFileInfo = {
  id: string,
  filename: string,
};

type PDFFile = {
  title: string,
  content: string,
};

type ClassInfo = {
  name: string,
  grade: string,
  oid: string,
};

const enum Quarter {
  Current = 0,
  Q1,
  Q2,
  Q3,
  Q4,
}

async function scrape_student(
  username: string, password: string, quarter: Quarter
) {
  const session = await scrape_login();
  // Log in to Aspen
  if (!(await submit_login(username, password, session))) {
    return { "login_fail": true };
  }
  const { student_name, student_oid } = await get_student_info(session);
  const quarter_oid = await get_quarter_oid(session, quarter);
  console.log(await scrape_academics(session, student_oid, quarter_oid));
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
async function scrape_academics(
  { session_id }: Session, student_oid: string, quarter_oid: string
): Promise<ClassInfo[]> {
  const classes = await (await fetch(
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
async function scrape_pdf_files(session: Session): Promise<PDFFile[]> {
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
  return (await (await fetch("https://aspen.cpsd.us/aspen/rest/reports", {
    headers: {
      "Cookie": `JSESSIONID=${session_id}`,
    },
  })).json()).filter(({ contentTypeId }) => contentTypeId);
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
 * Scrape the Aspen login page and return a session ID and Apache token
 */
async function scrape_login(): Promise<Session> {
  const page = await (await fetch(
    "https://aspen.cpsd.us/aspen/logon.do"
  )).text();
  const [, session_id, ] = /sessionId='(.+)';/.exec(page) || [];
  const [, apache_token, ] =
    /name="org.apache.struts.taglib.html.TOKEN" value="(.+)"/.exec(page) || [];
  return { session_id, apache_token };
}

/**
 * Log in to Aspen under a given session using a given username and password.
 * The return value indicates the success of the login.
 */
async function submit_login(
  username: string, password: string, { session_id, apache_token }: Session
): Promise<boolean> {
  const page = await (await fetch("https://aspen.cpsd.us/aspen/logon.do", {
    headers: {
      "Cookie": `JSESSIONID=${session_id}`,
    },
    method: "POST",
    body: new URLSearchParams({
      "org.apache.struts.taglib.html.TOKEN": apache_token,
      "userEvent": "930",
      "deploymentId": "x2sis",
      "username": username,
      "password": password,
    }),
  })).text();
  return !page.includes("Invalid login.");
}

// Code for testing purposes
if (require.main === module) {
  const [username, password, ..._] = process.argv.slice(2);
  scrape_student(username, password, 0).then(console.log);
}

module.exports = {
  scrape_student,
  scrape_pdf_files,
};
