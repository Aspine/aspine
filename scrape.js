#!/bin/node

// --------------- Parameters ----------------
const THREADS = 8;

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
    return new Promise(function(resolve, reject) {
        // Login
        let session = scrape_login();
        submit_login(username, password,
            session.apache_token, session.session_id);
        // If first to login, get academics page, else wait
        // ^^^ So that we only make one request to academics page -- slight speed improvement
        //    ^^^ ignoring this for now
        
        // Get class data page by page

        resolve("Finished scraping " + i);
    });
}

// Returns object with apache_token and session_id
function scrape_login(username, password) {}

// Submits login with creds and session
function submit_login(username, password, apache_token, session_id) {}

// Returns object with classes (name, percentage, id) and student oid
function scrape_academics(session_id) {}

// Returns object with categories (name, weight) as a dictionary and apache_token
function scrape_details(session_id, class_id, oid) {}

// Returns object with assignments (name, category, score, max_score)
function scrape_assignments(session_id) {}

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
