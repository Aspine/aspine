#!/bin/node

// --------------- Parameters ----------------
const THREADS = 8;

// -------------------------------------------


// --------------- Scraping ------------------
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

function scrape_class(username, password, i) {
    return new Promise(function(resolve, reject) {
        // Login
        // If first to login, get academics page, else wait
        // ^^^ So that we only make one request to academics page -- slight speed improvement
        // Get class data page by page

        // fake timetaking stuff
        setTimeout(function() {
            console.log("Scraped class " + i);
        }, Math.random() * 1000);
        resolve("Spawned thread " + i);
    });
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
