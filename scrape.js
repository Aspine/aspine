#!/usr/bin/node


// --------------- Parameters ----------------
// Multi-Threads
const CLASS_THREADS = 10;
const PDF_THREADS = 5;

// Solo-Threads
const SCHEDULE_THREAD = CLASS_THREADS + PDF_THREADS + 1;
const RECENT_THREAD = SCHEDULE_THREAD + 1;

// Constant headers
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.2 Chrome/69.0.3497.128 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en",
    "Accept-Encoding": "gzip, deflate, br"
};

// -------------------------------------------


// --------------- Includes ------------------
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const express = require('express');
const util = require('util');
const concat = require('concat-stream');
const fs = require('fs');
const streams = require('memory-streams');

// Initialize with the string


// -------------------------------------------

// --------------- Exports -------------------
module.exports = {
    scrape_student: scrape_student,
    scrape_schedule: scrape_schedule,
    scrape_pdf_files: scrape_pdf_files,
    scrape_assignmentDetails: scrape_assignmentDetails
};

// -------------------------------------------

// --------------- Scraping ------------------
// Returns object of classes
async function scrape_student(username, password, quarter) {

  if (quarter == 0) {

    // Spawn class scrapers
    let class_scrapers = [];
    for (let i = 0; i < CLASS_THREADS; i++) {
      class_scrapers[i] = scrape_class(username, password, i);
    }

    // Spawn recent activity scraper
    let recent_scraper = scrape_recent(username, password);
    let overview_scraper = scrape_overview(username, password);

    // Await on all class scrapers
    return {
      classes: (await Promise.all(class_scrapers)).filter(Boolean),
      recent: await recent_scraper,
      overview: await overview_scraper,
      username: username,
      quarter: quarter
    }



  } else {
    
    // quarter = parseFloat(quarter) + 1;
    // Spawn class scrapers
    let class_scrapers = [];
    for (let i = (quarter) * 10; i < CLASS_THREADS + (quarter ) * 10; i++) {
      class_scrapers[i] = scrape_quarter(username, password, i);
    }

    // Spawn recent activity scraper
    let recent_scraper = scrape_recent(username, password);

    // Await on all class scrapers
    return {
      classes: (await Promise.all(class_scrapers)).filter(Boolean),
      recent: await recent_scraper,
      username: username,
      quarter: quarter,
    }

  }
}

// Returns object of PDF files
async function scrape_pdf_files(username, password) {
    let pdf_scrapers = [];
    for (let i = 0; i < PDF_THREADS; i++) {
        pdf_scrapers[i] = scrape_pdf(username, password, i);
    }
    return (await Promise.all(pdf_scrapers)).filter(Boolean);
}

async function scrape_pdf(username, password, i) {
    return new Promise(async function(resolve, reject) {
        let session = await scrape_login();
        let page = await submit_login(username, password, session.apache_token, session.session_id);

        log(i, "session", session);

        let $ = cheerio.load(await fetch_body(
            "https://aspen.cpsd.us/aspen/publishedReportsWidget.do?groupPageWidgetOid=GPW0000006UKen&widgetId=publishedReports_11", 
            {
                "credentials": "include",
                "headers": {
                    "Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id,
                    "Accept-Encoding": HEADERS["Accept-Encoding"],
                    "Accept-Language": HEADERS["Accept-Language"],
                    "User-Agent": HEADERS["User-Agent"],
                    "Accept": HEADERS["Accept"],
                    "Referer": "https://aspen.cpsd.us/aspen/home.do",
                    "Connection": "keep-alive"
                },
                "referrer": "https://aspen.cpsd.us/aspen/home.do",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors"
            }
        ));


        let oids = [];
        let deliveryRecipients = [];
        let filenames = [];
        let titles = [];
        $('.portletListCell').each(function(i, elem) {
            if ($(this).attr('id')) {
                let raw = ($(this).children().first().children().first().html());

                oids.push(raw.substr(raw.indexOf("oid") + 4, 14));

                deliveryRecipients.push(raw.substr(raw.indexOf("Recipient") + 10, 14));

                
                let raw_filename = raw.substr(raw.indexOf('class=\"fileIcon\"') + 17, raw.indexOf("<", raw.indexOf('class=\"fileIcon\"')) - raw.indexOf('class=\"fileIcon\"') - 17);
                filenames.push((raw_filename).replace(/ /g, "_") + ".pdf");

                let datetime = $(this).next().text().trim();
                let date = datetime.substr(0, datetime.indexOf(" "));

                let pretty_filename = raw_filename.split(' ').slice(0,2).join(' ');

                titles.push(pretty_filename + " " + date);
            }
        });

        let oid = oids[i];
        let deliveryRecipient = deliveryRecipients[i];
        let filename = filenames[i];
        let title = titles[i];

        (await fetch_body(
            "https://aspen.cpsd.us/aspen/fileDownload.do?propertyAsString=filFile&oid=" + oid + "&reportDeliveryRecipient=" + deliveryRecipient + "&deploymentId=x2sis",
            {
                "credentials": "include",
                "headers": {
                    "Connection": "keep-alive",
                    "Pragma": "no-cache",
                    "Cache-Control": "no-cache",
                    "Upgrade-Insecure-Requests": "1",
                    "User-Agent": HEADERS["User-Agent"],
                    "Accept": HEADERS["Accept"],
                    "Accept-Language": HEADERS["Accept-Language"],
                    "Accept-Encoding": HEADERS["Accept-Encoding"],
                    "Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id
                },
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors"
            }
        ));

        fileReturn = (await fetch_file(
            "https://aspen.cpsd.us/aspen/toolResult.do?&fileName=" + filename + "&downLoad=true",
            {
                "credentials": "include",
                "headers": {
                    "Connection": "keep-alive",
                    "Pragma": "no-cache",
                    "Cache-Control": "no-cache",
                    "Upgrade-Insecure-Requests": "1",
                    "User-Agent": HEADERS["User-Agent"],
                    "Accept": HEADERS["Accept"],
                    "Accept-Language": HEADERS["Accept-Language"],
                    "Accept-Encoding": HEADERS["Accept-Encoding"],
                    "Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id
                },
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors"
            }
        ));

        log(i, "closing");

        resolve({
            "title": title,
            "content": fileReturn
        });

    });
}

async function scrape_assignmentDetails(session_id, apache_token, assignment_id) {


    let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/portalAssignmentList.do", 
        {"credentials":"include",
            "headers":{
                "Connection": "keep-alive",
                "Cache-Control": "max-age=0",
                "Origin": "https://aspen.cpsd.us",
                "Upgrade-Insecure-Requests": "1",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.1 Chrome/69.0.3497.128 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en",
                "X-Do-Not-Track": "1",
                "DNT": "1",
                "Referer": "https://aspen.cpsd.us/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd",
                "Accept-Encoding": "gzip, deflate, br",
                "Cookie": "JSESSIONID=" + session_id + "; deploymentId=x2sis"
            },
            "referrer":"https://aspen.cpsd.us/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd",
            "referrerPolicy":"strict-origin-when-cross-origin",
            "body":"org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=2100&userParam=" + assignment_id + "&operationId=&deploymentId=x2sis&scrollX=0&scrollY=0&formFocusField=&formContents=&formContentsDirty=&maximized=false&menuBarFindInputBox=&categoryOid=&gradeTermOid=GTM0000000C1sB&jumpToSearch=&initialSearch=&allowMultipleSelection=true&scrollDirection=&fieldSetName=Default+Fields&fieldSetOid=fsnX2ClsGcd&filterDefinitionId=%23%23%23all&basedOnFilterDefinitionId=&filterDefinitionName=filter.allRecords&sortDefinitionId=default&sortDefinitionName=Date+due&editColumn=&editEnabled=false&runningSelection=",
            "method":"POST",
            "mode":"cors"}));

    (await fetch_body("https://aspen.cpsd.us/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd",
        {"credentials":"include",
            "headers":{"Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.0 Chrome/69.0.3497.128 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "X-Do-Not-Track": "1",
                "Accept-Language": "en-US,en",
                "DNT": "1",
                "Referer": "https://aspen.cpsd.us/aspen/portalClassDetail.do?navkey=academics.classes.list.detail",
                "Accept-Encoding": "gzip, deflate, br",
                "Cookie": "deploymentId=x2sis; JSESSIONID=" + session_id},
            "referrer":"https://aspen.cpsd.us/aspen/portalClassDetail.do?navkey=academics.classes.list.detail",
            "referrerPolicy":"strict-origin-when-cross-origin",
            "body":null,
            "method":"GET",
            "mode":"cors"}));

    let statistics = [];
    
    $('td[width="50%"]').eq(1).find('tr').parent().children().each(function(i, elem) {
        if (i > 1 && i < 6) {
            statistics[i - 2] = $(this).children().eq(1).text().trim();
        }
    });

    if (statistics.length < 3) {
        statistics = "No statistics data for this assignment";
    }

    return statistics;

}

// Changes the term
async function change_term_classes(session_id, apache_token, student_oid, termFilter, i) {
  let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/portalClassList.do",
    {"credentials":"include",
    "headers":{
      "Connection": "keep-alive",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache",
      "Origin": "https://aspen.cpsd.us",
      "Upgrade-Insecure-Requests": "1",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.2 Chrome/69.0.3497.128 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "DNT": "1",
      "Accept-Language": "en-US,en",
      "Referer": "https://aspen.cpsd.us/aspen/portalClassList.do?navkey=academics.classes.list",
      "Accept-Encoding": "gzip, deflate, br",
      "Cookie": "JSESSIONID=" + session_id + "; deploymentId=x2sis; _ga=GA1.3.481904573.1547755534; _ga=GA1.2.1668470472.1547906676; _gid=GA1.3.181249669.1555116763"
    },
    "referrer":"https://aspen.cpsd.us/aspen/portalClassList.do?navkey=academics.classes.list",
    "referrerPolicy":"strict-origin-when-cross-origin",
    "body":"org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=950&userParam=&operationId=&deploymentId=x2sis&scrollX=0&scrollY=0&formFocusField=termFilter&formContents=&formContentsDirty=&maximized=false&menuBarFindInputBox=&selectedStudentOid=" + student_oid + "&jumpToSearch=&initialSearch=&yearFilter=current&termFilter=" + termFilter + "&allowMultipleSelection=true&scrollDirection=&fieldSetName=Default+Fields&fieldSetOid=fsnX2Cls&filterDefinitionId=%23%23%23all&basedOnFilterDefinitionId=&filterDefinitionName=filter.allRecords&sortDefinitionId=default&sortDefinitionName=Schedule+term&editColumn=&editEnabled=false&runningSelection=",
    "method":"POST",
    "mode":"cors"}));

    // let data = {"classes": []};
    // $("#dataGrid a").each(function(i, elem) {
    // 	data.classes[i] = {};
    // 	data.classes[i].name = $(this).text();
    // 	data.classes[i].grade = $(this).parent()
    // 		.nextAll().eq(5).text().trim();
    // 	data.classes[i].id = $(this).parent().attr("id");
    // });
    // data.oid = $("input[name=selectedStudentOid]").attr("value");
    // data.apache_token = $("input[name='org.apache.struts.taglib.html.TOKEN']").attr("value");
  // data.termFilters = [];
  // $('select[name="termFilter"]').children().each(function(i, elem) {
  //   data.termFilters.push({"type": $(this).text(), "code": $(this).attr('value')});
  // });

  let data = {"classes": []};
    $("#dataGrid a").each(function(i, elem) {
        if ($(this).parent().nextAll().eq(0).text().trim() == "FY"
            || $(this).parent().nextAll().eq(0).text().trim() == "S1") {
            data.classes[i] = {};
            // data.classes[i].name = $(this).text();
            data.classes[i].name = $(this).parent()
                .nextAll().eq(3).text().trim();
            data.classes[i].grade = $(this).parent()
                .nextAll().eq(5).text().trim();
            data.classes[i].id = $(this).parent().attr("id");
        }
    });
    data.oid = $("input[name=selectedStudentOid]").attr("value");
    data.apache_token = $("input[name='org.apache.struts.taglib.html.TOKEN']").attr("value");
  data.termFilters = [];
  $('select[name="termFilter"]').children().each(function(i, elem) {
    data.termFilters.push({"type": $(this).text(), "code": $(this).attr('value')});
  });


    return data;
}

let scrape_overview = function(username, password) {

  return new Promise(async function(resolve, reject) {
    let session = await scrape_login();
    let page = await submit_login(username, password, session.apache_token, session.session_id);
    if (page.fail) {
      resolve({"login_fail": true});
    }
    let info = await get_home(session.session_id);


    let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/gradesWidget.do?org.apache.struts.taglib.html.TOKEN=" + info.apache_token + "&userEvent=950&userParam=&groupPageWidgetOid=gpwX2000000013&editMode=false&widgetId=grades_3&displayProperties=relSscMstOid.mstDescription%2CrelSscMstOid.mstStaffView%2CrelSscMstOid.mstTermView&studentOid=" + info.student_oid, {
        "credentials": "include",
        "headers": {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:71.0) Gecko/20100101 Firefox/71.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "X-Requested-With": "XMLHttpRequest",
            "Cookie": "JSESSIONID=" + session.session_id + "; deploymentId=x2sis"
        },
        "referrer": "https://aspen.cpsd.us/aspen/home.do",
        "method": "GET",
        "mode": "cors"
    }));


    let data = [];
     $("tr.gradesCell").each(function(i, elem) {
       // Description 	Teacher 	Schedule term 	Q1 	Q2 	Q3 	Q4 	YTD 	Abs 	Tdy 	Dsm
       let row = {};
       //row["name"] = $(this).find("a").first().text();
       //row["category"] = $(this).children().eq(2).text().trim();
       row["class"] = $(this).children().eq(0).text().trim();
       row["teacher"] = $(this).children().eq(1).text().trim();
       row["term"] = $(this).children().eq(2).text().trim();
       row["q1"] = $(this).children().eq(3).text().trim();
       row["q2"] = $(this).children().eq(4).text().trim();
       row["q3"] = $(this).children().eq(5).text().trim();
       row["q4"] = $(this).children().eq(6).text().trim();
       row["ytd"] = $(this).children().eq(7).text().trim();
       row["absent"] = $(this).children().eq(8).text().trim();
       row["tardy"] = $(this).children().eq(9).text().trim();
       row["dismissed"] = $(this).children().eq(10).text().trim();
       data.push(row);
     });
 
 
    log("closing");
    resolve(data );
  })
}




// Returns object of recent activity
async function scrape_recent(username, password) {
    return new Promise(async function(resolve, reject) {
        let session = await scrape_login();
        let page = await submit_login(username, password, session.apache_token, session.session_id);
        if (page.fail) {
            resolve({"login_fail": true});
        }



        let $ = cheerio.load(await fetch_body(
            "https://aspen.cpsd.us/aspen/studentRecentActivityWidget.do?preferences=%3C%3Fxml+version%3D%221.0%22+encoding%3D%22UTF-8%22%3F%3E%3Cpreference-set%3E%0A++%3Cpref+id%3D%22dateRange%22+type%3D%22int%22%3E3%3C%2Fpref%3E%0A%3C%2Fpreference-set%3E&rand=1551041157793", 
            {
                "credentials": "include",
                "headers": {
                    "Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id,
                    "Accept-Encoding": HEADERS["Accept-Encoding"],
                    "Accept-Language": HEADERS["Accept-Language"],
                    "User-Agent": HEADERS["User-Agent"],
                    "Accept": HEADERS["Accept"],
                    "Referer": "https://aspen.cpsd.us/aspen/home.do",
                    "Connection": "keep-alive",
                },
                "referrer":"https://aspen.cpsd.us/aspen/home.do",
                "referrerPolicy":"strict-origin-when-cross-origin",
                "body":null,
                "method":"GET",
                "mode":"cors"}), {
                xmlMode: true,
                normalizeWhitespace: true,
                decodeEntities: true});


        let studentName = $('recent-activity').attr('studentname');
        let recentAttendanceArray = [];
        let recentActivityArray = [];

        $('recent-activity').children().filter('periodAttendance')
            .each(function(i, elem) {
                recentAttendanceArray.push({
                    date: $(this).attr('date'),
                    period: $(this).attr('period'),
                    code: $(this).attr('code'),
                    classname: $(this).attr('classname'),
                    dismissed: $(this).attr('dismissed'),
                    absent: $(this).attr('absent'),
                    excused: $(this).attr('excused'),
                    tardy: $(this).attr('tardy'),
                });
            });
        log("recentAttendance", recentAttendanceArray);
        

        $('recent-activity').children().filter('gradebookScore')
            .each(function(i, elem) {
                recentActivityArray.push({
                    date: $(this).attr('date'),
                    classname: $(this).attr('classname'),
                    score: $(this).attr('grade'),
                    assignment: $(this).attr('assignmentname'),
                });
            });
        log("recentGrades", recentActivityArray);


        log("closing");
        resolve({
            recentAttendanceArray,
            recentActivityArray,
            studentName,
        });
    });
}


async function change_term_assignments(session_id, apache_token, student_oid, termFilter) {

  let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/portalAssignmentList.do",
    {"credentials":"include",
      "headers":{
        "Connection": "keep-alive",
        "Pragma": "no-cache",
        "Cache-Control": "no-cache",
        "Origin": "https://aspen.cpsd.us",
        "Upgrade-Insecure-Requests": "1",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.2 Chrome/69.0.3497.128 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "DNT": "1",
        "Accept-Language": "en-US,en",
        "Referer": "https://aspen.cpsd.us/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd",
        "Accept-Encoding": "gzip, deflate, br",
        "Cookie": "JSESSIONID=" + session_id + "; deploymentId=x2sis; _ga=GA1.3.481904573.1547755534; _ga=GA1.2.1668470472.1547906676; _gid=GA1.3.181249669.1555116763"
      },
      "referrer":"https://aspen.cpsd.us/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd",
      "referrerPolicy":"strict-origin-when-cross-origin",
      "body":"org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=2210&userParam=&operationId=&deploymentId=x2sis&scrollX=0&scrollY=0&formFocusField=gradeTermOid&formContents=&formContentsDirty=&maximized=false&menuBarFindInputBox=&categoryOid=&gradeTermOid=" + termFilter + "&jumpToSearch=&initialSearch=&allowMultipleSelection=true&scrollDirection=&fieldSetName=Default+Fields&fieldSetOid=fsnX2ClsGcd&filterDefinitionId=%23%23%23all&basedOnFilterDefinitionId=&filterDefinitionName=filter.allRecords&sortDefinitionId=default&sortDefinitionName=Date+due&editColumn=&editEnabled=false&runningSelection=",
      "method":"POST",
      "mode":"cors"}));

  let data = [];
  let page = 1;
  let n_assignments = parseInt($("#totalRecordsCount").text());

  while(true) {
        $("tr.listCell.listRowHeight").each(function(i, elem) {
            let row = {};
            //row["name"] = $(this).find("a").first().text();
            //row["category"] = $(this).children().eq(2).text().trim();
            row["name"] = $(this).children().eq(2).text().trim();
            row["category"] = $(this).find("a").first().text();
            row["date_assigned"] = $(this).children().eq(3).text().trim();
            row["date_due"] = $(this).children().eq(4).text().trim();
            row["feedback"] = $(this).children().eq(6).text().trim();
            //let scores = $(this).find("div[class=percentFieldContainer]");
            row["assignment_id"] = $(this).find("input").attr("id");
            let scores = $(this).find("tr")
                .children().slice(0, 2);

            row["special"] = scores.text();

            if (!isNaN(parseFloat(scores.eq(1).text()))) { // No score
                scores = scores.eq(1).text().split("/");
                row["score"] = Number(scores[0]);
                row["max_score"] = Number(scores[1]);

            }
            data.push(row);
        });


    if(page * 25 > n_assignments) {
      return data;
    }
    page++;

        $ = cheerio.load((await fetch_body("https://aspen.cpsd.us/aspen/portalAssignmentList.do",
            {"credentials":"include",
                "headers":{
                    "Connection": "keep-alive",
                    "Cache-Control": "max-age=0",
                    "Origin": "https://aspen.cpsd.us",
                    "Upgrade-Insecure-Requests": "1",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.0 Chrome/69.0.3497.128 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                    "Accept-Language": "en-US,en",
                    "X-Do-Not-Track": "1",
                    "DNT": "1",
                    "Referer": "https://aspen.cpsd.us/aspen/portalAssignmentList.do",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Cookie": "deploymentId=x2sis; JSESSIONID=" + session_id},
                "referrer":"https://aspen.cpsd.us/aspen/portalAssignmentList.do",
                "referrerPolicy":"strict-origin-when-cross-origin",
                "body":"org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=10&userParam=&operationId=&deploymentId=x2sis&scrollX=0&scrollY=0&formFocusField=&formContents=&formContentsDirty=&maximized=false&menuBarFindInputBox=&categoryOid=&gradeTermOid=GTM0000000C1sA&jumpToSearch=&initialSearch=&topPageSelected=1&allowMultipleSelection=true&scrollDirection=&fieldSetName=Default+Fields&fieldSetOid=fsnX2ClsGcd&filterDefinitionId=%23%23%23all&basedOnFilterDefinitionId=&filterDefinitionName=filter.allRecords&sortDefinitionId=default&sortDefinitionName=Date+due&editColumn=&editEnabled=false&runningSelection=",
                "method":"POST",
                "mode":"cors"})));

    }

}

// Returns promise that contains object of all class data
function scrape_quarter(username, password, i) {
    return new Promise(async function(resolve, reject) {
        // Login
        let session = await scrape_login();
        let page = await submit_login(username, password,
            session.apache_token, session.session_id);
    if (page.fail) {
      resolve({"login_fail": true});

    }
        log(i, "session", session);

        // Academics Page
        let academics = await scrape_academics(session.session_id);
    log(i, "academics", academics);

    let term = Math.floor(i / 10);
    i = i % 10;



    if (term != 0) {
      academics = await change_term_classes(session.session_id, academics.apache_token, academics.oid, academics.termFilters[term + 1].code, i);
    }

        // Check if thread is extra
        if(academics.classes[i] == undefined) {
            resolve(undefined);
            log(i, "closing");
            return;
        }

        // Get general class data 
        let categories = await scrape_details(session.session_id,
            academics.apache_token, academics.classes[i].id,
            academics.oid);
        log(i, "categories", categories);


        // Get assignments data page by page
        let assignments = await scrape_assignments(session.session_id, academics.apache_token);

    if (term != 0) {
      assignments = await change_term_assignments(session.session_id, academics.apache_token, academics.oid, academics.termFilters[term + 1].code);
    }

        log(i, "assignments", assignments);

        // Return promise
        log(i, "closing");
        resolve({"name": academics.classes[i].name,
            "grade": academics.classes[i].grade,
            "categories": categories,
            "assignments": assignments,
            "tokens": {"session_id": session.session_id, "apache_token": academics.apache_token},
        });
    });
}

// Returns promise that contains object of all class data
function scrape_class(username, password, i) {
    return new Promise(async function(resolve, reject) {
        // Login
        let session = await scrape_login();
        let page = await submit_login(
            username, password, session.apache_token, session.session_id
        );
        if (page.fail) {
            resolve({"login_fail": true});
        }
        log(i, "session", session);

        // Academics Page
        let academics = await scrape_academics(session.session_id);
        log(i, "academics", academics);
    // Check if thread is extra
        if (academics.classes[i] == undefined) {
            resolve(undefined);
            log(i, "closing");
            return;
        }

        // Get general class data 
        let categories = await scrape_details(
            session.session_id, academics.apache_token, academics.classes[i].id,
            academics.oid
        );
        log(i, "categories", categories);

        // Get assignments data page by page
        let assignments = await scrape_assignments(session.session_id, academics.apache_token);
        log(i, "assignments", assignments);

        // Return promise
        log(i, "closing");
        resolve({
            "name": academics.classes[i].name,
            "grade": academics.classes[i].grade,
            "categories": categories,
            "assignments": assignments,
            "tokens": {
                "session_id": session.session_id,
                "apache_token": academics.apache_token
            },
        });
    });
}




// Returns object with apache_token and session_id
async function scrape_login(username, password) {
    let page = await fetch_body(
        "https://aspen.cpsd.us/aspen/logon.do",
        {
            "credentials": "include",
            "headers": {},
            "referrer": "https://aspen.cpsd.us/aspen/logon.do",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors"
        }
    );
    const session_id = page.substr(
        page.indexOf("sessionId='") + "sessionId='".length, 40
    ) + ".aspen-app2";
    const apache_token = page.substr(
        page.indexOf("TOKEN\" value=\"") + "TOKEN\" value=\"".length, 32
    );
    return {"session_id": session_id, "apache_token": apache_token};
}

// Submits login with creds and session
async function get_home(session_id) {


    let page_todo = await fetch_body(
        "https://aspen.cpsd.us/aspen/toDoWidget.do?groupPageWidgetOid=GPW0000004IwUo&widgetId=toDo_4&groupPageWidgetOid=GPW0000004IwUo",
        {
            "credentials": "include",
            "headers": {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:71.0) Gecko/20100101 Firefox/71.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Upgrade-Insecure-Requests": "1",
        'DNT': '1',
                "Cookie": "JSESSIONID=" + session_id + "; deploymentId=x2sis",
                "Connection": "keep-alive", 
                "Upgrade-Insecure-Requests": "1", 
                "Content-Type": "application/x-www-form-urlencoded", 
                "Cache-Control": "max-age=0", 
                "Referer": "https://aspen.cpsd.us/aspen/logon.do", 
                "User-Agent": HEADERS["User-Agent"], 
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }, 
            "referrer": "https://aspen.cpsd.us/aspen/logon.do", 
            "method": "GET", 
            "mode": "cors",
        }
    );

    let student_oid = cheerio.load(page_todo)('#studentSelector').children().first().attr("value");

    let page = await fetch_body(
        "https://aspen.cpsd.us/aspen/home.do",
        {
            "credentials": "include",
            "headers": {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:71.0) Gecko/20100101 Firefox/71.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Upgrade-Insecure-Requests": "1",
        'DNT': '1',
                "Cookie": "JSESSIONID=" + session_id + "; deploymentId=x2sis",
                "Connection": "keep-alive", 
                "Upgrade-Insecure-Requests": "1", 
                "Content-Type": "application/x-www-form-urlencoded", 
                "Cache-Control": "max-age=0", 
                "Referer": "https://aspen.cpsd.us/aspen/logon.do", 
                "User-Agent": HEADERS["User-Agent"], 
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }, 
            "referrer": "https://aspen.cpsd.us/aspen/logon.do", 
            "method": "GET", 
            "mode": "cors",
        }
    );

  return {
    success: page.includes("Invalid login."),
    apache_token: page.substr( page.indexOf("TOKEN\" value=\"") + "TOKEN\" value=\"".length, 32),
    session_id: page.substr(
            page.indexOf("sessionId='") + "sessionId='".length, 40
        ) + ".aspen-app2",
    student_oid: student_oid
  }

}


// Submits login with creds and session
async function submit_login(username, password, apache_token, session_id) {
    let page = await fetch_body(
        "https://aspen.cpsd.us/aspen/logon.do",
        {
            "credentials": "include",
            "headers": {
                "Origin": "https://aspen.cpsd.us",
                "Accept-Encoding": HEADERS["Accept-Encoding"], 
                "Accept-Language": HEADERS["Accept-Language"],
                "Cookie": "deploymentId=x2sis; JSESSIONID=" + session_id,
                "Connection": "keep-alive", 
                "Upgrade-Insecure-Requests": "1", 
                "User-Agent": HEADERS["User-Agent"], 
                "Content-Type": "application/x-www-form-urlencoded", 
                "Accept": HEADERS["Accept"], 
                "Cache-Control": "max-age=0", 
                "Referer": "https://aspen.cpsd.us/aspen/logon.do", 
            }, 
            "referrer": "https://aspen.cpsd.us/aspen/logon.do", 
            "referrerPolicy": "strict-origin-when-cross-origin", 
            "body": "org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=930&deploymentId=x2sis&username=" + username + "&password=" + password, 
            "method": "POST", 
            "mode": "cors"
        }
    );

    return {
    fail: (page.includes("Invalid login."))
  }

}

// Returns object with classes (name, grade, id),
// student oid, and apache_token
async function scrape_academics(session_id) {
    let $ = cheerio.load(await fetch_body(
        "https://aspen.cpsd.us/aspen/portalClassList.do?navkey=academics.classes.list",
        {
            "credentials": "include",
            "headers": {
                "Cookie": "deploymentId=x2sis; JSESSIONID=" + session_id,
                "Accept-Encoding": HEADERS["Accept-Encoding"],
                "Accept-Language": HEADERS["Accept-Language"],
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": HEADERS["User-Agent"],
                "Accept": HEADERS["Accept"],
                "Referer": "https://aspen.cpsd.us/aspen/home.do",
                "Connection": "keep-alive"
            },
            "referrer": "https://aspen.cpsd.us/aspen/home.do",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors"
        }
    ));
    let data = {"classes": []};
    $("#dataGrid a").each(function(i, elem) {
        if ($(this).parent().nextAll().eq(0).text().trim() == "FY"
            || $(this).parent().nextAll().eq(0).text().trim() == "S1") {
            data.classes[i] = {};
            // data.classes[i].name = $(this).text();
            data.classes[i].name = $(this).parent()
                .nextAll().eq(3).text().trim();
            data.classes[i].grade = $(this).parent()
                .nextAll().eq(5).text().trim();
            data.classes[i].id = $(this).parent().attr("id");
        }
    });
    data.oid = $("input[name=selectedStudentOid]").attr("value");
    data.apache_token = $("input[name='org.apache.struts.taglib.html.TOKEN']").attr("value");
  data.termFilters = [];
  $('select[name="termFilter"]').children().each(function(i, elem) {
    data.termFilters.push({"type": $(this).text(), "code": $(this).attr('value')});
  });

    return data;
}

// Returns object with categories (name, weight) as a dictionary
async function scrape_details(session_id, apache_token, class_id, oid) {
    let $ = cheerio.load(await fetch_body(
        "https://aspen.cpsd.us/aspen/portalClassList.do",
        {
            "credentials": "include",
            "headers": {
                "Connection": "keep-alive",
                "Cache-Control": "max-age=0",
                "Origin": "https://aspen.cpsd.us",
                "Upgrade-Insecure-Requests": "1",
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": HEADERS["User-Agent"],
                "Accept": HEADERS["Accept"],
                "Accept-Language": HEADERS["Accept-Language"],
                "Referer": "https://aspen.cpsd.us/aspen/portalClassList.do?navkey=academics.classes.list&maximized=false",
                "Accept-Encoding": HEADERS["Accept-Encoding"],
                "Cookie": "deploymentId=x2sis; JSESSIONID=" + session_id
            },
            "referrer": "https://aspen.cpsd.us/aspen/portalClassList.do?navkey=academics.classes.list&maximized=false",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": "org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=2100&userParam=" + class_id + "&operationId=&deploymentId=x2sis&scrollX=0&scrollY=87&formFocusField=&formContents=&formContentsDirty=&maximized=false&menuBarFindInputBox=&selectedStudentOid=" + oid + "&jumpToSearch=&initialSearch=&yearFilter=current&termFilter=current&allowMultipleSelection=true&scrollDirection=&fieldSetName=Default+Fields&fieldSetOid=fsnX2Cls&filterDefinitionId=%23%23%23all&basedOnFilterDefinitionId=&filterDefinitionName=filter.allRecords&sortDefinitionId=default&sortDefinitionName=Schedule+term&editColumn=&editEnabled=false&runningSelection=",
            "method": "POST",
            "mode": "cors"
        }
    ));
    let data = {};
    $("tr[class=listCell]", "#dataGrid").slice(3).each(function(i, elem) {
        if (i % 2 === 0) {
            let category = $(this).children().first().text();
            let weight = $(this).children().eq(2).text();
            data[category] = "" + parseFloat(weight.substr(0, weight.length - 1)) / 100;
        }
    });
    return data;
}

// Returns list of assignments (name, category, score, max_score)
async function scrape_assignments(session_id, apache_token) {
    let $ = cheerio.load(await fetch_body(
        "https://aspen.cpsd.us/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd",
        {
            "credentials": "include",
            "headers": {
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "User-Agent": HEADERS["User-Agent"],
                "Accept": HEADERS["Accept"],
                "Accept-Language": HEADERS["Accept-Language"],
                "Referer": "https://aspen.cpsd.us/aspen/portalClassDetail.do?navkey=academics.classes.list.detail",
                "Accept-Encoding": HEADERS["Accept-Encoding"],
                "Cookie": "deploymentId=x2sis; JSESSIONID=" + session_id},
            "referrer": "https://aspen.cpsd.us/aspen/portalClassDetail.do?navkey=academics.classes.list.detail",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors"
        }
    ));

    let data = [];
    let page = 1;
    let n_assignments = parseInt($("#totalRecordsCount").text());

    while(true) {
        $("tr.listCell.listRowHeight").each(function(i, elem) {
            let row = {};
            //row["name"] = $(this).find("a").first().text();
            //row["category"] = $(this).children().eq(2).text().trim();
            row["name"] = $(this).children().eq(2).text().trim();
            row["category"] = $(this).find("a").first().text();
            row["date_assigned"] = $(this).children().eq(3).text().trim();
            row["date_due"] = $(this).children().eq(4).text().trim();
            row["feedback"] = $(this).children().eq(6).text().trim();
            //let scores = $(this).find("div[class=percentFieldContainer]");
            row["assignment_id"] = $(this).find("input").attr("id");
            let scores = $(this).find("tr")
                .children().slice(0, 2);

            row["special"] = scores.text();

            if (!isNaN(parseFloat(scores.eq(1).text()))) { // No score
                scores = scores.eq(1).text().split("/");
                row["score"] = Number(scores[0]);
                row["max_score"] = Number(scores[1]);

            }
            data.push(row);
        });

        if (page * 25 > n_assignments) {
            return data;
        }
        page++;

        $ = cheerio.load((await fetch_body(
            "https://aspen.cpsd.us/aspen/portalAssignmentList.do",
            {
                "credentials": "include",
                "headers": {
                    "Connection": "keep-alive",
                    "Cache-Control": "max-age=0",
                    "Origin": "https://aspen.cpsd.us",
                    "Upgrade-Insecure-Requests": "1",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent": HEADERS["User-Agent"],
                    "Accept": HEADERS["Accept"],
                    "Accept-Language": HEADERS["Accept-Language"],
                    "Referer": "https://aspen.cpsd.us/aspen/portalAssignmentList.do",
                    "Accept-Encoding": HEADERS["Accept-Encoding"],
                    "Cookie": "deploymentId=x2sis; JSESSIONID=" + session_id
                },
                "referrer": "https://aspen.cpsd.us/aspen/portalAssignmentList.do",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": "org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=10&userParam=&operationId=&deploymentId=x2sis&scrollX=0&scrollY=0&formFocusField=&formContents=&formContentsDirty=&maximized=false&menuBarFindInputBox=&categoryOid=&gradeTermOid=GTM0000000C1sB&jumpToSearch=&initialSearch=&topPageSelected=1&allowMultipleSelection=true&scrollDirection=&fieldSetName=Default+Fields&fieldSetOid=fsnX2ClsGcd&filterDefinitionId=%23%23%23all&basedOnFilterDefinitionId=&filterDefinitionName=filter.allRecords&sortDefinitionId=default&sortDefinitionName=Date+due&editColumn=&editEnabled=false&runningSelection=",
                "method": "POST",
                "mode": "cors"
            }
        )));
    }
}

// Returns list of black/silver day pairs of class names and room numbers
async function scrape_schedule(username, password) {
    return new Promise(async function(resolve, reject) {
        let session = await scrape_login();
        let page = await submit_login(username, password, session.apache_token, session.session_id);
        if (page.fail) {
            resolve({"login_fail": true});
        }

        let schedule_page = (await fetch_body(
            "https://aspen.cpsd.us/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list",
            {
                "credentials": "include",
                "headers": {
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                    "User-Agent": HEADERS["User-Agent"],
                    "Accept": HEADERS["Accept"],
                    "Accept-Language": HEADERS["Accept-Language"],
                    "Referer": "https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=2/5/2019&userEvent=0",
                    "Accept-Encoding": HEADERS["Accept-Encoding"],
                    "Cookie": "JSESSIONID=" + session.session_id
                },
                "referrer": "https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=2/5/2019&userEvent=0",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": null,
                "method": "GET",
                "mode": "cors"
            }
        ));
        


        if (schedule_page.includes("Matrix view")) {

            schedule_page = (await fetch_body(
                "https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=&userEvent=0",
                {
                    "credentials": "include",
                    "headers": {
                        "Connection": "keep-alive",
                        "Pragma": "no-cache",
                        "Cache-Control": "no-cache",
                        "Upgrade-Insecure-Requests": "1",
                        "User-Agent": HEADERS["User-Agent"],
                        "Accept": HEADERS["Accept"],
                        "Accept-Language": HEADERS["Accept-Language"],
                        "Referer": "https://aspen.cpsd.us/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list&forceRedirect=false",
                        "Accept-Encoding": HEADERS["Accept-Encoding"],
                        "Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id
                    },
                    "referrer": "https://aspen.cpsd.us/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list&forceRedirect=false",
                    "referrerPolicy": "strict-origin-when-cross-origin",
                    "body": null,
                    "method": "GET",
                    "mode": "cors"
                }
            ));
        } 

        let $ = cheerio.load(schedule_page);
        let data = {black:[], silver:[]};

        $('td[style="width: 125px"]').each(function(i, elem) {
            const parts = $(this).html().trim().split('<br>').slice(0, 4);
            const period = $(this).parentsUntil('td').prev().find('th').html().trim();
            const block = {id: parts[0], name: parts[1], teacher: parts[2], room: parts[3], aspenPeriod: period};
            if (i % 2 == 0) {
                data.black[i/2] = block;
            } else {
                data.silver[Math.floor(i/2)] = block;
            }
        });

        log("schedule", data);
        resolve(data);
    });
}

// Returns body of fetch
async function fetch_body(url, options) {
    return (await fetch(url, options)).text();
}

async function fetch_pdf(url, options) {
    return (await fetch(url, options)).buffer();
}


// Logger can easily be turned off or on and modified
function log(thread, name, obj) {
    if (obj) {
        //console.log(`${thread}:\n\t${name}:\n${util.inspect(obj, false, null, true)}\n`);
    } else {
        //console.log(`${thread}: ${name}\n`);
    }
}

async function fetch_file(url, options) {

    let res = (await fetch(url, options));
    let readable = res.body;

    return new Promise((resolve, reject) => {
        let chunks = [];

        readable.on("data", function (chunk) {
            chunks.push(chunk);
        });

        readable.on("end", function() {
            process.stdout.setDefaultEncoding('binary');
            pdf_out = (Buffer.concat(chunks).toString('binary'));
            resolve(pdf_out);
        });
    });

}



// --------------Compute Functions------------



// ------------ TESTING ONLY -----------------
if (require.main === module) {


    let prompt = require('prompt');
    let schema = {
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
    prompt.get(schema, async function(err, result) {
        // Send Stringified scrape_student() to samplejson.json
        //fs.writeFile('samplejson.json', JSON.stringify(await scrape_student(result.username, result.password)), (err) => {
        //  if (err) throw err;
        //});

        // Print Stringified scrape_student() - good for checking json return
        console.log(JSON.stringify(await scrape_student(result.username, result.password, 0)));
        
        // Print scrape_student() - good for checking fetch html return
        //console.log((await scrape_student(result.username, result.password)));
        
    });
}
