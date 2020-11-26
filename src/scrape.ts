import fetch, { RequestInit } from "node-fetch";
import { URLSearchParams } from "url";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
};

type Session = {
  session_id: string,
  apache_token: string,
};

async function scrape_student(
  username: string, password: string, quarter: 0 | 1 | 2 | 3 | 4
) {
  const session = await scrape_login();
  if (!(await submit_login(username, password, session))) {
    return { "login_fail": true };
  }
  await scrape_pdf_files(session);
}

async function scrape_pdf_files({ session_id, apache_token }: Session) {
  const files = await (await fetch("https://aspen.cpsd.us/aspen/rest/reports", {
    headers: {
      "User-Agent": HEADERS["User-Agent"],
      "Cookie": `JSESSIONID=${session_id}`,
    },
  })).json();
  for (const { id, filename } of files) {
    console.log(filename);
    // TODO download the file
  }
}

async function scrape_login(): Promise<Session> {
  const page = await (await fetch("https://aspen.cpsd.us/aspen/logon.do", {
    headers: {
      "User-Agent": HEADERS["User-Agent"],
    },
  })).text();
  const [, session_id, ] = /sessionId='(.+)';/.exec(page) || [];
  const [, apache_token, ] =
    /name="org.apache.struts.taglib.html.TOKEN" value="(.+)"/.exec(page) || [];
  return { session_id, apache_token };
}

async function submit_login(
  username: string, password: string, { session_id, apache_token }: Session
): Promise<boolean> {
  const page = await (await fetch("https://aspen.cpsd.us/aspen/logon.do", {
    headers: {
      "User-Agent": HEADERS["User-Agent"],
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
};
