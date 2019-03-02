let current_schedule = "regular";
let schedules, logo;
let period_names = {black:[], silver:[]};

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
    ctx.fillStyle = '#63C082';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.drawImage(logo, -radius, -radius, 2 * radius, 2 * radius);
}

function drawNumber(ctx, radius, pos, number) {
    ctx.fillStyle = 'white';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = "85px arial";
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

    ctx.fillText(`${d1}:${d2}:${d3}`, 0, 0);
}

function drawName(name) {
    document.getElementById("small_clock_period").innerHTML = name;
    document.getElementById("large_clock_period").innerHTML = name;
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

// Takes the default names (Period 1, etc) and overrides with real class
// names if they are available
function get_period_name(default_name) {
    if(Object.keys(tableData).length == 0) {
        return default_name;
    }
    if(period_names.black.length == 0) {
        // set period_names -- should only be run once
        for(let i in tableData.schedule.black) {
            if(tableData.schedule.black[i].name != "Community Meeting");
            period_names.black.push(tableData.schedule.black[i].name);
        }
        for(let i in tableData.schedule.silver) {
            period_names.silver.push(tableData.schedule.silver[i].name);
        }
        // TODO: calculate lunch
    }
    let bs_day = document.getElementById("schedule_title").innerHTML.toLowerCase();
    // period_names has class names now
    let index = Number(default_name.charAt(default_name.length - 1));
    if(isNaN(index)) {
        return default_name;
    }
    return period_names[bs_day][index];
}

function redraw_clock() {
    // UTC to EST
    let now = Date.now() - 10 * 60 * 60 * 1000;
    let tod = now % (24 * 60 * 60 * 1000);
    // let tod = 41399000; // Simulate time
    let pos = 0;

    let current_period_i = 0;// Get current period from array
    while(current_period_i < schedules[current_schedule].length - 1 &&
        tod > schedules[current_schedule][current_period_i + 1].start) {
        current_period_i++;
    }

    let current_period = schedules[current_schedule][current_period_i];
    let next_period = schedules[current_schedule][current_period_i + 1];

    let number = 0;
    let period_name = "";

    if(tod < current_period.start) { // Before school
        period_name = "Before School";
        pos = tod / current_period.start;
        number = current_period.start - tod;
    }
    else if(!next_period && tod > current_period.end) { // After school
        period_name = "";
        pos = tod % (12 * 60 * 60 * 1000) / (12 * 60 * 60 * 1000);
        number = tod % (12 * 60 * 60 * 1000);
    }
    else if(tod > current_period.end) { // Between classes
        period_name = get_period_name(current_period.name) +
            " ➡ " + get_period_name(next_period.name);
        pos = (tod - current_period.end) / (next_period.start - current_period.end);
        number = next_period.start - tod;
    }
    else { // In class
        period_name = get_period_name(current_period.name);
        pos = (tod - current_period.start) / (current_period.end - current_period.start);
        number = current_period.end - tod;
    }
        
    pos = pos * 2 * Math.PI;

    drawFace(small_ctx, small_radius);
    drawName(period_name);
    drawHand(small_ctx, small_radius, pos, small_radius * .94, small_radius * .095);
    drawNumber(small_ctx, small_radius, pos, number);

    drawFace(large_ctx, large_radius);
    drawName(period_name);
    drawHand(large_ctx, large_radius, pos, large_radius * .94, large_radius * .095);
    drawNumber(large_ctx, large_radius, pos, number);
}
