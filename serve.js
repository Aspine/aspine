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
// -------------------------------------------


// ------------ Web Server -------------------
const app = express();
const port = 80;
const server = app.listen(port,
    () => console.log(`Example app listening on port ${port}!`));
const io = socket(server);

if(process.argv[2] == "secure") {
    // Certificate
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/aspine.us/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/aspine.us/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/aspine.us/chain.pem', 'utf8');

    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
    const http = express.createServer();

    // set up a route to redirect http to https
    http.get('*', function(req, res) {
        res.redirect('https://' + req.headers.host + req.url);
    })

    // have it listen on 8080
    http.listen(8080);

}

app.use(express.static('public')); // Serve any files in public directory
app.use(bodyParser.urlencoded({ extended: true })); // Allows form submission
app.use(session({ // Allows for sessions, and signs them with the (arbitrary) secret
	secret: "scheming+anaconda+bunkbed+greeting+octopus+ultimate+viewable+hangout+everybody",
    resave: true,
    saveUninitialized: false
}));

app.post('/data', async (req, res) => {
	console.log(`\n\nNEW LOGIN: ${req.session.username}\n------------------`);

    if(process.argv[2] != "fake") {
        // USE REAL DATA:
        res.send(await scraper.scrape_student(req.session.username, req.session.password));
    } else {
        //USE FAKE DATA:
        res.sendFile('sample.json', {root:"public"});
    }
});
app.post('/login', async (req, res) => {
	req.session.username = req.body.username;
	req.session.password = req.body.password;
    res.redirect('/home.html');
});

app.get('/logout', async (req, res) => {
    req.session.destroy();
	res.redirect('/');
});

io.on('connection', function(socket){
	console.log('a user connected');
});

//app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// -------------------------------------------
