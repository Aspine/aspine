#!/bin/node

// --------------- Includes ------------------
const express = require('express');
const scraper = require('./scrape.js');
const bodyParser = require('body-parser');
const Tabulator = require('tabulator-tables');

// -------------------------------------------


// ------------ Web Server -------------------
const app = express();
const port = 8080;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/data', async (req, res) => {
    console.log(`\n\nNEW LOGIN: ${req.body.username}\n------------------`);
    res.send(await scraper.scrape_student(req.body.username, req.body.password));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// -------------------------------------------
