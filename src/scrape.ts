import fetch, { RequestInit } from "node-fetch";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
};

type Session = {
  session_id: string,
  apache_token: string,
};

async function scrape_student(username: string, password: string,
    quarter: 0 | 1 | 2 | 3 | 4) {
  const session = await scrape_login(username, password);
  return session;
}

async function scrape_login(username: string, password: string):
Promise<Session> {
  const page = await fetch_body("https://aspen.cpsd.us/aspen/logon.do", {
    headers: {
      "User-Agent": HEADERS["User-Agent"],
    },
  });
  const [, session_id, ] = /sessionId='(.+)';/.exec(page) || [];
  const [, apache_token, ] =
    /name="org.apache.struts.taglib.html.TOKEN" value="(.+)"/.exec(page) || [];
  return { session_id, apache_token };
}

async function fetch_body(url: string, options?: RequestInit):
Promise<string> {
  return (await fetch(url, options)).text();
}

// Code for testing purposes
if (require.main === module) {
  const [username, password, ..._] = process.argv.slice(2);
  scrape_student(username, password, 0).then(console.log);
}

module.exports = {
  scrape_student,
};
