#!/usr/bin/node

// --------------- Includes ------------------
const express = require('express');
const scraper = require('./scrape.js');
const bodyParser = require('body-parser');
const session = require('express-session');
const http = require('http');
const socket = require('socket.io');
const fs = require('fs');
const https = require('https');
const args = require('minimist')(process.argv.slice(2));
const compression = require('compression');
// -------------------------------------------


// ------------ Web Server -------------------
const app = express();
app.use(compression());
const port = 8080;
const server = app.listen(port,
    () => console.log(`Example app listening on port ${port}!`));
const io = socket(server);

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
app.use(session({ // Allows for sessions, and signs them with the (arbitrary) secret
	secret: "scheming+anaconda+bunkbed+greeting+octopus+ultimate+viewable+hangout+everybody",
    resave: true,
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
    if(req.session.username) {
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

io.on('connection', function(socket){
	console.log('a user connected');
});

//app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// -------------------------------------------
