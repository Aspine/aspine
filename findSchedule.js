#!/usr/bin/env node

const fetch = require('node-fetch');
const cheerio = require('cheerio');

activateLogin("8006697", "student");

async function activateLogin(username, password) {
	
	let allClasses = [], alPercentages = [];
	let percentLoaded = 0;

	//if (($w("#usernameInput").value.length === 7)) {
			
		//activate loading icon

	let tokens = [];
	let wait = [];
	let classIds, oid;
	//get tokens

	for (let i = 0; i < 1; i++) {
		wait[i] = getStartTokens(username, password).then(response => tokens[i] = response);
	}

	for (let i = 0; i < wait.length; i++) {
		await wait[i];
	}
	


	for (let i = 0; i < tokens.length; i++) {
		wait[i] = activateToken(username, password, tokens[i].session_id, tokens[i].apache_token).then(response => response);
	}

	for (let i = 0; i < tokens.length; i++) {
		await wait[i];
	}


	//get classes
	/*
	wait[0] = getClasses(username, password, tokens[0].session_id, tokens[0].apache_token).then(function(response) {
		allClasses = response.allClasses;
		allPercentages = response.allPercentages;
		classIds = response.classIds;
		oid = response.oid;
	});
	*/
	wait[0] = getSchedule(tokens[0].session_id).then(file => console.log(file));

	await wait[0];

	
}

async function getSchedule(session_id) {
	function nthIndex(str, pat, n){
	    var L= str.length, i= -1;
	    while(n-- && i++<L){
	        i= str.indexOf(pat, i);
	        if (i < 0) break;
	    }
	    return i;
	}
	let $ = cheerio.load(await fetchbody("https://aspen.cpsd.us/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list", {"credentials":"include","headers":{"Connection": "keep-alive"  ,  "Upgrade-Insecure-Requests": "1"  ,  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.12.0 Chrome/69.0.3497.128 Safari/537.36"  ,  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"  ,  "X-Do-Not-Track": "1"  ,  "Accept-Language": "en-US,en"  ,  "DNT": "1"  ,  "Referer": "https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=2/5/2019&userEvent=0"  ,  "Accept-Encoding": "gzip, deflate, br"  ,  "Cookie": "JSESSIONID=" + session_id + "; deploymentId=x2sis; _ga=GA1.3.481904573.1547755534; _ga=GA1.2.1668470472.1547906676; _gid=GA1.3.774571258.1549380024"},"referrer":"https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=2/5/2019&userEvent=0","referrerPolicy":"strict-origin-when-cross-origin","body":null,"method":"GET","mode":"cors"}));
	let scheduleData = [];

	let tableDiv = $(".listGridFixed").first();
	let startRow = tableDiv.children().first().children().first().children().first().children().first().children().first().children().first().children().first().siblings();
	startRow.each(function(i, elem) {
		if (i > 0 && i < 6) {
			let scheduleClass = []; 
			let classString = $(this).children().eq(2).children().first().children().first().children().first().children().first().html().trim();	
				let currentIndex = 0;
			for (let b = 1; b < 4; b++) {
				scheduleClass.push(classString.substring(nthIndex(classString, "<br>", b) + 4, nthIndex(classString, "<br>", b + 1)));
			}				
			
			scheduleData.push(scheduleClass);	
		}
	});

	return scheduleData;
}
function log(logger) {
	console.log(logger.name);
	console.log(logger);

}

async function getStartTokens(username, password) {

    //declare Variables
	let everything = [];
	let allAssignments = [], allCategories = [], allConstCategories = [], allConstWeights = [], allScores = [], allMaxScores = [];

	//get possible session_ids and apache_tokens
    let file = await fetchbody("https://aspen.cpsd.us/aspen/logon.do", {"credentials":"include","headers":{},"referrer":"https://aspen.cpsd.us/aspen/logon.do","referrerPolicy":"strict-origin-when-cross-origin","body":null,"method":"GET","mode":"cors"});
    let session_id = file.substr(file.indexOf("jsessionid=") + "jsessionid=".length, 32);
    let apache_token = file.substr(file.indexOf("TOKEN\" value=\"") + "TOKEN\" value=\"".length, 32);
    
	
	return {
		session_id,
		apache_token
	};

}


async function activateToken(username, password, session_id, apache_token) {
	await fetchbody("https://aspen.cpsd.us/aspen/logon.do", {"credentials":"include","headers":{"Origin" : "https://aspen.cpsd.us" , "Accept-Encoding" : "gzip, deflate, br" , "Accept-Language" : "en-US,en" , "X-DevTools-Emulate-Network-Conditions-Client-Id" : "969B8CEF25CCA839B3F22A036F8389AB" , "Cookie" : "deploymentId=x2sis; JSESSIONID=" + session_id, "Connection" : "keep-alive" , "X-Do-Not-Track" : "1" , "Upgrade-Insecure-Requests" : "1" , "User-Agent" : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) QtWebEngine/5.11.2 Chrome/65.0.3325.230 Safari/537.36" , "Content-Type" : "application/x-www-form-urlencoded" , "Accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8" , "Cache-Control" : "max-age=0" , "Referer" : "https://aspen.cpsd.us/aspen/logon.do" , "DNT" : "1"},"referrer":"https://aspen.cpsd.us/aspen/logon.do","referrerPolicy":"strict-origin-when-cross-origin","body":"org.apache.struts.taglib.html.TOKEN=" + apache_token + "&userEvent=930&userParam=&operationId=&deploymentId=x2sis&scrollX=0&scrollY=0&formFocusField=username&mobile=false&SSOLoginDone=&username=" + username + "&password=" + password,"method":"POST","mode":"cors"});
	return session_id + " complete";
}

async function fetchbody(url, options){
    return await fetch(url, options)
    .then(res => res.text());
}
