#!/bin/node

// --------------- Parameters ----------------
const THREADS = 8;

// -------------------------------------------


// --------------- Includes ------------------
const fetch = require('node-fetch');
const cheerio = require('cheerio')

// -------------------------------------------


// --------------- Scraping ------------------
// Returns object of classes
async function scrape_student(username, password) {
    let scrapers = [];
    // Spawn class scrapers
    for(let i = 0; i < THREADS; i++) {
        scrapers[i] = scrape_class(username, password, i);
    }

    // Await on all class scrapers
    for(let i = 0; i < THREADS; i++) {
        console.log(await scrapers[i]);
    }
}

// Returns promise that contains object of all class data
function scrape_class(username, password, i) {
    return new Promise(async function(resolve, reject) {
        // Login
        let session = await scrape_login();
        await submit_login(username, password,
            session.apache_token, session.session_id);
        // If first to login, get academics page, else wait
        // ^^^ So that we only make one request to academics page -- slight speed improvement
        //    ^^^ ignoring this for now
        await scrape_academics(session.session_id);
        
        // Get class data page by page

        resolve("Finished scraping " + i);
    });
}

// Returns object with apache_token and session_id
async function scrape_login(username, password) {
    let page = await fetch_body("https://aspen.cpsd.us/aspen/logon.do",
        {"credentials":"include",
            "headers":{},
            "referrer":"https://aspen.cpsd.us/aspen/logon.do",
            "referrerPolicy":"strict-origin-when-cross-origin",
            "body":null,
            "method":"GET",
            "mode":"cors"});
    const session_id = page.substr(page.indexOf("jsessionid=") + "jsessionid=".length, 32);
    const apache_token = page.substr(page.indexOf("TOKEN\" value=\"") + "TOKEN\" value=\"".length, 32);
    return {"session_id": session_id, "apache_token": apache_token};
}

// Submits login with creds and session
async function submit_login(username, password, apache_token, session_id) {
    let page = await fetch_body("https://aspen.cpsd.us/aspen/logon.do",
        {"credentials":"include",
            "headers":{"Origin" : "https://aspen.cpsd.us",
                "Accept-Encoding" : "gzip, deflate, br", 
                "Accept-Language" : "en-US,en", 
                "X-DevTools-Emulate-Network-Conditions-Client-Id" : "969B8CEF25CCA839B3F22A036F8389AB", 
                "Cookie" : "deploymentId=x2sis; JSESSIONID=" + session_id,
                "Connection" : "keep-alive", 
                "X-Do-Not-Track" : "1", 
                "Upgrade-Insecure-Requests" : "1", 
                "User-Agent" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.11.2 Chrome/65.0.3325.230 Safari/537.36", 
                "Content-Type" : "application/x-www-form-urlencoded", 
                "Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8", 
                "Cache-Control" : "max-age=0", 
                "Referer" : "https://aspen.cpsd.us/aspen/logon.do", 
                "DNT" : "1"}, 
            "referrer":"https://aspen.cpsd.us/aspen/logon.do", 
            "referrerPolicy":"strict-origin-when-cross-origin", 
            "body":"org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=930&userParam=&operationId=&deploymentId=x2sis&scrollX=0&scrollY=0&formFocusField=username&mobile=false&SSOLoginDone=&username=" + username + "&password=" + password, 
            "method":"POST", 
            "mode":"cors"}); 
}

// Returns object with classes (name, percentage, id) and student oid
async function scrape_academics(session_id) {
    let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/portalClassList.do?navkey=academics.classes.list",
        {"credentials":"include",
            "headers":{"Cookie" : "deploymentId=x2sis; JSESSIONID=" + session_id,
                "DNT" : "1",
                "Accept-Encoding" : "gzip, deflate, br",
                "Accept-Language" : "en-US,en",
                "Upgrade-Insecure-Requests" : "1",
                "User-Agent" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.11.2 Chrome/65.0.3325.230 Safari/537.36",
                "Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "X-DevTools-Emulate-Network-Conditions-Client-Id" : "969B8CEF25CCA839B3F22A036F8389AB",
                "Referer" : "https://aspen.cpsd.us/aspen/home.do",
                "Connection" : "keep-alive",
                "X-Do-Not-Track" : "1"},
            "referrer":"https://aspen.cpsd.us/aspen/home.do",
            "referrerPolicy":"strict-origin-when-cross-origin",
            "body":null,
            "method":"GET",
            "mode":"cors"}));
    $("#dataGrid a").each(function(i, elem) { console.log($(this).text()); });
}

// Returns object with categories (name, weight) as a dictionary and apache_token
function scrape_details(session_id, class_id, oid) {}

// Returns object with assignments (name, category, score, max_score)
function scrape_assignments(session_id) {}

// Returns body of fetch
async function fetch_body(url, options) {
    return (await fetch(url, options)).text();
}

// -------------------------------------------


// ------------ TESTING ONLY -----------------
var prompt = require('prompt');
var schema = {
    properties: {
        username: {
            pattern: /^[0-9]+$/,
            message: 'Username must be your student id',
            required: true
        },
        password: {
            hidden: true,
            required: true
        }
    }
};

prompt.start();
prompt.get(schema, function(err, result) {
    scrape_student(result.username, result.password);
});

// -------------------------------------------
