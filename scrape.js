#!/usr/bin/node


// --------------- Parameters ----------------
// Multi-Threads
const CLASS_THREADS = 50;
const PDF_THREADS = 5;

// Solo-Threads
const SCHEDULE_THREAD = CLASS_THREADS + PDF_THREADS + 1;
const RECENT_THREAD = SCHEDULE_THREAD + 1;

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
	scrape_assignmentDetails: scrape_assignmentDetails
};

// -------------------------------------------

// --------------- Scraping ------------------
// Returns object of classes
async function scrape_student(username, password) {

	//Spawn class scrapers
	let class_scrapers = [];
	for(let i = 0; i < CLASS_THREADS; i++) {
		class_scrapers[i] = scrape_class(username, password, i);
	}

  // Spawn pdf scrapers
	let pdf_scrapers = [];
  for (let i = 0; i < PDF_THREADS; i++) {
    pdf_scrapers[i] = scrape_pdf(username, password, i);
  }

	// Spawn schedule scraper
  let schedule_scraper = scrape_schedule(username, password, "SCHEDULE_THREAD");

	// Spawn recent activity scraper
  let recent_scraper = scrape_recent(username, password, "RECENT_THREAD");

	// Await on all class scrapers
	return {
		classes: (await Promise.all(class_scrapers)).slice(0, 10).filter(Boolean),
    terms: {
      current: (await Promise.all(class_scrapers)).slice(0, 10).filter(Boolean),
      q1: (await Promise.all(class_scrapers)).slice(10, 20).filter(Boolean),
      q2: (await Promise.all(class_scrapers)).slice(20, 30).filter(Boolean),
      q3: (await Promise.all(class_scrapers)).slice(30, 40).filter(Boolean),
      q4: (await Promise.all(class_scrapers)).slice(40, 50).filter(Boolean),
    },
		schedule: await schedule_scraper,
		recent: await recent_scraper,
    pdf_files: (await Promise.all(pdf_scrapers)).filter(Boolean),
    username: username,
	}
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

	let data = {"classes": []};
	$("#dataGrid a").each(function(i, elem) {
		data.classes[i] = {};
		data.classes[i].name = $(this).text();
		data.classes[i].grade = $(this).parent()
			.nextAll().eq(5).text().trim();
		data.classes[i].id = $(this).parent().attr("id");
	});
	data.oid = $("input[name=selectedStudentOid]").attr("value");
	data.apache_token = $("input[name='org.apache.struts.taglib.html.TOKEN']").attr("value");
  data.termFilters = [];
  $('select[name="termFilter"]').children().each(function(i, elem) {
    data.termFilters.push({"type": $(this).text(), "code": $(this).attr('value')});
  });

	return data;
}


// Returns object of recent activity
async function scrape_recent(username, password, i) {
	return new Promise(async function(resolve, reject) {
		let session = await scrape_login();
		let page = await submit_login(username, password, session.apache_token, session.session_id);
		log(i, "session", session);


		let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/studentRecentActivityWidget.do?preferences=%3C%3Fxml+version%3D%221.0%22+encoding%3D%22UTF-8%22%3F%3E%3Cpreference-set%3E%0A++%3Cpref+id%3D%22dateRange%22+type%3D%22int%22%3E3%3C%2Fpref%3E%0A%3C%2Fpreference-set%3E&rand=1551041157793", 
			{"credentials":"include",
				"headers":{
					"Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id + "; _ga=GA1.3.481904573.1547755534; _ga=GA1.2.1668470472.1547906676; _gid=GA1.3.1525149286.1550969560",
					"DNT": "1",
					"Accept-Encoding": "gzip, deflate, br",
					"Accept-Language": "en-US,en",
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.0 Chrome/69.0.3497.128 Safari/537.36",
					"Accept": "application/xml, text/xml, */*; q=0.01",
					"Referer": "https://aspen.cpsd.us/aspen/home.do",
					"X-Requested-With": "XMLHttpRequest",
					"Connection": "keep-alive",
					"X-Do-Not-Track": "1"
				},
				"referrer":"https://aspen.cpsd.us/aspen/home.do",
				"referrerPolicy":"strict-origin-when-cross-origin",
				"body":null,
				"method":"GET",
				"mode":"cors"}), {
				xmlMode: true,
				normalizeWhitespace: true,
				decodeEntities: true});

		log(i, "scrape recent widget", $);

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
		log(i, "recentAttendance", recentAttendanceArray);
		

		$('recent-activity').children().filter('gradebookScore')
		.each(function(i, elem) {
			recentActivityArray.push({
				date: $(this).attr('date'),
				classname: $(this).attr('classname'),
				score: $(this).attr('grade'),
				assignment: $(this).attr('assignmentname'),
			});
		});
		log(i, "recentGrades", recentActivityArray);


		log(i, "closing");
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
            row["name"] = $(this).find("a").first().text();
            row["category"] = $(this).children().eq(2).text().trim();
            //let scores = $(this).find("div[class=percentFieldContainer]");
	    row["assignment_id"] = $(this).find("input").attr("id");
	    let scores = $(this).find("tr")
                .children().slice(0, 2);
		//console.log(scores.text());
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
function scrape_class(username, password, i) {
	return new Promise(async function(resolve, reject) {
		// Login
		let session = await scrape_login();
		let page = await submit_login(username, password,
			session.apache_token, session.session_id);
    if (page) {
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
    //console.log(categories);
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
  //console.log(page.includes("Invalid login."));
	return page.includes("Invalid login.");
}


// Returns object with pdf content and title
async function scrape_pdf(username, password, i) {
	return new Promise(async function(resolve, reject) {
		let session = await scrape_login();
		let page = await submit_login(username, password, session.apache_token, session.session_id);

		log(i, "session", session);

    let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/publishedReportsWidget.do?groupPageWidgetOid=GPW0000006UKen&widgetId=publishedReports_11&groupPageWidgetOid=GPW0000006UKen&1554939833156", 
      {"credentials":"include",
        "headers":{
          "Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id + "; _ga=GA1.3.481904573.1547755534; _ga=GA1.2.1668470472.1547906676; _gid=GA1.3.1139820126.1554600427",
          "DNT": "1",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US,en",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.2 Chrome/69.0.3497.128 Safari/537.36",
          "Accept": "*/*",
          "Referer": "https://aspen.cpsd.us/aspen/home.do",
          "X-Requested-With": "XMLHttpRequest",
          "Connection": "keep-alive"
        },
        "referrer":"https://aspen.cpsd.us/aspen/home.do",
        "referrerPolicy":"strict-origin-when-cross-origin",
        "body":null,
        "method":"GET",
        "mode":"cors"}));


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

    (await fetch_body("https://aspen.cpsd.us/aspen/fileDownload.do?propertyAsString=filFile&oid=" + oid + "&reportDeliveryRecipient=" + deliveryRecipient + "&deploymentId=x2sis",
       {"credentials":"include",
         "headers":{
           "Connection": "keep-alive",
           "Pragma": "no-cache",
           "Cache-Control": "no-cache",
           "Upgrade-Insecure-Requests": "1",
           "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.2 Chrome/69.0.3497.128 Safari/537.36",
           "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
           "Accept-Language": "en-US,en",
           "DNT": "1",
           "Accept-Encoding": "gzip, deflate, br",
           "Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id + "; _ga=GA1.3.481904573.1547755534; _ga=GA1.2.1668470472.1547906676; _gid=GA1.3.1139820126.1554600427"
         },
         "referrerPolicy":"strict-origin-when-cross-origin",
         "body":null,
         "method":"GET",
         "mode":"cors"}));

    fileReturn = (await fetch_file("https://aspen.cpsd.us/aspen/toolResult.do?&fileName=" + filename + "&downLoad=true",
      {"credentials":"include",
        "headers":{
          "Connection": "keep-alive",
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
          "Upgrade-Insecure-Requests": "1",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.2 Chrome/69.0.3497.128 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en",
          "DNT": "1",
          "Accept-Encoding": "gzip, deflate, br",
          "Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id + "; _ga=GA1.3.481904573.1547755534; _ga=GA1.2.1668470472.1547906676; _gid=GA1.3.1139820126.1554600427"
        },
        "referrerPolicy":"strict-origin-when-cross-origin",
        "body":null,
        "method":"GET",
        "mode":"cors"}));

    log(i, "closing");

    resolve({
      "title": title,
      "content": fileReturn
    });

  });
}

// Returns object with classes (name, grade, id),
// student oid, and apache_token
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
	let data = {"classes": []};
	$("#dataGrid a").each(function(i, elem) {
		data.classes[i] = {};
		data.classes[i].name = $(this).text();
		data.classes[i].grade = $(this).parent()
			.nextAll().eq(5).text().trim();
		data.classes[i].id = $(this).parent().attr("id");
	});
	data.oid = $("input[name=selectedStudentOid]").attr("value");
	data.apache_token = $("input[name='org.apache.struts.taglib.html.TOKEN']").attr("value");
  data.termFilters = [];
  $('select[name="termFilter"]').children().each(function(i, elem) {
    data.termFilters.push({"type": $(this).text(), "code": $(this).attr('value')});
  });
  console.log("TERM FILTER");
  console.log(data.termFilters);

	return data;
}

// Returns object with categories (name, weight) as a dictionary
async function scrape_details(session_id, apache_token, class_id, oid) {
	let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/portalClassList.do",
		{"credentials":"include",
			"headers":{"Connection": "keep-alive",
				"Cache-Control": "max-age=0",
				"Origin": "https://aspen.cpsd.us",
				"Upgrade-Insecure-Requests": "1",
				"Content-Type": "application/x-www-form-urlencoded",
				"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.0 Chrome/69.0.3497.128 Safari/537.36", 
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
				"X-Do-Not-Track": "1",
				"Accept-Language": "en-US,en",
				"DNT": "1",
				"Referer": "https://aspen.cpsd.us/aspen/portalClassList.do?navkey=academics.classes.list&maximized=false",
				"Accept-Encoding": "gzip, deflate, br",
				"Cookie": "deploymentId=x2sis; JSESSIONID=" + session_id },
			"referrer":"https://aspen.cpsd.us/aspen/portalClassList.do?navkey=academics.classes.list&maximized=false",
			"referrerPolicy":"strict-origin-when-cross-origin",
			"body":"org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=2100&userParam=" + class_id + "&operationId=&deploymentId=x2sis&scrollX=0&scrollY=87&formFocusField=&formContents=&formContentsDirty=&maximized=false&menuBarFindInputBox=&selectedStudentOid=" + oid + "&jumpToSearch=&initialSearch=&yearFilter=current&termFilter=current&allowMultipleSelection=true&scrollDirection=&fieldSetName=Default+Fields&fieldSetOid=fsnX2Cls&filterDefinitionId=%23%23%23all&basedOnFilterDefinitionId=&filterDefinitionName=filter.allRecords&sortDefinitionId=default&sortDefinitionName=Schedule+term&editColumn=&editEnabled=false&runningSelection=",
			"method":"POST",
			"mode":"cors"}));
	let data = {};
	$("tr[class=listCell]", "#dataGrid").slice(3).each(function(i, elem) {
		if(i % 2 === 0) {
			let category = $(this).children().first().text();
			let weight = $(this).children().eq(2).text();
			data[category] = "" + parseFloat(weight.substr(0, weight.length - 1)) / 100;
		}
	});
	return data;
}

// Returns list of assignments (name, category, score, max_score)
async function scrape_assignments(session_id, apache_token) {
	let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd",
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

	let data = [];
   let page = 1;
    let n_assignments = parseInt($("#totalRecordsCount").text());

    while(true) {
        $("tr.listCell.listRowHeight").each(function(i, elem) {
            let row = {};
            row["name"] = $(this).find("a").first().text();
            row["category"] = $(this).children().eq(2).text().trim();
            //let scores = $(this).find("div[class=percentFieldContainer]");
	    row["assignment_id"] = $(this).find("input").attr("id");
	    let scores = $(this).find("tr")
                .children().slice(0, 2);
		//console.log(scores.text());
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
                "body":"org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=10&userParam=&operationId=&deploymentId=x2sis&scrollX=0&scrollY=0&formFocusField=&formContents=&formContentsDirty=&maximized=false&menuBarFindInputBox=&categoryOid=&gradeTermOid=GTM0000000C1sB&jumpToSearch=&initialSearch=&topPageSelected=1&allowMultipleSelection=true&scrollDirection=&fieldSetName=Default+Fields&fieldSetOid=fsnX2ClsGcd&filterDefinitionId=%23%23%23all&basedOnFilterDefinitionId=&filterDefinitionName=filter.allRecords&sortDefinitionId=default&sortDefinitionName=Date+due&editColumn=&editEnabled=false&runningSelection=",
                "method":"POST",
                "mode":"cors"})));

    }
}

// Returns list of black/silver day pairs of class names and room numbers
async function scrape_schedule(username, password, i) {
	return new Promise(async function(resolve, reject) {
		let session = await scrape_login();
		let page = await submit_login(username, password, session.apache_token, session.session_id);
    if (page) {
      resolve({"login_fail": true});
    }

		let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list",
			{"credentials":"include",
				"headers":{"Connection": "keep-alive",
					"Upgrade-Insecure-Requests": "1",
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.0 Chrome/69.0.3497.128 Safari/537.36",
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
					"X-Do-Not-Track": "1",
					"Accept-Language": "en-US,en",
					"DNT": "1",
					"Referer": "https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=2/5/2019&userEvent=0",
					"Accept-Encoding": "gzip, deflate, br",
					"Cookie": "JSESSIONID=" + session.session_id + "; deploymentId=x2sis; _ga=GA1.3.481904573.1547755534; _ga=GA1.2.1668470472.1547906676; _gid=GA1.3.774571258.1549380024"},
				"referrer":"https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=2/5/2019&userEvent=0",
				"referrerPolicy":"strict-origin-when-cross-origin",
				"body":null,
				"method":"GET",
				"mode":"cors"}));
		let data = {black:[], silver:[]};
		$('td[style="width: 125px"]').each(function(i, elem) {
			const parts = $(this).html().trim().split('<br>').slice(0, 4);
			const period = $(this).parentsUntil('td').prev().find('th').html().trim();
			const block = {id: parts[0], name: parts[1], teacher: parts[2], room: parts[3], aspenPeriod: period};
			if(i % 2 == 0) {
				data.black[i/2] = block;
			} else {
				data.silver[Math.floor(i/2)] = block;
			}
		});
		log(i, "schedule", data);
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
	if(obj) {
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


// Returns object of recent activity
async function scrape_recent(username, password, i) {
	return new Promise(async function(resolve, reject) {
		let session = await scrape_login();
		let page = await submit_login(username, password, session.apache_token, session.session_id);
		log(i, "session", session);


		let $ = cheerio.load(await fetch_body("https://aspen.cpsd.us/aspen/studentRecentActivityWidget.do?preferences=%3C%3Fxml+version%3D%221.0%22+encoding%3D%22UTF-8%22%3F%3E%3Cpreference-set%3E%0A++%3Cpref+id%3D%22dateRange%22+type%3D%22int%22%3E3%3C%2Fpref%3E%0A%3C%2Fpreference-set%3E&rand=1551041157793", 
			{"credentials":"include",
				"headers":{
					"Cookie": "deploymentId=x2sis; JSESSIONID=" + session.session_id + "; _ga=GA1.3.481904573.1547755534; _ga=GA1.2.1668470472.1547906676; _gid=GA1.3.1525149286.1550969560",
					"DNT": "1",
					"Accept-Encoding": "gzip, deflate, br",
					"Accept-Language": "en-US,en",
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.0 Chrome/69.0.3497.128 Safari/537.36",
					"Accept": "application/xml, text/xml, */*; q=0.01",
					"Referer": "https://aspen.cpsd.us/aspen/home.do",
					"X-Requested-With": "XMLHttpRequest",
					"Connection": "keep-alive",
					"X-Do-Not-Track": "1"
				},
				"referrer":"https://aspen.cpsd.us/aspen/home.do",
				"referrerPolicy":"strict-origin-when-cross-origin",
				"body":null,
				"method":"GET",
				"mode":"cors"}), {
				xmlMode: true,
				normalizeWhitespace: true,
				decodeEntities: true});

		log(i, "scrape recent widget", $);

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
		log(i, "recentAttendance", recentAttendanceArray);
		

		$('recent-activity').children().filter('gradebookScore')
		.each(function(i, elem) {
			recentActivityArray.push({
				date: $(this).attr('date'),
				classname: $(this).attr('classname'),
				score: $(this).attr('grade'),
				assignment: $(this).attr('assignmentname'),
			});
		});
		log(i, "recentGrades", recentActivityArray);


		log(i, "closing");
		resolve({
			recentAttendanceArray,
			recentActivityArray,
			studentName,
		});
	});
}



// --------------Compute Functions------------



// ------------ TESTING ONLY -----------------
if(require.main === module) {
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
    fs.writeFile('samplejson.json', JSON.stringify(await scrape_student(result.username, result.password)), (err) => {
      if (err) throw err;
    });

    // Print Stringified scrape_student() - good for checking json return
		//console.log(JSON.stringify(await scrape_student(result.username, result.password)));
    
    // Print scrape_student() - good for checking fetch html return
		//console.log((await scrape_student(result.username, result.password)));
 
	});
}
