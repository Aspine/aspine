#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"
// https://unix.stackexchange.com/a/65295


const express = require('express');
const scraper = require('./scrape.js');
const bodyParser = require('body-parser');
const session = require('express-session');
// const RedisStore = require('connect-redis')(session);
// const redis = require("redis"),
//     client = redis.createClient(6310);
const http = require('http');
const fs = require('fs');
const https = require('https');
const args = require('minimist')(process.argv.slice(2));
const compression = require('compression');
// -------------------------------------------

if (args.hasOwnProperty('help') || args._.includes('help')) {
    console.log(`Usage: ./serve.js [insecure] [fake] [OPTION]...
Starts the Aspine web server.

Options:
  --fake         use file "public/sample2.json" instead of scraping Aspen
  --insecure     do not use SSL/TLS (HTTPS)
  --json=FILE    use JSON file FILE instead of scraping Aspen
  --out=FILE     scrape Aspen as usual but dump JSON to file FILE
  --help   display this help and exit
`);
    process.exit();
}

// ------------ Web Server -------------------
const port = 8080;

const app = express();
app.use(compression());
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// // redis setup
// client.on("error", function (err) {
//     console.error("Error " + err);
// });

if(!(args.hasOwnProperty('insecure') || args._.includes("insecure"))) {
    // Certificate
    const privateKey = fs.readFileSync('/etc/ssl/certs/private-key.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/ssl/certs/public-key.pem', 'utf8');
    const ca = fs.readFileSync('/etc/ssl/certs/CA-key.pem', 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    app.all('*', ensureSecure); // at top of routing calls

    http.createServer(app).listen(8090);
    https.createServer(credentials, app).listen(4430, () => { //443
        console.log('HTTPS Server running on port 4430'); //443
    });

    function ensureSecure(req, res, next){
        if(req.secure){
            // OK, continue
            return next();
        }
        // handle port numbers if you need non defaults
        // res.redirect('https://' + req.host + req.url); // express 3.x
        res.redirect('https://' + req.hostname + req.url); // express 4.x
    }
}

app.use(function(req, res, next) { // enable cors
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(express.static('public')); // Serve any files in public directory
app.use(bodyParser.urlencoded({ extended: true })); // Allows form submission
app.use(bodyParser.json()); // json parser
app.use(session({
    // store: new RedisStore(options),
    secret: 'scheming+anaconda+bunkbed+greeting+octopus+ultimate+viewable+hangout+everybody',
    resave: false,
    saveUninitialized: false
}));

app.post('/stats', async (req, res) => {
    console.log(`\n\nNEW STATS REQUEST: ${req.body.session_id}, ${req.body.apache_token}, ${req.body.assignment_id} \n------------------`);

    if(!(args.hasOwnProperty("fake") || args._.includes("fake"))) {
        // USE REAL DATA:
        res.send(await scraper.scrape_assignmentDetails(req.body.session_id, req.body.apache_token, req.body.assignment_id));
    } else {
        //USE FAKE DATA:
        res.send(await scraper.scrape_assignmentDetails(req.body.session_id, req.body.apache_token, req.body.assignment_id));
    //res.send("Hello World");
        //res.sendFile('sample.json', {root:"public"});
    }
});

app.post('/data', async (req, res) => {
    // console.log(`\n\nNEW LOGIN: ${req.session.username}\n------------------`);

    // fs.appendFile('usage_log.txt', `\n\nNEW LOGIN: ${req.session.username}\n------------------`, function (err) {
    // 	  if (err) throw err;
    // });
  
  if (args.hasOwnProperty("json")) {
      // Check if "--json" command-line argument was provided, e.g.
        // node serve.js --json=./public/sample.json
        
        // Use json file provided at command line
        res.sendFile(args.json, {root: "."});
  }
    let response;
    if (args._.includes("fake")) {
        // For backwards compatibility

        res.sendFile('sample2.json', {root: "public"});
    } else {
        //res.send(await scraper.scrape_student(req.session.username, req.session.password));
        //
        // Get data from scraper:
        //
        response = await scraper.scrape_student(req.session.username, req.session.password, req.body.quarter);
        res.send(response);

        // If "out" command-line argument provided, save JSON at the given path
        if (args.hasOwnProperty("out")) {
            fs.writeFile(
                args.out, JSON.stringify(response),
                (err) => {
                    if (err) throw err;
                }
            );
        }
    }
});

app.post('/schedule', async (req, res) => {
    res.send(await scraper.scrape_schedule(req.session.username, req.session.password));
});

app.post('/pdf', async (req, res) => {
    res.send(await scraper.scrape_pdf_files(req.session.username, req.session.password));
});

app.get('/', async (req, res) => {
    if(typeof(req.session) != "undefined") {
        res.redirect('/home.html');
    } else {
        res.redirect('/login.html');
    }
});

app.post('/login', async (req, res) => {
    req.session.username = req.body.username;
    req.session.password = req.body.password;
  res.redirect('/home.html');
});

app.get('/logout', async (req, res) => {
  req.session.destroy();
    res.redirect('/login.html');
});

// app.post('/set-settings', async (req, res) => {
//     // TODO: Sanitization
//     let key = crypto.createHash('md5').update(req.session.username).digest('hex');
//     client.set(`settings:${key}`, JSON.stringify(req.body));
//     res.status(200).send("set settings");
// });
// 
// app.get('/get-settings', async (req, res) => {
//     if(typeof(req.session.username) == "undefined") {
//         res.status(400).send("User not logged in");
//         return;
//     }
//     let key = crypto.createHash('md5').update(req.session.username).digest('hex');
//     client.get(`settings:${key}`, function (err, reply) {
//         if(!reply) {
//             //res.send(JSON.stringify({calendars:[]}));
//             res.send({calendars:["CRLS", "holidays"]});
//         } else {
//             res.send(JSON.parse(reply));
//         }
//     });
// });
// 
// app.post('/add-calendar', async (req, res) => {
//     console.log(req.body.color);
//     // Security: MUST SANITIZE URLS
//     if(req.body.id == undefined || !validator.isEmail(req.body.id) ||
//         req.body.name == undefined || !req.body.name.match(/^[\-0-9a-zA-Z.'' ]+$/g) ||
//         req.body.color == undefined || !req.body.color.match(/^([\-0-9a-fA-F]){6}$/g)) {
//         res.status(400).send("Malformed ID, Name, or Color");
//         return;
//     }
// 
//     // Check to see if it is public and working
//     const calendar = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(req.body.id)}/events?key=AIzaSyDtbQCoHa4lC4kW4g4YXTyb8f5ayJct2Ao&timeMin=2019-02-23T00%3A00%3A00Z&timeMax=2019-04-08T00%3A00%3A00Z&singleEvents=true&maxResults=9999&_=1552838482460`);
//     if(!calendar.ok) {
//         res.status(400).send("Bad Calendar ID");
//         return;
//     }
// 
//     let cal = JSON.stringify({
//         name: req.body.name,
//         id: req.body.id,
//         color: req.body.color
//     });
//     client.lrem('calendars', 0, cal);
// 
//     client.rpush('calendars', 
//     JSON.stringify({
//         name: req.body.name,
//         id: req.body.id,
//         color: req.body.color
//     }));
// 
//     res.status(200).send("added calendar");
// });
// 
// app.get('/get-calendars', async (req, res) => {
//     client.lrange(`calendars`, 0, -1, function (err, reply) {
//         for(i in reply) {
//             reply[i] = JSON.parse(reply[i]);
//         }
//         res.send(reply);
//     });
// });
