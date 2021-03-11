const express = require('express');
const { program } = require('commander');
const bodyParser = require('body-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const compression = require('compression');
const child_process = require('child_process');
const marked = require('marked');

const scraper = require('./js/scrape');
const dep_mappings = require('./frontend-dependencies');
const { AspineErrorCode } = require('./js/types');

// -------------------------------------------

// Get Aspine version number without leading 'v'
const version = child_process.execSync('git describe')
    .toString().trim().match(/^v?(.*)/)[1];
const changelog = marked(
    fs.readFileSync(__dirname + '/CHANGELOG.md').toString()
);

program
    .version(version)
    .option('-p, --port <number>', 'port to listen on', 8080)
    .option('-P, --port-https <number>', 'port to listen on for HTTPS', 4430);

// Secure by default on production, insecure by default for development
if (process.env.NODE_ENV === "production") {
    program.option('-i, --no-secure, --insecure',
        'do not secure connections with TLS (HTTPS)'
    );
    program.option('-s, --secure',
        'secure connections with TLS (HTTPS) [default for production]'
    );
} else {
    program.option('-s, --secure', 'secure connections with TLS (HTTPS)');
    program.option('-d, --dev', 'HTTPS designed to work with the gen-key script to make self signed certs');
    program.option('-i, --no-secure, --insecure',
        'do not secure connections with TLS (HTTPS) [default for development]'
    );
}

program.parse();

// ------------ Web Server -------------------
const app = express();
app.use(compression());
app.listen(program.port, () =>
    console.log(`Aspine listening on port ${program.port}!`)
);

if (program.secure || program.dev) {
    app.all('*', (req, res, next) => {
        if (req.secure) {
            return next();
        }
        // handle port numbers if you need non defaults
        res.redirect('https://' + req.hostname + req.url);
    }); // at top of routing calls

    const credentials = program.dev ? {
        key: fs.readFileSync('local.key', 'utf8'),
        cert: fs.readFileSync('local.crt', 'utf8'),
        ca: fs.readFileSync('local.csr', 'utf8'),
    } : {
        key: fs.readFileSync('/etc/ssl/certs/private-key.pem', 'utf8'),
        cert: fs.readFileSync('/etc/ssl/certs/public-key.pem', 'utf8'),
        ca: fs.readFileSync('/etc/ssl/certs/CA-key.pem', 'utf8'),
    };

    https.createServer(credentials, app).listen(program.portHttps, () =>
        console.log(`HTTPS Server running on port ${program.portHttps}`)
    );
}

// Expose frontend dependencies from node-modules
// https://stackoverflow.com/a/27464258
for (const [endpoint, path] of dep_mappings.files) {
    app.get(endpoint, (req, res) => {
        res.sendFile(__dirname + path);
    });
}
for (const [endpoint, path] of dep_mappings.directories) {
    app.use(endpoint, express.static(__dirname + path));
}

// Endpoint to expose version number to client
app.get('/version', (req, res) => res.send(version));

// Endpoint to expose rendered changelog to client
app.get('/updates', (req, res) => res.send(changelog));

app.use(function(req, res, next) { // enable cors
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/home.html', (req, res) => res.redirect('/'));
app.get('/login.html', (req, res) => res.redirect('/login'));

app.use(express.static(__dirname + '/public'));
// Serve any files in public directory

app.use(bodyParser.urlencoded({ extended: true })); // Allows form submission
app.use(bodyParser.json()); // json parser
app.use(session({
    cookie: { maxAge: 28800000 },
    store: new MemoryStore({ checkPeriod: 28800000 }),
    // Sessions expire every 8 hours (28800000 ms)
    resave: false,
    saveUninitialized: false,
    secret: crypto.randomBytes(64).toString('hex'),
    // Sessions are destroyed on restarting the server anyway (because we use
    // MemoryStore), so the secret can be random
}));

app.post('/stats', async (req, res) => {
    console.log(`\n\nNEW STATS REQUEST: ${req.body.assignment_id}, ${req.body.class_id}, ${req.body.quarter_id} \n------------------`);

    try {
        res.send(await scraper.get_stats(
            req.session.username, req.session.password, req.body.assignment_id,
            req.body.class_id, req.body.quarter_id
        ));
    } catch (e) {
        console.error(e);
        res.send({});
    }
});

app.post('/data', async (req, res) => {
    // console.log(`\n\nNEW LOGIN: ${req.session.username}\n------------------`);

    // fs.appendFile('usage_log.txt', `\n\nNEW LOGIN: ${req.session.username}\n------------------`, function (err) {
    // 	  if (err) throw err;
    // });

    let response;

    // Get data from scraper:
    if (req.session.nologin) {
        res.send({ nologin: true });
    }
    else {
        // TODO add nologin field for consistency
        try {
            res.send(await scraper.get_student(
                req.session.username, req.session.password,
                parseInt(req.body.quarter)
            ));
        } catch (e) {
            console.error(e);
            if (e.message === AspineErrorCode.LOGINFAIL) {
                res.send({ recent: { login_fail: true } });
            } else if (e.message === AspineErrorCode.ASPENDOWN) {
                // TODO send to the frontend somehow that Aspen is down
            }
        }
    }
});

app.post('/schedule', async (req, res) => {
    try {
        res.send(await scraper.get_schedule(
            req.session.username, req.session.password
        ));
    } catch (e) {
        console.error(e);
        res.send({ login_fail: true });
    }
});

app.post('/pdf', async (req, res) => {
    try {
        res.send(await scraper.get_pdf_files(
            req.session.username, req.session.password
        ));
    } catch (e) {
        console.error(e);
        res.send([]);
    }
});

app.get('/', async (req, res) => {
    if (req.session.username || req.session.nologin) {
        res.sendFile(__dirname + '/public/home.html');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => res.sendFile(__dirname + '/public/login.html'));

app.post('/login', async (req, res) => {
    if (req.body.username && req.body.password) {
        req.session.username = req.body.username;
        req.session.password = req.body.password;
    }
    else {
        req.session.nologin = true;
    }
    res.redirect('/');
});

app.get('/logout', async (req, res) => {
    req.session.destroy();
    if (req.query.fail === '1')
        res.redirect('/login?fail=1');
    else
        res.redirect('/login');
});


app.use((req, res) => {
    res.status(404);
    res.sendFile(__dirname + '/public/404.html');
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
