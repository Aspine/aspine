let current_schedule = "regular";
let ctx, radius, schedules, logo;

let clock = document.getElementById("clock");
ctx = clock.getContext("2d");
radius = clock.height / 2;
ctx.translate(radius, radius);
logo = document.getElementById("logo");

xhttp = new XMLHttpRequest;
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        schedules = JSON.parse(this.responseText);
        redraw_clock();
        setInterval(function() {
            redraw_clock();
        }, 1000);
    }
};
xhttp.open("GET", "schedule.json");
xhttp.send();

function drawHand(ctx, radius, pos, length, width) {
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.moveTo(0,0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
}

function drawFace(ctx, radius) {
    ctx.moveTo(0,0);
    ctx.clearRect(-radius, -radius, radius * 2, radius * 2);
    ctx.drawImage(logo, -radius, -radius, 2 * radius, 2 * radius);
}

function drawNumber(ctx, radius, pos, period_length) {
    ctx.fillStyle = 'green';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = "75px arial";
    // Get time in seconds
    let time = (1 - pos / (2 * Math.PI)) * period_length / 1000;
    // Get first and second digit
    let d1, d2;
    if(time / 60 < 60) {
        d1 = Math.floor(time / 60);
        d2 = Math.floor(time % 60);
    }
    else {
        d1 = Math.floor(time / 60 / 60);
        d2 = Math.floor(time / 60 % 60);
    }
    if(d2 < 10) {
        d2 = "0" + d2;
    }
    ctx.fillText(d1 + ":" + d2, 0, 2*radius/3);
}

function drawName(ctx, radius, name) {
    ctx.fillStyle = 'green';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = fitText(ctx, name, "arial", radius * 1.5) + "px arial";
    ctx.fillText(name, 0, radius/3);
}

function fitText(ctx, text, fontface, width) {
    // start with a large font size
    let fontsize = 75;

    // lower the font size until the text fits the canvas
    do {
        fontsize--;
        ctx.font = fontsize + "px " + fontface;
    } while (ctx.measureText(text).width > width)

    return fontsize;
}

function redraw_clock() {
    // UTC to EST
    let now = Date.now() - 5 * 60 * 60 * 1000;
    let tod = now % (24 * 60 * 60 * 1000);
    //let tod = 71399000;
    let pos = 0;

    let current_period_i = 0;// Get current period from array
    while(current_period_i < schedules[current_schedule].length - 1 &&
        tod > schedules[current_schedule][current_period_i + 1].start) {
        current_period_i++;
    }

    let current_period = schedules[current_schedule][current_period_i];
    let next_period = schedules[current_schedule][current_period_i + 1];

    let period_length = -1;
    let period_name = "";

    if(tod < current_period.start) { // Before school
        period_length = current_period.start;
        period_name = "Before School";
        pos = tod / period_length;
    }
    else if(!next_period && tod > current_period.end) { // After school
        period_length = 24 * 60 * 60 * 1000 - current_period.end;
        period_name = "After School";
        pos = (tod - current_period.end) / period_length;
    }

    else if(tod > current_period.end) { // Between classes
        period_length = next_period.start - current_period.end;
        period_name = current_period.name + " ➡ " + next_period.name;
        pos = (tod - current_period.end) / period_length;
    }
    else { // In class
        period_length = current_period.end - current_period.start;
        period_name = current_period.name;
        pos = (tod - current_period.start) / period_length;
    }
        
    pos = pos * 2 * Math.PI;

    drawFace(ctx, radius);
    drawName(ctx, radius, period_name);
    drawHand(ctx, radius, pos, radius * .75, radius * .04);
    drawNumber(ctx, radius, pos, period_length);
}
