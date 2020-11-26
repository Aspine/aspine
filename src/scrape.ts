import fetch from "node-fetch";
import { URLSearchParams } from "url";

type Session = {
  session_id: string,
  apache_token: string,
};

type PDFFile = {
  title: string,
  content: string,
};

async function scrape_student(
  username: string, password: string, quarter: 0 | 1 | 2 | 3 | 4
) {
  const session = await scrape_login();
  if (!(await submit_login(username, password, session))) {
    return { "login_fail": true };
  }
}

/**
 * Returns an array containing all PDF files
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
async function list_pdf_files(
  { session_id, apache_token }: Session
): Promise<{ id: string, filename: string, contentTypeId: string }[]> {
  return await (await fetch("https://aspen.cpsd.us/aspen/rest/reports", {
    headers: {
      "Cookie": `JSESSIONID=${session_id}`,
    },
  })).json();
}

/**
 * Download a PDF file by ID (from list_pdf_files)
 */
async function download_pdf(
  { session_id, apache_token }: Session, id: string
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
