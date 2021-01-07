// State

const termConverter = ['current', 'q1', 'q2', 'q3', 'q4'];
let pdf_index = 0;
let pdfrendering = false;
let modals = {
    "stats": document.getElementById('stats_modal'),
    "corrections": document.getElementById('corrections_modal'),
    "export": document.getElementById('export_modal'),
    "import": document.getElementById('import_modal')
};
let statsModal = document.getElementById('stats_modal');
let correctionsModal = document.getElementById('corrections_modal');
let exportModal = document.getElementById('export_modal');
let importModal = document.getElementById('import_modal');
let term_dropdown_active = true;
let currentTerm = "current";
/**
 * All the data provided by Aspine API
 *  @typedef TableDataObject
 *	@property {GPA} [cumGPA]
 *	@property {Term} [currentTermData]
 *	@property {string} [name]
 *	@property {Overview[]} [overview]
 *	@property {RecentActivity} [recent]
 *	@property {Schedule} [schedule]
 *	@property {Terms} [terms]
 *  @property {?string} [username]
 *  @property {boolean} [imported=true]
 */
/** @type {TableDataObject[]}*/
let tableData = [{ name: "Current Year" }];
let currentTableDataIndex = 0;
/**@type {TableDataObject}*/
let currentTableData = tableData[currentTableDataIndex];
let selected_class_i;
let termsReset = {};

// Counter for creating new assignments
var newAssignmentIDCounter = 0;

let tempCell;
// When the user clicks anywhere outside of a modal or dropdown, close it
window.addEventListener("click", function(event) {
    Object.keys(modals).forEach(key => {
        if (event.target === modals[key]) {
            hideModal(key);
        }
    });
    // Do not close a dropdown if the user clicked to view a tooltip
    // (e.g. on a mobile device)
    if (!event.target.classList.contains("hastooltip")) {
        closeAllSelect();
        pdf_closeAllSelect();
        tableData_closeAllSelect();
    }
});

// Detect color scheme (dark or light) and set slider accordingly
// Argument (optional) can be a "change" event from a MediaQueryList;
// if present, e.matches is used to determine the operating system color scheme
function loadMode(e = {}) {
    const slider = document.getElementById("dark-check");
    // Get the mode (dark or light) stored in localStorage, if any
    const storedMode = localStorage.getItem('color-scheme');
    // Check if operating system uses dark mode
    const osIsDark = "matches" in e ? e.matches :
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (storedMode ? storedMode === "dark" : osIsDark) {
        document.body.classList.add("dark");
        slider.checked = true;
    } else {
        document.body.classList.remove("dark");
        slider.checked = false;
    }
}

// Update color scheme on page load as well as when system color scheme changes
window.addEventListener("load", loadMode);
window.matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", loadMode);

// Toggle between dark and light mode
function darkMode() {
    document.body.classList.toggle("dark");
    localStorage.setItem("color-scheme",
        document.querySelector("body").classList.contains("dark") ?
            'dark' : 'light');
}

initialize_jquery_prototype()

$('#stats_plot').width($(window).width() * 7 / 11);
/*
window.addEventListener('resize', function() {
    console.log("Resizing");
    if ($('#stats_plot').is(":visible")) {

      Plotly.Plots.resize(document.getElementById('stats_plot'));
      let update_size = {
        //width: 800,  // or any new width
        width: $('#stats_modal_content').width(),
        height: 120  // " "
      };

      Plotly.relayout('stats_plot', update_size);
    }

    if ($('#pdf-canvas').is(":visible") && !pdfrendering && typeof tableData.pdf_files !== 'undefined') {
      generate_pdf(pdf_index);
    }
});
*/
let noStats = function() {
    $("#there_are_stats").hide();
    $("#there_are_no_stats").show();
    document.getElementById("no_stats_caption").innerHTML = "No Statistics Data for this assignment";
    document.getElementById("stats_modal_content").style.height = "5rem";
};

/**
 * Hide a modal window
 * @param {string} key Name of modal window.
 */
let hideModal = function(key) {
    modals[key].style.display = "none";
    switch (key)
    {
        case 'stats':
            noStats();
            break;
        case 'corrections':
            document.getElementById("corrections_modal_input").value = "";
            break;
        default:
            console.error(`${key} is not a valid modal name`)
    }
}

/**
 * Un-hide a modal window
 * @param {string} key Name of modal window.
 */
let showModal = function(key) {
    modals[key].style.display = "inline-block";
}

let recentAttendance = new Tabulator("#recentAttendance", {
    //	height: 400,
    layout: "fitColumns",
    columns: [
        { title:"Date", field:"date", headerSort: false },
        { title:"Class", field:"classname", headerSort: false },
        { title:"Period", field:"period", headerSort: false },
        { title:"Event", field:"event", headerSort: false },
    ],
});

let recentActivity = new Tabulator("#recentActivity", {
    //	height: 400,
    layout: "fitColumns",
    columns: [
        {title: "Date", field: "date", formatter: rowFormatter},
        {title: "Class", field: "classname", formatter: classFormatter},
        {title: "Assignment", field: "assignment", formatter: rowFormatter, headerSort: false},
        {title: "Score", field: "score", formatter: rowFormatter, headerSort: false},
        {title: "Max Score", field: "max_score", formatter: rowFormatter, headerSort: false},
        {title: "Percentage", field: "percentage", formatter: rowGradeFormatter},
    ],
    rowClick: function(e, row) { //trigger an alert message when the row is clicked
        // questionable
        $("#mostRecentDiv").hide();
        classesTable.selectRow(1);

        let elem = document.getElementById("default_open");
        let evt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        // If cancelled, don't dispatch our event
        let canceled = !elem.dispatchEvent(evt);

        assignmentsTable.clearFilter();
        document.getElementById("categoriesTable").style.display = "block";
        document.getElementById("assignmentsTable").style.display = "block";
        let selected_class = row.getData().classname;
        let tabledata = classesTable.getData();
        classesTable.deselectRow();
        classesTable.selectRow(selected_class);
        //classesTable.getRows()
        //    .filter(row => row.getData().name === selected_class)
        //    .forEach(row => row.toggleSelect());

        for (let i in tabledata) {
            if (tabledata[i].name === row.getData().classname) {
                assignmentsTable.setData(tabledata[i].assignments);
                categoriesTable.setData(tabledata[i].categoryDisplay);
                return;
            }
        }

        classesTable.selectRow(1);
    },
});

// Index of the row that's currently selected in the categories table
// (gets reset to -1 whenever the class is changed)
let currentFilterRow = -1;
let categoriesTable = new Tabulator("#categoriesTable", {
    //	height: 400,
    selectable: 1,
    layout: "fitColumns",
    layoutColumnsOnNewData: true,
    columns: [
        {title: "Category", field: "category", formatter: rowFormatter, headerSort: false},
        {title: "Weight", field: "weight", formatter: weightFormatter, headerSort: false},
        {title: "Score", field: "score", formatter: rowFormatter, headerSort: false},
        {title: "Max Score", field: "maxScore", formatter: rowFormatter, headerSort: false},
        {title: "Percentage", field: "grade", formatter: rowGradeFormatter, headerSort: false},
        //filler column to match the assignments table
        //{title: "", width:1, align:"center", headerSort: false},
        {
            title: "Hide",
            titleFormatter: () => '<i class="fa fa-eye-slash header-icon tooltip" aria-hidden="true" tooltip="Hide"></i>',
            headerClick: hideCategoriesTable,
            width: 76,
            headerSort: false,
            cssClass: "icon-col"
        },
    ],
    rowClick: function(e, row) { //trigger an alert message when the row is clicked
        assignmentsTable.clearFilter();

        if (currentFilterRow !== row.getPosition()) {
            currentFilterRow = row.getPosition();
            assignmentsTable.addFilter([
                {field: "category", type: "=", value: row.getData().category}
            ]);
        }
        else {
            currentFilterRow = -1;
        }
    },
});

let mostRecentTable = new Tabulator("#mostRecentTable", {
    //	height: 400,
    layout: "fitColumns",
    columns: [
        //{title:"Date", field:"date", formatter: rowFormatter, headerSort: false},
        {title: "Date", field: "date", formatter: rowFormatter},
        {title: "Class", field: "classname", formatter: classFormatter},
        {title: "Assignment", field: "assignment", formatter: rowFormatter, headerSort: false},
        {title: "Score", field: "score", formatter: rowFormatter, headerSort: false},
        {title: "Max Score", field: "max_score", formatter: rowFormatter, headerSort: false},
        {title: "Percentage", field: "percentage", formatter: rowGradeFormatter},
    ],
    rowClick: function(e, row) { //trigger an alert message when the row is clicked
        $("#mostRecentDiv").hide();

        classesTable.selectRow(1);

        let elem = document.getElementById("default_open");
        let evt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        // If cancelled, don't dispatch our event
        let canceled = !elem.dispatchEvent(evt);

        assignmentsTable.clearFilter();
        document.getElementById("categoriesTable").style.display = "block";
        document.getElementById("assignmentsTable").style.display = "block";
        let selected_class = row.getData().classname;
        let tabledata = classesTable.getData();
        classesTable.deselectRow();
        classesTable.selectRow(selected_class);
        //classesTable.getRows()
        //    .filter(row => row.getData().name === selected_class)
        //    .forEach(row => row.toggleSelect());

        for (let i in tabledata) {
            if (tabledata[i].name === row.getData().classname) {
                assignmentsTable.setData(tabledata[i].assignments);
                categoriesTable.setData(tabledata[i].categoryDisplay);
                return;
            }
        }
        classesTable.selectRow(1);
    },
});


//create Tabulator on DOM element with id "assignmentsTable"
let assignmentsTable = new Tabulator("#assignmentsTable", {
    height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    //data:tabledata[0].assignments, //assign data to table
    layout: "fitColumns", //fit columns to width of table (optional)
    //rowFormatter: function(row) {
    //	row.getElement().style.backgroundColor = row.getData().color;
    //},
    dataEdited: editAssignment,
    columns: [ //Define Table Columns
        {
            title: "Assignment",
            field: "name",
            editor: "input",
            formatter: rowFormatter,
            headerSort: false,
        },
        {
            title: "Category",
            field: "category",
            editor: "select",
            editorParams: cell => ({
                values: Object.entries(
                    currentTableData.currentTermData
                    .classes[selected_class_i].categories
                ).map(([cat, weight]) =>
                    `${cat} (${parseFloat(weight) * 100}%)`
                )
            }),
        },
        {
            title: "Score",
            field: "score",
            editor: "number",
            editorParams: {min: 0, max: 100, step: 1},
            formatter: rowFormatter,
            headerSort: false,
        },
        {
            title: "Max Score",
            field: "max_score",
            editor: "number",
            editorParams: {min: 0, max: 100, step: 1},
            formatter: rowFormatter,
            headerSort: false,
        },
        {
            title: "Percentage",
            field: "percentage",
            formatter: rowGradeFormatter,
            headerSort: false,
        },
        {
            title: "Corrections",
            titleFormatter: () => '<i class="fa fa-toolbox" aria-hidden="true"></i>',
            formatter: cell =>
                (!isNaN(cell.getRow().getData().score)) ?
                '<i class="fa fa-hammer standard-icon tooltip" aria-hidden="true" tooltip="Revisions"></i>' : "",
            width: 40,
            align: "center",
            cellClick: function(e, cell) {
                console.log(cell);
                tempCell = cell;
                showModal("corrections");
                $("#corrections_modal_input").focus();
            },
            headerSort: false,
            cssClass: "icon-col allow-overflow"
        },
        {
            title: "Stats",
            titleFormatter: () => '<i class="material-icons md-18" aria-hidden="true">leaderboard</i>',
            formatter: cell => (
                isNaN(cell.getRow().getData().score)
                || currentTableData.currentTermData
                    .classes[selected_class_i]
                    .assignments.filter(value => {
                        return !(value["placeholder"] || false)
                    })[cell.getRow().getPosition()].synthetic
            ) ? "" : '<i class="fa fa-info standard-icon tooltip" aria-hidden="true" tooltip="Statistics"></i>',
            width: 40,
            align: "center",
            cellClick: async function(e, cell) {
                if (
                    isNaN(cell.getRow().getData().score)
                    || currentTableData.currentTermData
                        .classes[selected_class_i]
                        .assignments[cell.getRow().getPosition()].synthetic
                ) return;
                noStats();
                document.getElementById("no_stats_caption").innerHTML = "Loading Statistics...";
                showModal("stats");

                const {
                    assignment_id,
                    name: assignment,
                    score,
                    max_score,
                    date_assigned,
                    date_due,
                    feedback: assignment_feedback,
                } = cell.getRow().getData();

                let { high, low, median, mean } = await $.ajax({
                    url: "/stats",
                    method: "POST",
                    data: {
                        assignment_id: assignment_id,
                        class_id: currentTableData.currentTermData
                            .classes[selected_class_i].oid,
                        quarter_id: currentTableData.currentTermData
                            .quarter_oid,
                    },
                });
                if ([high, low, median, mean].some(x => x === undefined)) {
                    noStats();
                    return;
                }

                const q1 = (low + median) / 2;
                const q3 = (high + median) / 2;

                $("#stats_modal_title").text(`Assignment: ${assignment}`);
                $("#stats_modal_score").text(`${score} / ${max_score}`);
                $("#stats_modal_lmh").text(`${low}, ${median}, ${high}`);
                $("#stats_modal_mean").text(mean);
                $("#stats_modal_date_assigned").text(date_assigned);
                $("#stats_modal_date_due").text(date_due);
                $("#stats_modal_feedback").text(assignment_feedback || "None");

                $("#stats_modal_content").css("height", "600px");
                $("#there_are_stats").show();
                $("#there_are_no_stats").hide();

                let plotStats = {};
                plotStats.fiveNums = [low, q1, median, q3, high];
                plotStats.iqr = q3 - q1;
                const step = plotStats.step = plotStats.iqr * 1.5;
                plotStats.fences = [
                    {
                        start: q1 - step - step,
                        end: q1 - step
                    },
                    {
                        start: q1 - step,
                        end: q1
                    },
                    {
                        start: q1,
                        end: q3
                    },
                    {
                        start: q3,
                        end: q3 + step
                    },
                    {
                        start: q3 + step,
                        end: q3 + step + step
                    },
                ];
                plotStats.boxes = [
                    { start: q1, end: median },
                    { start: median, end: q3 },
                ];
                plotStats.whiskers = [
                    { start: low, end: q1 },
                    { start: high, end: q3 },
                ];
                plotStats.points = [];

                const plotElem = d3.select("#stats_plot");
                plotElem.style("display", "inline");

                $("#stats_plot").css("width", "100%");

                // Get base font size in pixels (= 1rem)
                // https://stackoverflow.com/a/42769683
                const baseFontSize = parseFloat(
                    window.getComputedStyle(document.documentElement)
                        .fontSize
                );

                const plotWidth = $("#stats_plot").width() - baseFontSize;
                const plotHeight = 1.5 * baseFontSize;

                let x = d3.scaleLinear()
                    .domain([low < 0 ? low : 0, high])
                    .range([0, plotWidth]);

                const plot = d3.boxplot()
                    .scale(x)
                    .bandwidth(plotHeight)
                    .boxwidth(plotHeight)
                    .jitter(false)
                    .opacity(1.0)
                    .showInnerDots(false);

                plotElem.attr("viewBox", `${
                    -(0.75 * baseFontSize)
                } 0 ${
                    plotWidth + 1.5 * baseFontSize
                } ${
                    0.75 * baseFontSize
                    + plotHeight
                    + 0.75 * baseFontSize
                    + 20
                    + baseFontSize
                }`);

                // Remove anything lingering from other assignments
                plotElem.selectAll("*").remove();

                // Box plot
                plotElem.append("g")
                    .attr("class", "plot")
                    .attr("transform", `translate(0, ${
                        0.75 * baseFontSize
                    })`)
                    .datum(plotStats)
                    .attr("color", "#ff66ff")
                    .attr("style", "color: #ff66ff;")
                    .call(plot);
                // Horizontal axis
                plotElem.append("g")
                    .attr("class", "axis")
                    .attr("transform", `translate(0, ${
                        0.75 * baseFontSize
                        + plotHeight
                        + 0.75 * baseFontSize
                    })`)
                    .call(d3.axisBottom().scale(x));

                plotElem.select(".axis").selectAll("line, path")
                    .attr("stroke", "#888");
                plotElem.select(".axis").selectAll("text")
                    .attr("fill", "#888")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "0.75rem");

                for (let i = 60; i <= 100; i += 10) {
                    const xcoord = x(i / 100 * max_score);
                    plotElem.append("line")
                        .attr("y1", plotHeight + 1.5 * baseFontSize + 20)
                        .attr("y2", plotHeight + 1.5 * baseFontSize + 20
                            + baseFontSize)
                        .attr("x1", xcoord)
                        .attr("x2", xcoord)
                        .attr("stroke", "#888")
                        .attr("stroke-width", "0.2rem");
                }
                for (let i = 65; i < 100; i += 10) {
                    const xcoord = x(i / 100 * max_score);
                    plotElem.append("text")
                        .attr("y", plotHeight + 1.5 * baseFontSize + 20
                            + 0.75 * baseFontSize)
                        .attr("x", xcoord)
                        .attr("fill", getColor(i))
                        .attr("font-size", "1rem")
                        .attr("text-anchor", "middle")
                        .text(getLetterGrade(i));
                }

                // Add line at mean
                plotElem.append("line")
                    .attr("class", "mean-line")
                    .attr("y1", 0)
                    .attr("y2", plotHeight + 1.5 * baseFontSize)
                    .attr("x1", x(mean))
                    .attr("x2", x(mean))
                    .attr("stroke", "#888")
                    .attr("stroke-width", "0.2rem");

                // Add line at student's score
                plotElem.append("line")
                    .attr("class", "score-line")
                    .attr("y1", 0)
                    .attr("y2", plotHeight + 1.5 * baseFontSize)
                    .attr("x1", x(score))
                    .attr("x2", x(score))
                    .attr("stroke", "#b300ff")
                    .attr("stroke-width", "0.2rem");
            },
            headerSort: false,
            cssClass: "icon-col allow-overflow"
        },
        {
            title: "Add",
            titleFormatter: () => '<i class="fa fa-plus grades tooltip" aria-hidden="true" tooltip="New Assignment" tooltip-margin="-113px"></i>',
            headerClick: newAssignment,
            formatter: () => '<i class="fa fa-times standard-icon tooltip" aria-hidden="true" style="color: #ce1515; font-size: 1.3em" tooltip="Delete Assignment" tooltip-margin="-127px"></i>',
            width: 40,
            align: "center",
            cellClick: function(e, cell) {
                const data = cell.getRow().getData()
                replaceAssignmentFromID(data, {assignment_id: data["assignment_id"], placeholder: true}, selected_class_i);

                new Snackbar(`You deleted ${data["name"]}`, {
                    color: "var(--red1)",
                    textColor: "var(--white)",
                    buttonText: "Undo", 
                    buttonClick: () => replaceAssignmentFromID({ assignment_id: data["assignment_id"], placeholder: true }, data, selected_class_i),
                    timeout: 7500,
                    timeoutFunction: () => removeAssignmentFromID(data["assignment_id"], selected_class_i),
                    bodyClick: () => removeAssignmentFromID(data["assignment_id"], selected_class_i),
                }).show();
            },
            headerSort: false,
            cssClass: "icon-col allow-overflow"
        },
    ],
});

//create Tabulator on DOM element with id "scheduleTable"
let scheduleTable = new Tabulator("#scheduleTable", {
    layout: "fitDataFill", //fit columns to width of table (optional)
    rowFormatter: function(row) {
        row.getElement().style.transition = "all 1s ease";
        row.getElement().style.backgroundColor = row.getData().color;
    },
    columns: [ //Define Table Columns
        {
            title: "Period",
            field: "period",
            width: 150,
            headerSort: false,
            formatter: "html",
        },
        {
            title: "Time",
            field: "time",
            width: 150,
            headerSort: false,
        },
        {
            title: "Room",
            field: "room",
            width: 150,
            headerSort: false,
        },
        {
            title: "Class",
            field: "class",
            width: 400,
            headerSort: false,
            formatter: "html",
        },
    ],
});

let classesTable = new Tabulator("#classesTable", {
    //height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
    index: "name",
    selectable: 1,
    layout: "fitColumns", //fit columns to width of table (optional)
    columns: [ // Define Table Columns
        {
            title: "Class",
            field: "name",
            formatter: cell => {
                let rowColor = cell.getRow().getData().color;
                let value = cell.getValue();

                if (vip_username_list.includes(currentTableData.username)) {
                    return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + value + "</span>";
                }
                if (rowColor === "black") {
                    return value;
                } else {
                    return "<span style='color:" + rowColor + "; font-weight:bold;'>" + value + "</span>";
                }
            },
            headerSort: false,
        },
        {
            title: "Grade",
            field: "grade",
            align: "left",
            formatter: gradeFormatter,
            headerSort: false,
        },
        {
            title: "Export Table Data",
            titleFormatter: () => '<i class="fa fa-file-download header-icon tooltip" aria-hidden="true" tooltip="Export Grades"></i>',
            headerClick: async () => {
                // Disable checkboxes for inaccessible terms
                termConverter.forEach(term => {
                    let isAccessibleObj = isAccessible(term);

                    if (isAccessibleObj.accessible) {
                        $(`#export_checkbox_terms_${term}`).removeAttr("disabled");
                        $(`#export_checkbox_terms_${term} ~ span`)
                            .removeAttr("aria-label")
                            .removeAttr("tabindex")
                            .removeClass("hastooltip");
                    } else {
                        $(`#export_checkbox_terms_${term}`).attr("disabled", true);
                        $(`#export_checkbox_terms_${term} ~ span`)
                            .attr("aria-label", isAccessibleObj.reason)
                            .attr("tabindex", 0)
                            .addClass("hastooltip");
                    }
                });
                exportModal.style.display = "inline-block";
            },
            width: 76,
            headerSort: false,
            cssClass: "icon-col"
        },
        {
            title: "Reset Table Data",
            titleFormatter: () => '<i class="fa fa-sync-alt header-icon tooltip" aria-hidden="true" tooltip="Reset"></i>',
            headerClick: resetTableData,
            width: 76,
            headerSort: false,
            cssClass: "icon-col"
        },
    ],
    rowClick: function(e, row) { // trigger an alert message when the row is clicked
        $("#mostRecentDiv").hide();

        assignmentsTable.clearFilter();
        currentFilterRow = -1;

        document.getElementById("categoriesTable").style.display = "block";
        document.getElementById("assignmentsTable").style.display = "block";
        selected_class_i = row.getPosition();
        // console.log("set " + row.getPosition() + "as selected class");
        let tabledata = classesTable.getData();
        for (let i in tabledata) {
            if (tabledata[i].name === row.getData().name) {
                assignmentsTable.setData(tabledata[i].assignments);
                categoriesTable.setData(tabledata[i].categoryDisplay);

                //sets up the tooltip margins for the newly created table(s)
                setup_tooltips();

                return;
            }
        }
    },
});

//sets up the tooltips in the classes table
setup_tooltips()

function correct() {
    const per = parseInt($("#corrections_modal_input").prop("value"));
    if (per > 0 && per <= 100) {
        const row = tempCell.getRow();
        const { score, max_score } = row.getData();

        const diff = max_score - score;
        const pts_back = diff * per/100;
        const newScore = score + pts_back;
        const rowPos = row.getPosition();
        currentTableData.currentTermData.classes[selected_class_i].assignments[rowPos].score = newScore;
        row.update({ score: newScore });
        assignmentsTable.setData(currentTableData.currentTermData.classes[selected_class_i].assignments);

        editAssignment(currentTableData.currentTermData.classes[selected_class_i].assignments)

        assignmentsTable.redraw();
        categoriesTable.redraw();
        classesTable.redraw();
    }
    hideModal("corrections");
}

// Bind Enter key to "Apply Corrections" button in corrections modal
$("#corrections_modal_input").keypress(({ which }) => {
    // 13 is the keycode for Enter
    if (which === 13) {
        correct();
    }
});
/**
 * @typedef {object} Classes
 * @param {string} name
 * @param {string} grade
 * @param {object} categories
 * @param {object[]} assignments
 * @param {object} tokens
 *
 * @typedef {object} RecentActivity
 * @param {RecentAttendance[]} recentAttendanceArray
 * @param {RecentAssignments[]} recentActivityArray
 * @param {string} studentName
 *
 * @typedef {object} scrapedStudent
 * @param {Classes[]} response.classes
 * @param {RecentActivity} response.recent
 * @param {Overview[]} response.overview
 * @param {string} response.username
 * @param {string} response.quarter
 *
 * @typedef {object} noLogin response object on no login
 * @oaram {boolean} noLogin.nologin - parameter present on login fail
 */
 /** Callback for response from /data
 *
 * @param {noLogin|scrapedStudent} response
 * @param {(scrapedStudent|string)} includedTerms - optional parameter which contains the terms included in an import (in the case that
 * currentTableData is imported and not all of the terms' data have been put into currentTableData)
 */
function responseCallback(response, includedTerms) {
    // console.log(response);
    if (response.nologin) {
        tableData = []; // TODO: dont manipulate global state here, return values
        currentTableData = undefined;
        currentTableDataIndex = -1;

        $("#reports_open").hide();
        $("#loader").hide();

        showModal("import");
        return;
    }
    if (response.error) {
        location.href = `/logout?error=${response.error}`;
        return;
    }

    if (response.classes.length === 0) {
        response.classes = [{
            "name": "No Classes",
            "grade": "No Grades",
            "categories": {
                "No Categories": "1.0"
            },
            "assignments": [{
                "name": "No Assignments",
                "category": "No Categories",
                "assignment_id": "GCD000000Fx62l",
                "special": "No Special",
                "score": 10,
                "max_score": 10,
                "percentage": 100,
                "color": "#6666FF"
            }],
            "edited": false,
            "categoryDisplay": [{
                "category": "No Categories",
                "weight": "100%",
                "score": 10,
                "maxScore": 10,
                "grade": "100%",
                "color": "#6666FF"
            }],
            "type": "categoryPercent",
            "calculated_grade": "100 A+",
            "color": "#1E8541"
        }];
    }

    if (typeof tableData[currentTableDataIndex] !== 'undefined') {
        currentTableData.recent = response.recent;
        currentTableData.overview = response.overview;
        currentTableData.username = response.username;
    } else {
        tableData[currentTableDataIndex] = {};
        currentTableData = tableData[currentTableDataIndex];
        currentTableData.recent = response.recent;
        currentTableData.overview = response.overview;
        currentTableData.username = response.username;
    }

    $("#loader").hide();

    //parsing the data extracted by the scrapers, and getting tableData ready for presentation
    if (typeof currentTableData.terms === 'undefined') {
        currentTableData.terms = {
            current: {},
            q1: {},
            q2: {},
            q3: {},
            q4: {},
        };
    }

    if (typeof currentTableData.currentTermData === 'undefined') {
        currentTableData.currentTermData = {};
    }
    currentTableData.currentTermData = parseTableData(response);
    currentTableData.terms[currentTerm] = parseTableData(response);

    //populates the event for each row in the recentAttendance table
    for (let i = 0; i < currentTableData.recent.recentAttendanceArray.length; i++) {
        currentTableData.recent.recentAttendanceArray[i].event = "";
        if (currentTableData.recent.recentAttendanceArray[i].dismissed === "true") {
            currentTableData.recent.recentAttendanceArray[i].event += "Dismissed ";
        }
        if (currentTableData.recent.recentAttendanceArray[i].excused === "true") {
            currentTableData.recent.recentAttendanceArray[i].event += "Excused ";
        }
        if (currentTableData.recent.recentAttendanceArray[i].absent === "true") {
            currentTableData.recent.recentAttendanceArray[i].event += "Absent ";
        }
        if (currentTableData.recent.recentAttendanceArray[i].tardy === "true") {
            currentTableData.recent.recentAttendanceArray[i].event += "Tardy ";
        }
        // addition for COVID
        if (currentTableData.recent.recentAttendanceArray[i].code === "VP") {
            currentTableData.recent.recentAttendanceArray[i].event += "VP ";
        }
    }

    let activityArray = currentTableData.recent.recentActivityArray.slice();
    for (let i = 0; i < activityArray.length; i++) {
        try {
            let assignmentName = activityArray[i].assignment;
            let className = activityArray[i].classname;
            let temp_classIndex = classIndex(className);

            let assignmentIndex = currentTableData.currentTermData
                .classes[temp_classIndex].assignments.map(x => x.name)
                .indexOf(assignmentName);
            console.log(assignmentIndex);

            currentTableData.recent.recentActivityArray[i].assignmentName = assignmentName;
            currentTableData.recent.recentActivityArray[i].className = className;
            currentTableData.recent.recentActivityArray[i].temp_classIndex = temp_classIndex;
            currentTableData.recent.recentActivityArray[i].assignmentIndex = assignmentIndex;

            currentTableData.recent.recentActivityArray[i].max_score = currentTableData.currentTermData.classes[temp_classIndex].assignments[assignmentIndex].max_score;
            currentTableData.recent.recentActivityArray[i].percentage = currentTableData.currentTermData.classes[temp_classIndex].assignments[assignmentIndex].percentage;
            currentTableData.recent.recentActivityArray[i].color = currentTableData.currentTermData.classes[temp_classIndex].assignments[assignmentIndex].color;
        } catch (err) {
            console.error("Please report this error on the Aspine github issue pages. ID Number 101. Error: " + err);
        }
    }

    // Calculate GPA for current term
    currentTableData.terms.current.GPA = response.GPA ||
        computeGPA(currentTableData.terms.current.classes);

    currentTableData.overview = response.overview;

    currentTableData.cumGPA = response.cumGPA || cumGPA(currentTableData.overview);

    if (currentTableData.cumGPA.percent == NaN) {
        currentTableData.cumGPA.percent = "";
    }
    document.getElementById("cum_gpa").innerHTML = "Cumulative GPA: " + currentTableData.cumGPA.percent.toFixed(2);

    // Calculate GPA for each quarter
    for (let i = 1; i <= 4; i++) {
        currentTableData.terms["q" + i].GPA = computeGPAQuarter(currentTableData.overview, i);
    }

    //Stuff to do now that tableData is initialized

    $("#mostRecentDiv").show();
    mostRecentTable.setData(currentTableData.recent.recentActivityArray.slice(0, 5));

    initialize_quarter_dropdown(includedTerms);
    setup_quarter_dropdown();

    termsReset[currentTerm] = JSON.parse(JSON.stringify(currentTableData.terms[currentTerm]));

    if (!$(".tableData_select-selected")[0]) {
        initialize_tableData_dropdown();
    }

    recentActivity.setData(currentTableData.recent.recentActivityArray);
    recentAttendance.setData(currentTableData.recent.recentAttendanceArray);

    classesTable.setData(response.classes); //set data of classes table to the tableData property of the response json object

    //initializes hamburger resize
    initialize_resize_hamburger()

    $.ajax({
        url: "/schedule",
        method: "POST",
        dataType: "json json",
        success: scheduleCallback
    });

    initialize_dayOfWeek_dropdown();
    setup_tooltips();
}

function responseCallbackPartial(response) {
    $("#loader").hide();

    currentTableData.currentTermData = currentTableData.terms[currentTerm];

    let temp_term_data = parseTableData(response);
    currentTableData.terms[currentTerm].classes = temp_term_data.classes;
    currentTableData.terms[currentTerm].GPA = temp_term_data.GPA;
    currentTableData.terms[currentTerm].calcGPA = temp_term_data.calcGPA;
    currentTableData.terms[currentTerm].quarter_oid = temp_term_data.quarter_oid;

    /*
    if (currentTerm === 'current') {
        $(".gpa_select-selected").html("Current Quarter GPA: " + tableData.currentTermData.GPA.percent);
        $("#current").html("Current Quarter GPA: " + tableData.currentTermData.GPA.percent);
        document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA: " + tableData.currentTermData.GPA.percent;
        document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA: " + tableData.currentTermData.GPA.percent;

    } else {
        $(".gpa_select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.currentTermData.GPA.percent);
        $("#q" + termConverter.indexOf(currentTerm)).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.currentTermData.GPA.percent);
        document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML ="Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.currentTermData.GPA.percent;
    }
    */

    // scheduleTable.setData(currentTableData.schedule.black);

    $("#classesTable").show();

    classesTable.setData(response.classes); //set data of classes table to the tableData property of the response json object
    classesTable.redraw();

    termsReset[currentTerm] = JSON.parse(JSON.stringify(currentTableData.terms[currentTerm]));

    term_dropdown_active = true;
}

// Callback for response from /schedule
function scheduleCallback(response) {
    if (!currentTableData.schedule) currentTableData.schedule = response;

    document.getElementById("scheduleTable").style.rowBackgroundColor = "black";
    //the following lines are used to set up the schedule table correctly

    // Get lists of properly formatted black/silver periods
    const [blackPeriods, silverPeriods] = ["black", "silver"].map(bs =>
        currentTableData.schedule[bs].slice().map(x =>
            x.aspenPeriod.substring(x.aspenPeriod.indexOf("-") + 1)
        ).filter(Boolean)
    );

    const colors = [1, 2, 3, 4, 5, 6, 7, 8].map(n => `var(--schedule${n})`);

    for (i in blackPeriods) {
        if (currentTableData.schedule.black[i]) {
            currentTableData.schedule.black[i].period = blackPeriods[i];
            currentTableData.schedule.black[i].class = currentTableData.schedule.black[i].name + "<br>" + currentTableData.schedule.black[i].teacher;
            currentTableData.schedule.black[i].color = colors[i] ? colors[i] : colors[colors.length - 1];
        }
    }
    for (i in silverPeriods) {
        if (currentTableData.schedule.silver[i]) {
            currentTableData.schedule.silver[i].period = silverPeriods[i];
            currentTableData.schedule.silver[i].class = currentTableData.schedule.silver[i].name + "<br>" + currentTableData.schedule.silver[i].teacher;
            currentTableData.schedule.silver[i].color = colors[colors.length - 1 - i] ? colors[colors.length - 1 - i] : colors[0];
        }
    }

    update_formattedSchedule(new Date().getDay());
    scheduleTable.setData(currentTableData.formattedSchedule);
    redraw_clock();
}

function pdfCallback(response) {
    $("#loader").hide();
    // console.log(response);
    currentTableData.pdf_files = response;

    initialize_pdf_dropdown();
    $("#pdf_loading_text").hide();

    if (typeof currentTableData.pdf_files !== 'undefined') {
        generate_pdf(pdf_index);
    }
}
// Currently no need for toggle; there are no recent assignments
/*
function recent_toggle() {
    if (!document.getElementById("recent_toggle").checked) {
        recentActivity.setData(tableData.recent.recentActivityArray);
        document.getElementById("recentActivity").style.display = "block";
        document.getElementById("recentAttendance").style.display = "none";
        document.getElementById("recent_title").innerHTML = "Assignments";
        recentActivity.redraw();
    }
    else {
        //recentActivity.setData(tableData.recent.recentAttendanceArray);
        document.getElementById("recentActivity").style.display = "none";
        document.getElementById("recentAttendance").style.display = "block";
        document.getElementById("recent_title").innerHTML = "Attendance";
        recentAttendance.redraw();
    }
}
*/

function schedule_toggle(day) {
    if (covid_schedule) {
        selected_day_of_week = parseInt(day);
    }
    else {
        if (document.getElementById("schedule_toggle").checked) {
            document.getElementById("schedule_title").innerHTML = "Silver";
        } else {
            document.getElementById("schedule_title").innerHTML = "Black";
        }
    }
    redraw_clock();
    update_formattedSchedule();
    scheduleTable.setData(currentTableData.formattedSchedule);
}

function openTab(evt, tab_name) {
    // Declare all variables
    let i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab contents, and add an "active" class to the button
    // corresponding to the tab
    document.getElementById(tab_name).style.display = "block";
    const tab_button = document.querySelector(
        `.tablinks[onclick*="openTab(event, '${tab_name}')"]`
    );
    if (tab_button) {
        tab_button.classList.add("active");
    }

    if (tab_name === "clock") {
        document.getElementById("small_clock").style.display = "none";
        document.getElementById("small_clock_period").style.display = "none";
    } else {
        document.getElementById("small_clock").style.display = "block";
        document.getElementById("small_clock_period").style.display = "block";
    }

    if (tab_name === "grades") {
        //$("#mostRecentDiv").show();
        mostRecentTable.redraw();
    }

    if (tab_name === "reports") {
        if (!currentTableData.pdf_files) {
            $("#loader").show();
            //sets the margins for the pdf viewer
            setup_tooltips();
            $.ajax({
                url: "/pdf",
                method: "POST",
                dataType: "json json",
                success: pdfCallback
            });
        } else if (typeof currentTableData.pdf_files !== 'undefined') {
            generate_pdf(pdf_index);
        }
        // Redraw PDF to fit new viewport dimensions when transitioning
        // in or out of fullscreen
        let elem = document.getElementById("reports");
        let handlefullscreenchange = function() {
            console.log("fullscreen change");
            window.setTimeout(generate_pdf(currentPdfIndex), 1000);
        };
        if (elem.onfullscreenchange !== undefined) {
            elem.onfullscreenchange = handlefullscreenchange;
        } else if (elem.mozonfullscreenchange !== undefined) { // Firefox
            elem.mozonfullscreenchange = handlefullscreenchange;
        } else if (elem.MSonfullscreenchange !== undefined) { // Internet Explorer
            elem.MSonfullscreenchange = handlefullscreenchange;
        }
    }

    if (tab_name === "schedule" && !currentTableData.schedule) {
        $.ajax({
            url: "/schedule",
            method: "POST",
            dataType: "json json",
            success: scheduleCallback
        });
    }

    classesTable.redraw();
    assignmentsTable.redraw();
    scheduleTable.redraw();
    categoriesTable.redraw();
    recentActivity.redraw();
    recentAttendance.redraw();
}

function openSideNav() {
    const sidenav = document.getElementById("sidenav");
    sidenav.style.width = sidenav.clientWidth === 270 ? "0px" : "270px";

    // makes sidenav overlay fade out
    const sidenavOverlay = document.getElementById("sidenav-overlay")
    if (sidenavOverlay.classList.contains("fade-out")) {
        sidenavOverlay.classList.remove("fade-out")
    }
    sidenavOverlay.classList.add("fade-in")
}

function closeSideNav() {
    const sidenav = document.getElementById("sidenav")
    sidenav.style.width = "0px";

    // makes sidenav overlay fade in
    const sidenavOverlay = document.getElementById("sidenav-overlay")
    if (sidenavOverlay.classList.contains("fade-in")) {
        sidenavOverlay.classList.remove("fade-in")
    }
    sidenavOverlay.classList.add("fade-out")

}

//  Allows exiting sidenav by clicking anywhere outside
document.getElementById("sidenav-overlay").addEventListener("click", closeSideNav);

$("#export_button").click(() => {
    prefs = {};

    [
        "recent", "schedule", "cumGPA"
    ].forEach(pref => {
        prefs[pref] = $(`#export_checkbox_${pref}`).prop("checked");
    });

    if ($("#export_checkbox_terms").prop("checked")) {
        prefs.terms = {};
        termConverter.forEach(term => {
            if (
                !$(`#export_checkbox_terms_${term}`).prop("disabled") &&
                $(`#export_checkbox_terms_${term}`).prop("checked")
            ) prefs.terms[term] = true;
            else prefs.terms[term] = false;
        });
    }

    exportTableData(prefs);
});

$("#import_button").click(async () => {
    const file = document.getElementById("import_filepicker").files[0];
    const reader = new FileReader();
    reader.readAsText(file);
    reader.addEventListener("load", async () => {
        let obj = JSON.parse(reader.result);
        obj.name = file.name;
        let response = await importTableData(obj) || "";
        $("#import_error").html(response);
        if (!response) {
            hideModal("import");
        }
    });
});

//#ifndef lite
$.ajax({
    url: "/data",
    method: "POST",
    data: { quarter: 0 },
    dataType: "json json",
}).then(responseCallback);
//#endif

//#ifdef lite
/*
responseCallback({ nologin: true });
*/
//#endif

document.getElementById("default_open").click();

// Populate the version number at the bottom of the page.
// Pointfree style does not work here because jQuery's .text behaves both as
// an attribute and as a function.

function updatesCallback(upt) {
    $("#updates").html(upt);
    document.getElementById("changelog").outerHTML = "<h2 class='info-header'>Version History/What's New:</h2>";

    // Hide all versions prior to the current minor version
    const items = document.querySelectorAll("#updates h2:nth-of-type(n+2)");
    const current_version = document.querySelector("#version").textContent;
    const [, curMajor, curMinor] = current_version.match(/^v?(\d+)\.(\d+)/);
    items.forEach(x => {
        const [, major, minor] = x.textContent.match(/^v?(\d+)\.(\d+)/);
        if (parseInt(minor) < parseInt(curMinor)
                || parseInt(major) < parseInt(curMajor)) {
            x.style.setProperty("display", "none");
            x.nextElementSibling.style.setProperty("display", "none");
        } else {
            x.classList.add("info-header")
        }
    });

    // Remove first two paragraphs with information about semver
    document.querySelectorAll("#updates p:nth-of-type(n-2)").forEach(x => {
        x.style.setProperty("display", "none");
    });
}

//#ifndef lite
$.ajax("/version").then(ver => $("#version").text(ver));
$.ajax("/updates").then(updatesCallback);
//#endif
//#ifdef lite
/*
$("#version").text(
//#include VERSION
);
updatesCallback(
//#include CHANGELOG
);
*/
//#endif
