#!/usr/bin/node

// --------------- Includes ------------------
const express = require('express');
const scraper = require('./scrape.js');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redis = require("redis"),
    client = redis.createClient(6310);
const http = require('http');
const socket = require('socket.io');
const fs = require('fs');
const https = require('https');
const args = require('minimist')(process.argv.slice(2));
const crypto = require('crypto');
const validator = require('validator');
const fetch = require('node-fetch');
// -------------------------------------------


// ------------ Web Server -------------------
const app = express();
const port = 8080;
const server = app.listen(port,
    () => console.log(`Example app listening on port ${port}!`));
const io = socket(server);

// redis setup
client.on("error", function (err) {
    console.log("Error " + err);
});

if(!args._.includes("insecure")) {
    // Certificate
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/aspine.us/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/aspine.us/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/aspine.us/chain.pem', 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

    app.all('*', ensureSecure); // at top of routing calls

    http.createServer(app).listen(80)
    https.createServer(credentials, app).listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });

    function ensureSecure(req, res, next){
        if(req.secure){
            // OK, continue
            return next();
        };
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
app.use(bodyParser.json()) // json parser
const options = {
    host: 'localhost',
    port: 6310
}
app.use(session({
    store: new RedisStore(options),
    secret: 'scheming+anaconda+bunkbed+greeting+octopus+ultimate+viewable+hangout+everybody',
    resave: false,
    saveUninitialized: false
}));

app.post('/stats', async (req, res) => {
	console.log(`\n\nNEW STATS REQUEST: ${req.body.session_id}, ${req.body.apache_token}, ${req.body.assignment_id} \n------------------`);

    if(!args._.includes("fake")) {
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
	console.log(`\n\nNEW LOGIN: ${req.session.username}\n------------------`);

    if(!args._.includes("fake")) {
        // USE REAL DATA:
        res.send(await scraper.scrape_student(req.session.username, req.session.password));
    } else {
        //USE FAKE DATA:
        res.sendFile('sample.json', {root:"public"});
    }
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

app.post('/set-settings', async (req, res) => {
    // TODO: Sanitization
    let key = crypto.createHash('md5').update(req.session.username).digest('hex');
    client.set(`settings:${key}`, JSON.stringify(req.body));
    res.status(200).send("set settings");
});

app.get('/get-settings', async (req, res) => {
    let key = crypto.createHash('md5').update(req.session.username).digest('hex');
    client.get(`settings:${key}`, function (err, reply) {
        if(!reply) {
            //res.send(JSON.stringify({calendars:[]}));
            res.send({calendars:[]});
        } else {
            res.send(JSON.parse(reply));
        }
    });
});

app.post('/add-calendar', async (req, res) => {

    // Security: MUST SANITIZE URLS
    if(req.body.id == undefined || !validator.isEmail(req.body.id) ||
        req.body.name == undefined || !req.body.name.match(/^[\-0-9a-zA-Z.'' ]+$/g)) {
        res.status(404).send("Malformed ID or Name");
        return;
    }

    // Check to see if it is public and working
    const calendar = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(req.body.id)}/events?key=AIzaSyDtbQCoHa4lC4kW4g4YXTyb8f5ayJct2Ao&timeMin=2019-02-23T00%3A00%3A00Z&timeMax=2019-04-08T00%3A00%3A00Z&singleEvents=true&maxResults=9999&_=1552838482460`);
    if(!calendar.ok) {
        res.status(404).send("Bad Calendar ID");
        return;
    }

    let cal = JSON.stringify({
        name: req.body.name,
        id: req.body.id,
        color: 'green'
    });
    client.lrem('calendars', 0, cal);

    client.rpush('calendars', 
    JSON.stringify({
        name: req.body.name,
        id: req.body.id,
        color: 'green'
    }));

    res.status(200).send("added calendar");
});

app.get('/get-calendars', async (req, res) => {
    client.lrange(`calendars`, 0, -1, function (err, reply) {
        for(i in reply) {
            reply[i] = JSON.parse(reply[i]);
        }
        res.send(reply);
    });
});

io.on('connection', function(socket){
	console.log('a user connected');
});

//app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// -------------------------------------------
