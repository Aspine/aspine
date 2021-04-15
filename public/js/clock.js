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

// Controls whether to use the covid-19 schedule or the regular schedule
const covid_schedule = true;
let current_schedule = covid_schedule ? "covid-may" : "regular";
// For covid-19 schedule
let selected_day_of_week = -1;
let day_of_week;

// For testing.
// If this is set to a valid date/time string, that will be used instead of the
// current date and time.
let date_override = undefined;

function schedulesCallback(response) {
    schedules = response;
    // Convert all start and end times to JavaScript Date objects
    for (const [, schedule] of Object.entries(schedules)) {
        for (entry of schedule) {
            const regexp = /(\d+):(\d+):(\d+)\.(\d+)/;
            // Convert each entry to a JavaScript Date object
            // (get hours, minutes, seconds, milliseconds)
            entry.start = new Date(2000, 0, 1,
                ...regexp.exec(entry.start).slice(1));
            entry.end = new Date(2000, 0, 1,
                ...regexp.exec(entry.end).slice(1));
        }
    }

    let last_interval = 0;
    const redraw_clock_with_timestamp = timestamp => {
        // Redraw clock 4 times per second (once every 1000/4 milliseconds)
        if (timestamp > last_interval * 1000/4) {
            last_interval++;
            redraw_clock();
        }
        window.requestAnimationFrame(redraw_clock_with_timestamp);
    }

    redraw_clock_with_timestamp();
}

function update_formattedSchedule() {
    if (selected_day_of_week < 0) {
        const now = date_override ? new Date(date_override) : new Date();
        day_of_week = now.getDay();
    } else {
        day_of_week = selected_day_of_week;
    }
    const bs_day = [1, 4].includes(day_of_week) ? "silver" : "black";

    currentTableData.formattedSchedule = schedules[current_schedule]
        .map(({ name, start, end }, i) => {
            let room = "";
            let class_name = get_period_name(name, day_of_week);
            for (entry of currentTableData.schedule[bs_day]) {
                if (entry.class.startsWith(class_name)) {
                    class_name = entry.class;
                    room = entry.room;
                    break;
                }
            }

            let timeString = start.toLocaleTimeString([], {
                hour: "numeric",
                minute: "numeric",
            });
            if (name !== "After School") {
                timeString += "–" + end.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "numeric",
                });
            }

            // The index (1 to 8) of the color to use for this class
            const color_number = i < 8 ? i + 1 : 8;
            let color;
            if (bs_day === "black") {
                color = `var(--schedule${color_number}`;
            } else {
                color = `var(--schedule${9 - color_number})`;
            }

            return {
                period: name,
                room: room,
                time: timeString,
                class: class_name,
                color: color,
            };
        });
}

//#ifndef lite
fetch("/schedule.json").then(async res => schedulesCallback(await res.json()));
//#endif
//#ifdef lite
/*
schedulesCallback(
//#include SCHEDULE
);
*/
//#endif

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

function drawTime(ctx, radius, pos, time) {
    ctx.fillStyle = 'white';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = "85px arial";

    // Use 12-hour time without AM/PM
    const hours = String.prototype.padStart.call(
        time.getHours() % 12, 2, "0"
    );
    const minutes = String.prototype.padStart.call(
        time.getMinutes(), 2, "0"
    );
    const seconds = String.prototype.padStart.call(
        time.getSeconds(), 2, "0"
    );
    ctx.fillText(`${hours}:${minutes}:${seconds}`, 0, 0);
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

function update_lunch() {
    // Get base of schedule name (excluding lunch-specific suffix)
    const [, base] = /^(.+?)(-[abc])?$/.exec(current_schedule);
    switch (parseInt(document.querySelector("#lunch_range").value)) {
        case 0:
            current_schedule = `${base}-a`;
            break;
        case 1:
            current_schedule = `${base}-b`;
            break;
        case 2:
            current_schedule = `${base}-c`;
            break;
    }
    redraw_clock();
    update_formattedSchedule();
    scheduleTable.setData(currentTableData.formattedSchedule);
}

// Takes an object with "room" and "id"
function get_schedule(p3room, p3id) {
    let floor = Math.floor(p3room / 1000);
    let zone = Math.floor((p3room % 1000) / 100);
    let subject = p3id.charAt(0);
    if((floor === 2 || floor === 2) && subject !== 'S') {
        document.getElementById("lunch_range").value = 1;
        return "regular-b";
    }
    if((zone < 6 && (floor === 4 || floor === 5)) || (zone === 6 && (floor === 2 || floor === 3)) /* || Biology ): */) {
        document.getElementById("lunch_range").value = 2;
        return "regular-c";
    }
    document.getElementById("lunch_range").value = 0;
    return "regular-a";
}

// Takes the default names (Period 1, etc) and overrides with real class
// names if they are available
function get_period_name(default_name, day_of_week) {
    if (typeof(currentTableData) === "undefined"
    || Object.keys(currentTableData).length === 0
    || typeof(currentTableData.schedule) === "undefined"
    || Object.keys(currentTableData.schedule).length === 0
    || typeof(currentTableData.schedule.black) === "undefined"
    || currentTableData.schedule.black.length === 0
    ) {
        return default_name;
    }
    if (period_names.black.length === 0) {
        // set period_names -- should only be run once
        period_names.black = currentTableData.schedule.black;
        period_names.silver = currentTableData.schedule.silver;
        // Guess lunch if there is a period 3 and we are not following the
        // covid schedule
        if (!covid_schedule && period_names.black[2]) {
            current_schedule = get_schedule(period_names.black[2].room, period_names.black[2].id);
        }
    }
    let bs_day;
    if (covid_schedule) {
        // TODO properly handle black/silver on Wednesdays
        bs_day = [1, 4].includes(day_of_week) ? "silver" : "black";

        // Split schedule name into base and lunch suffix
        const [, base, suffix] = /^(.+?)(-[abc])?$/.exec(current_schedule);

        // Determine which covid schedule to use
        if (day_of_week === 3) {
            current_schedule = `covid-may-w${suffix || ""}`;
        } else {
            current_schedule = `covid-may${suffix || ""}`;
        }
    } else {
        bs_day = document.getElementById("schedule_title").innerHTML
            .toLowerCase();
    }

    if (default_name === "Study Support") {
        // Number of period whose study support block is today
        let block = 0;
        switch (day_of_week) {
            case 1:
            case 2:
                block = day_of_week;
                break;
            case 4:
            case 5:
                block = day_of_week - 1;
                break;
        }
        for (const { name, period } of period_names[bs_day]) {
            if (period.includes(block)) {
                return name;
            }
        }
        return default_name;
    }

    // period_names has class names now
    for (const { name, period } of period_names[bs_day]) {
        if (period === default_name)
            return name;
        // "BLOCK 1", "BLOCK 2", etc.
        if (period === `BLOCK ${default_name.slice(-1)}`)
            return name;
        // For periods 1, 2, 3, 4 stored as strings containing "01", etc.
        let match;
        if ((match = period.match(/0\d/))) {
            if (default_name.includes(match[0].slice(-1))) {
                return name;
            }
        }
    }
    return default_name;
}

function redraw_clock() {
    const now = date_override ? new Date(date_override) : new Date();
    let day_of_week;
    if (selected_day_of_week < 0) {
        day_of_week = now.getDay();
    } else {
        day_of_week = selected_day_of_week;
    }
    // Fake call to get_period_name to set current_schedule
    get_period_name("Period 1", day_of_week);
    // Time to show on clock
    let time = new Date(2000, 0, 1, 0, 0, 0, 0);
    let period_name = "";
    // Time of day
    const tod = new Date(2000, 0, 1, now.getHours(), now.getMinutes(),
        now.getSeconds(), now.getMilliseconds());
    let pos;
    if (![0, 6].includes(now.getDay())) {
        // School day
        let current_period_i = 0;// Get current period from array
        while (current_period_i < schedules[current_schedule].length - 1 &&
                tod > schedules[current_schedule][current_period_i + 1].start) {
            current_period_i++;
        }

        const current_period = schedules[current_schedule][current_period_i];
        const next_period = schedules[current_schedule][current_period_i + 1];

        if (tod < current_period.start ||
            (!next_period && tod > current_period.end)) {
            // Realtime
            period_name = "";
            pos = tod % (12 * 60 * 60 * 1000) / (12 * 60 * 60 * 1000);
            time = tod;
        } else if (tod > current_period.end) { // Between classes
            period_name = get_period_name(current_period.name, day_of_week) +
            " ➡ " + get_period_name(next_period.name, day_of_week);
            pos = (tod - current_period.end) / (next_period.start - current_period.end);
            time = new Date(
                time.getTime() + next_period.start.getTime() - tod.getTime()
            );
        } else { // In class
            period_name = get_period_name(current_period.name, day_of_week);
            pos = (tod - current_period.start) / (current_period.end - current_period.start);
            time = new Date(
                time.getTime() + current_period.end.getTime() - tod.getTime()
            );
        }
    } else {
        // Realtime
        period_name = "";
        pos = tod % (12 * 60 * 60 * 1000) / (12 * 60 * 60 * 1000);
        time = tod;
    }

    // conver 0-1 to 0-2pi
    pos = pos * 2 * Math.PI;

    drawFace(small_ctx, small_radius);
    drawName(period_name);
    drawHand(small_ctx, small_radius, pos, small_radius * .94, small_radius * .095);
    drawTime(small_ctx, small_radius, pos, time);

    drawFace(large_ctx, large_radius);
    drawName(period_name);
    drawHand(large_ctx, large_radius, pos, large_radius * .94, large_radius * .095);
    drawTime(large_ctx, large_radius, pos, time);
}
