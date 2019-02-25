let current_schedule = "regular";
let schedules, logo;

let small_ctx, small_radius;
let small_clock = document.getElementById("small_clock");
small_ctx = small_clock.getContext("2d");
small_radius = small_clock.height / 2;
small_ctx.translate(small_radius, small_radius);

let large_ctx, large_radius;
let large_clock = document.getElementById("large_clock");
large_ctx = large_clock.getContext("2d");
large_radius = large_clock.height / 2;
large_ctx.translate(large_radius, large_radius);

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
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.arc(0, 0, length, -Math.PI/2, pos - Math.PI/2); 
    ctx.stroke();
}

function drawFace(ctx, radius) {
    ctx.moveTo(0,0);
    ctx.clearRect(-radius, -radius, radius * 2, radius * 2);
    ctx.fillStyle = '#268A48';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.drawImage(logo, -radius, -radius, 2 * radius, 2 * radius);
}

function drawNumber(ctx, radius, pos, number) {
    ctx.fillStyle = 'white';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = "75px arial";
    // Get time in seconds
    let time = number / 1000;
    // Get first and second digit

    // hours
    let d1 = Math.floor(time / 60 / 60);
    // minutes
    let d2 = Math.floor(time / 60 % 60);
    // seconds
    let d3 = Math.floor(time % 60);

    if(d1 < 10) {
        d1 = `0${d1}`;
    }
    if(d2 < 10) {
        d2 = `0${d2}`;
    }
    if(d3 < 10) {
        d3 = `0${d3}`;
    }

    ctx.fillText(`${d1}:${d2}:${d3}`, 0, radius/4);
}

function drawName(ctx, radius, name) {
    ctx.fillStyle = 'white';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = fitText(ctx, name, "arial", radius * 1.5) + "px arial";
    ctx.fillText(name, 0, -radius/4);
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

    let number = 0;
    let period_length = -1;
    let period_name = "";

    if(tod < current_period.start) { // Before school
        period_length = current_period.start;
        period_name = "Before School";
        pos = tod / period_length;
        number = current_period.start - tod;
    }
    else if(!next_period && tod > current_period.end) { // After school
        period_length = 24 * 60 * 60 * 1000 - current_period.end;
        period_name = "After School";
        pos = (tod - current_period.end) / period_length;
        number = tod - current_period.end;
    }
    else if(tod > current_period.end) { // Between classes
        period_length = next_period.start - current_period.end;
        period_name = current_period.name + " ➡ " + next_period.name;
        pos = (tod - current_period.end) / period_length;
        number = next_period.start - tod;
    }
    else { // In class
        period_length = current_period.end - current_period.start;
        period_name = current_period.name;
        pos = (tod - current_period.start) / period_length;
        number = current_period.end - tod;
    }
        
    pos = pos * 2 * Math.PI;

    drawFace(small_ctx, small_radius);
    drawName(small_ctx, small_radius, period_name);
    drawHand(small_ctx, small_radius, pos, small_radius * .94, small_radius * .095);
    drawNumber(small_ctx, small_radius, pos, number);

    drawFace(large_ctx, large_radius);
    drawName(large_ctx, large_radius, period_name);
    drawHand(large_ctx, large_radius, pos, large_radius * .94, large_radius * .095);
    drawNumber(large_ctx, large_radius, pos, period_length);
}
