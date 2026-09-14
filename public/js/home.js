/**
 * all data provided by aspine api
 * @typedef TableDataObject
 * @property {GPA} [cumGPA]
 * @property {Term} [currentTermData]
 * @property {string} [name]
 * @property {Overview[]} [overview]
 * @property {RecentActivity} [recent]
 * @property {Schedule} [schedule]
 * @property {Terms} [terms]
 * @property {?string} [username]
 * @property {"current" | "previous" | "imported"} [type]
 */

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
 * @typedef {object} noLogin
 * @param {boolean} noLogin.nologin
 */

// state variables
const termConverter = ['current', 'q1', 'q2', 'q3', 'q4'];
let pdf_index = 0;
let modals = {
	stats: document.getElementById('stats_modal'),
	corrections: document.getElementById('corrections_modal'),
	export: document.getElementById('export_modal'),
	import: document.getElementById('import_modal')
};
let statsModal = document.getElementById('stats_modal');
let correctionsModal = document.getElementById('corrections_modal');
let exportModal = document.getElementById('export_modal');
let importModal = document.getElementById('import_modal');
let term_dropdown_active = true;
let currentTerm = 'current';

/** @type {TableDataObject[]} */
let tableData = [
	{ name: 'Current Year', type: 'current' },
	{ name: 'Previous Year', type: 'previous' }
];
let currentTableDataIndex = 0;

/** @type {TableDataObject} */
let currentTableData = tableData[currentTableDataIndex];
let selected_class_i;
let termsReset = {};

// counter for creating new assignments
var newAssignmentIDCounter = 0;

// registry for undos containing assignment id and corresponding snackbar
const undoData = [];
let tempCell;

// index of row currently selected in categories table
let currentFilterRow = -1;

/**
 * Determines and applies the appropriate light or dark color scheme based on user preference or system settings.
 * @param {Event|object} e Optional event object from a media query listener.
 */
function loadMode(e = {}) {
	const slider = document.getElementById('dark-check');
	// get the stored mode if any
	const storedMode = localStorage.getItem('color-scheme');
	// check if operating system uses dark mode
	const osIsDark =
		'matches' in e
			? e.matches
			: window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (storedMode ? storedMode === 'dark' : osIsDark) {
		document.body.classList.add('dark');
		slider.checked = true;
	} else {
		document.body.classList.remove('dark');
		slider.checked = false;
	}
}

/**
 * Toggles the dark mode class on the document body and saves the user preference to local storage.
 */
function darkMode() {
	document.body.classList.toggle('dark');
	localStorage.setItem(
		'color-scheme',
		document.querySelector('body').classList.contains('dark')
			? 'dark'
			: 'light'
	);
}

/**
 * Hides or shows specific columns in a given table based on the current window width to ensure responsive design.
 * @param {object} table The Tabulator table instance to adjust.
 */
function adjustColumns(table) {
	switch (table.element.id) {
		case 'assignmentsTable':
			if (window.matchMedia('(max-width: 576px)').matches) {
				table.hideColumn('category');
				table.hideColumn('score');
				table.hideColumn('max_score');
			} else if (window.matchMedia('(max-width: 768px)').matches) {
				table.hideColumn('category');
				table.showColumn('score');
				table.showColumn('max_score');
			} else {
				table.showColumn('category');
				table.showColumn('score');
				table.showColumn('max_score');
			}
			break;
		case 'categoriesTable':
			if (window.matchMedia('(max-width: 576px)').matches) {
				table.hideColumn('score');
				table.hideColumn('maxScore');
			} else if (window.matchMedia('(max-width: 768px)').matches) {
				table.hideColumn('score');
				table.hideColumn('maxScore');
			} else {
				table.showColumn('score');
				table.showColumn('maxScore');
			}
            break;
		case 'mostRecentTable':
			if (window.matchMedia('(max-width: 576px)').matches) {
				table.hideColumn('score');
				table.hideColumn('max_score');
			} else if (window.matchMedia('(max-width: 768px)').matches) {
				table.hideColumn('score');
				table.hideColumn('max_score');
			} else {
				table.showColumn('score');
				table.showColumn('max_score');
			}
			break;
		default:
			console.error(`Unrecognized table with id ${table.element.id}`);
			return;
	}
	table.redraw();
}

/**
 * Updates the UI to indicate that there is no statistical data available for the selected assignment.
 */
let noStats = function () {
	$('#there_are_stats').hide();
	$('#there_are_no_stats').hide();
	$('#no_stats_caption').show();
	document.getElementById('no_stats_caption').innerHTML =
		'No Statistics Data for this assignment';
};

/**
 * Hides the specified modal window and performs any necessary cleanup operations for that specific modal.
 * @param {string} key Name of modal window.
 */
let hideModal = function (key) {
	modals[key].style.display = 'none';
	switch (key) {
		case 'stats':
			noStats();
			break;
		case 'corrections':
			document.getElementById('corrections_modal_input').value = '';
			break;
		default:
			console.error(`${key} is not a valid modal name`);
	}
};

/**
 * Displays the specified modal window.
 * @param {string} key Name of modal window.
 */
let showModal = function (key) {
	modals[key].style.display = 'inline-block';
};

/**
 * Applies a theoretical score correction to the selected assignment based on user input and updates the tables.
 */
function correct() {
	const per = parseInt($('#corrections_modal_input').prop('value'));
	if (per > 0 && per <= 100) {
		const row = tempCell.getRow();
		const { score, max_score } = row.getData();

		const diff = max_score - score;
		const pts_back = (diff * per) / 100;
		const newScore = score + pts_back;
		const rowPos = row.getPosition();
		currentTableData.currentTermData.classes[selected_class_i].assignments[
			rowPos
		].score = newScore;
		row.update({ score: newScore });
		assignmentsTable.setData(
			currentTableData.currentTermData.classes[selected_class_i]
				.assignments
		);

		editAssignment(
			currentTableData.currentTermData.classes[selected_class_i]
				.assignments
		);

		assignmentsTable.redraw();
		categoriesTable.redraw();
		classesTable.redraw();
	}
	hideModal('corrections');
}

/**
 * Toggles the recent activity view between attendance records and assignment grades.
 */
function recent_toggle() {
	if (!document.getElementById('recent_toggle').checked) {
		document.getElementById('recentActivity').style.display = 'none';
		document.getElementById('recentAttendance').style.display = 'block';
		document.getElementById('recent_title').innerHTML = 'Attendance';
		recentAttendance.redraw();
	} else {
		document.getElementById('recentActivity').style.display = 'block';
		document.getElementById('recentAttendance').style.display = 'none';
		document.getElementById('recent_title').innerHTML = 'Assignments';
		recentActivity.redraw();
	}
}

/**
 * Toggles the displayed schedule between different days or block types and updates the schedule table.
 * @param {string} day The selected day identifier.
 */
function schedule_toggle(day) {
	if (covid_schedule) {
		selected_day_of_week = parseInt(day);
	} else {
		if (document.getElementById('schedule_toggle').checked) {
			document.getElementById('schedule_title').innerHTML = 'Silver';
		} else {
			document.getElementById('schedule_title').innerHTML = 'Black';
		}
	}
	redraw_clock();
	update_formattedSchedule();
	scheduleTable.setData(currentTableData.formattedSchedule);
}

/**
 * Pushes a new state to the browser history and opens the specified tab.
 * @param {string} tab_name The identifier of the tab to open.
 */
function openTab(tab_name) {
	history.pushState(tab_name, '');
	openTabHelper(tab_name);
}

/**
 * Handles the DOM manipulation to hide inactive tabs and display the selected tab content.
 * @param {string} tab_name The identifier of the tab to open.
 */
function openTabHelper(tab_name) {
	// hide tabcontent elements and remove active class from tablinks
	for (const active of document.getElementsByClassName('active')) {
		active.classList.remove('active');
		document.getElementById(
			active.id.substring(0, active.id.length - 5)
		).style.display = 'none';
	}

	// show current tab contents and add active class to button
	document.getElementById(tab_name).style.display = 'block';
	document.getElementById(`${tab_name}_open`).classList.add('active');

	switch (tab_name) {
		case 'grades':
			document.getElementById('mostRecentDiv').style.display = 'block';
			if (mostRecentTable.initialized) mostRecentTable.redraw();
			if (classesTable.initialized) classesTable.redraw();
			if (assignmentsTable.initialized) assignmentsTable.redraw();
			break;
		case 'reports':
			if (!currentTableData.pdf_files) {
				$('#loader').show();
				setup_tooltips();
				fetch('/pdf', {
					method: 'POST'
				}).then(async (res) => pdfCallback(await res.json()));
			} else if (typeof currentTableData.pdf_files !== 'undefined') {
				generate_pdf(pdf_index);
			}
			// redraw pdf to fit new viewport dimensions on fullscreen change
			let elem = document.getElementById('reports');
			let handlefullscreenchange = function () {
				window.setTimeout(generate_pdf(currentPdfIndex), 1000);
			};
			if (elem.onfullscreenchange !== undefined) {
				elem.onfullscreenchange = handlefullscreenchange;
			} else if (elem.mozonfullscreenchange !== undefined) {
				elem.mozonfullscreenchange = handlefullscreenchange;
			} else if (elem.MSonfullscreenchange !== undefined) {
				elem.MSonfullscreenchange = handlefullscreenchange;
			}
			break;
		case 'schedule':
			fetch('/schedule', {
				method: 'POST'
			}).then(async (res) => scheduleCallback(await res.json()));
			scheduleTable.redraw();
			break;
	}

	if (tab_name === 'clock') {
		document.getElementById('small_clock').style.display = 'none';
		document.getElementById('small_clock_period').style.display = 'none';
	} else {
		document.getElementById('small_clock').style.display = 'block';
		document.getElementById('small_clock_period').style.display = 'block';
	}

	if (recentActivity.initialized) recentActivity.redraw();
	if (recentAttendance.initialized) recentAttendance.redraw();
	if (categoriesTable.initialized) categoriesTable.redraw();
}

/**
 * Expands the side navigation menu and applies a fade effect to the overlay.
 */
function openSideNav() {
	const sidenav = document.getElementById('sidenav');
	sidenav.style.width = sidenav.clientWidth === 270 ? '0px' : '270px';

	// makes sidenav overlay fade in
	const sidenavOverlay = document.getElementById('sidenav-overlay');
	if (sidenavOverlay.classList.contains('fade-out')) {
		sidenavOverlay.classList.remove('fade-out');
	}
	sidenavOverlay.classList.add('fade-in');
}

/**
 * Collapses the side navigation menu and removes the overlay fade effect.
 */
function closeSideNav() {
	const sidenav = document.getElementById('sidenav');
	sidenav.style.width = '0px';

	// makes sidenav overlay fade out
	const sidenavOverlay = document.getElementById('sidenav-overlay');
	if (sidenavOverlay.classList.contains('fade-in')) {
		sidenavOverlay.classList.remove('fade-in');
	}
	sidenavOverlay.classList.add('fade-out');
}

let recentAttendance = new Tabulator('#recentAttendance', {
	layout: 'fitColumns',
	columns: [
		{ title: 'Date', field: 'date', headerSort: false },
		{ title: 'Class', field: 'classname', headerSort: false },
		{ title: 'Period', field: 'period', headerSort: false },
		{ title: 'Event', field: 'event', headerSort: false }
	]
});

let recentActivity = new Tabulator('#recentActivity', {
	layout: 'fitColumns',
	columns: [
		{ title: 'Date', field: 'date', formatter: rowFormatter },
		{ title: 'Class', field: 'classname', formatter: rowFormatter },
		{
			title: 'Assignment',
			field: 'assignment',
			formatter: rowFormatter,
			headerSort: false
		},
		{
			title: 'Score',
			field: 'score',
			formatter: rowFormatter,
			headerSort: false
		}
	],
	rowClick: function (e, row) {
		document.getElementById('mostRecentDiv').style.display = 'none';
		classesTable.selectRow(1);

		let elem = document.getElementById('default_open');
		let evt = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window
		});
		let canceled = !elem.dispatchEvent(evt);

		assignmentsTable.clearFilter();
		document.getElementById('categoriesTable').style.display = 'block';
		document.getElementById('assignmentsTable').style.display = 'block';
		let selected_class = row.getData().classname;
		let tabledata = classesTable.getData();
		classesTable.deselectRow();
		classesTable.selectRow(selected_class);

		for (let i in tabledata) {
			if (tabledata[i].name === row.getData().classname) {
				assignmentsTable.setData(tabledata[i].assignments);
				categoriesTable.setData(tabledata[i].categoryDisplay);
				return;
			}
		}

		classesTable.selectRow(1);
	}
});

let categoriesTable = new Tabulator('#categoriesTable', {
	selectable: 1,
	layout: 'fitColumns',
	layoutColumnsOnNewData: true,
	tableBuilt: function () {
		window.addEventListener('resize', () => adjustColumns(this));
	},
	columns: [
		{
			title: 'Category',
			field: 'category',
			formatter: rowFormatter,
			headerSort: false
		},
		{
			title: 'Weight',
			field: 'weight',
			formatter: weightFormatter,
			headerSort: false
		},
		{
			title: 'Score',
			field: 'score',
			formatter: rowFormatter,
			headerSort: false
		},
		{
			title: 'Max Score',
			field: 'maxScore',
			formatter: rowFormatter,
			headerSort: false
		},
		{
			title: 'Percentage',
			field: 'grade',
			formatter: rowGradeFormatter,
			headerSort: false
		},
		{
			title: 'Hide',
			titleFormatter: () =>
				'<i class="fa fa-eye-slash header-icon tooltip" aria-hidden="true" tooltip="Hide"></i>',
			headerClick: hideCategoriesTable,
			width: 76,
			headerSort: false,
			cssClass: 'icon-col'
		}
	],
	rowClick: function (e, row) {
		assignmentsTable.clearFilter();

		if (currentFilterRow !== row.getPosition()) {
			currentFilterRow = row.getPosition();
			assignmentsTable.addFilter([
				{ field: 'category', type: '=', value: row.getData().category }
			]);
		} else {
			currentFilterRow = -1;
		}
	}
});

let mostRecentTable = new Tabulator('#mostRecentTable', {
	height: '35vh',
	layout: 'fitColumns',
	tableBuilt: function () {
		window.addEventListener('resize', () => adjustColumns(this));
	},
	columns: [
		{ title: 'Date', field: 'date', formatter: rowFormatter },
		{ title: 'Class', field: 'classname', formatter: rowFormatter },
		{
			title: 'Assignment',
			field: 'assignment',
			formatter: rowFormatter,
			headerSort: false
		},
		{
			title: 'Score',
			field: 'score',
			formatter: rowFormatter,
			headerSort: false
		}
	],
	rowClick: function (e, row) {
		classesTable.selectRow(1);

		let elem = document.getElementById('default_open');
		let evt = new MouseEvent('click', {
			bubbles: true,
			cancelable: true,
			view: window
		});
		let canceled = !elem.dispatchEvent(evt);

		assignmentsTable.clearFilter();
		document.getElementById('categoriesTable').style.display = 'block';
		document.getElementById('assignmentsTable').style.display = 'block';
		let selected_class = row.getData().classname;
		let tabledata = classesTable.getData();
		classesTable.deselectRow();
		classesTable.selectRow(selected_class);

		for (let i in tabledata) {
			if (tabledata[i].name === row.getData().classname) {
				assignmentsTable.setData(tabledata[i].assignments);
				categoriesTable.setData(tabledata[i].categoryDisplay);
				return;
			}
		}
		classesTable.selectRow(1);
	}
});

let assignmentsTable = new Tabulator('#assignmentsTable', {
	height: 600,
	layout: 'fitColumns',
	dataEdited: editAssignment,
	tableBuilt: function () {
		window.addEventListener('resize', () => adjustColumns(this));
	},
	columns: [
		{
			title: 'Assignment',
			field: 'name',
			editor: 'input',
			formatter: rowFormatter,
			headerSort: false
		},
		{
			title: 'Category',
			field: 'category',
			editor: 'select',
			editorParams: (cell) => ({
				values: Object.entries(
					currentTableData.currentTermData.classes[selected_class_i]
						.categories
				).map(
					([cat, weight]) => `${cat} (${parseFloat(weight) * 100}%)`
				)
			})
		},
		{
			title: 'Score',
			field: 'score',
			editor: 'number',
			editorParams: { min: 0, max: 100, step: 1 },
			formatter: rowFormatter,
			headerSort: false
		},
		{
			title: 'Max Score',
			field: 'max_score',
			editor: 'number',
			editorParams: { min: 0, max: 100, step: 1 },
			formatter: rowFormatter,
			headerSort: false
		},
		{
			title: 'Percentage',
			field: 'percentage',
			formatter: rowGradeFormatter,
			headerSort: false,
			width: window.matchMedia('(max-width: 576px)').matches ? 120 : ''
		},
		{
			title: 'Corrections',
			titleFormatter: () =>
				'<i class="fa fa-toolbox" aria-hidden="true"></i>',
			formatter: (cell) =>
				!isNaN(cell.getRow().getData().score)
					? '<i class="fa fa-hammer standard-icon tooltip" aria-hidden="true" tooltip="Revisions"></i>'
					: '',
			width: 40,
			hozAlign: 'center',
			cellClick: function (e, cell) {
				tempCell = cell;
				showModal('corrections');
				$('#corrections_modal_input').focus();
			},
			headerSort: false,
			cssClass: 'icon-col allow-overflow'
		},
		{
			title: 'Stats',
			titleFormatter: () =>
				'<i class="material-icons md-18" aria-hidden="true">leaderboard</i>',
			formatter: (cell) =>
				isNaN(cell.getRow().getData().score) ||
					currentTableData.currentTermData.classes[
						selected_class_i
					].assignments.filter((value) => !value['placeholder'])[
						cell.getRow().getPosition()
					].synthetic
					? ''
					: '<i class="fa fa-info standard-icon tooltip" aria-hidden="true" tooltip="Info"></i>',
			width: 40,
			hozAlign: 'center',
			cellClick: async function (e, cell) {
				if (
					isNaN(cell.getRow().getData().score) ||
					currentTableData.currentTermData.classes[selected_class_i]
						.assignments[cell.getRow().getPosition()].synthetic
				)
					return;
				noStats();
				document.getElementById('no_stats_caption').innerHTML =
					'Loading Assignment Info...';
				showModal('stats');

				const {
					assignment_id,
					name: assignment,
					score,
					max_score,
					date_assigned,
					date_due,
					feedback: assignment_feedback,
					category
				} = cell.getRow().getData();

				let { high, low, median, mean } = await (
					await fetch('/stats', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							assignment_id: assignment_id,
							class_id:
								currentTableData.currentTermData.classes[
									selected_class_i
								].oid,
							quarter_id:
								currentTableData.currentTermData.quarter_oid,
							year: currentTableData.type
						})
					})
				).json();
				if ([high, low, median, mean].some((x) => x === undefined)) {
					$('#no_stats_modal_title').text(
						`Assignment: ${assignment}`
					);
					$('#no_stats_modal_category').text(category);
					$('#no_stats_modal_score').text(`${score} / ${max_score}`);
					$('#no_stats_modal_date_assigned').text(date_assigned);
					$('#no_stats_modal_date_due').text(date_due);
					$('#no_stats_modal_feedback').text(
						assignment_feedback || 'None'
					);
					$('#there_are_no_stats').show();
					document.getElementById('no_stats_caption').innerHTML = '';
					return;
				}

				const q1 = (low + median) / 2;
				const q3 = (high + median) / 2;

				$('#stats_modal_title').text(`Assignment: ${assignment}`);
				$('#stats_modal_category').text(category);
				$('#stats_modal_score').text(`${score} / ${max_score}`);
				$('#stats_modal_lmh').text(`${low}, ${median}, ${high}`);
				$('#stats_modal_mean').text(mean);
				$('#stats_modal_date_assigned').text(date_assigned);
				$('#stats_modal_date_due').text(date_due);
				$('#stats_modal_feedback').text(assignment_feedback || 'None');

				$('#there_are_stats').show();
				$('#there_are_no_stats').hide();
				$('#no_stats_caption').hide();

				let plotStats = {};
				plotStats.fiveNums = [low, q1, median, q3, high];
				plotStats.iqr = q3 - q1;
				const step = (plotStats.step = plotStats.iqr * 1.5);
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
					}
				];
				plotStats.boxes = [
					{ start: q1, end: median },
					{ start: median, end: q3 }
				];
				plotStats.whiskers = [
					{ start: low, end: q1 },
					{ start: high, end: q3 }
				];
				plotStats.points = [];

				const plotElem = d3.select('#stats_plot');
				plotElem.style('display', 'inline');

				$('#stats_plot').css('width', '100%');

				// get base font size in pixels
				const baseFontSize = parseFloat(
					window.getComputedStyle(document.documentElement).fontSize
				);

				const plotWidth = $('#stats_plot').width() - baseFontSize;
				const plotHeight = 1.5 * baseFontSize;

				let x = d3
					.scaleLinear()
					.domain([low < 0 ? low : 0, high])
					.range([0, plotWidth]);

				const plot = d3
					.boxplot()
					.scale(x)
					.bandwidth(plotHeight)
					.boxwidth(plotHeight)
					.jitter(false)
					.opacity(1.0)
					.showInnerDots(false);

				plotElem.attr(
					'viewBox',
					`${-(0.75 * baseFontSize)} 0 ${plotWidth + 1.5 * baseFontSize
					} ${0.75 * baseFontSize +
					plotHeight +
					0.75 * baseFontSize +
					20 +
					baseFontSize
					}`
				);

				// remove anything lingering from other assignments
				plotElem.selectAll('*').remove();

				// box plot
				plotElem
					.append('g')
					.attr('class', 'plot')
					.attr('transform', `translate(0, ${0.75 * baseFontSize})`)
					.datum(plotStats)
					.attr('color', '#ff66ff')
					.attr('style', 'color: #ff66ff;')
					.call(plot);
                    
				// horizontal axis
				plotElem
					.append('g')
					.attr('class', 'axis')
					.attr(
						'transform',
						`translate(0, ${0.75 * baseFontSize +
						plotHeight +
						0.75 * baseFontSize
						})`
					)
					.call(d3.axisBottom().scale(x));

				plotElem
					.select('.axis')
					.selectAll('line, path')
					.attr('stroke', '#888');
				plotElem
					.select('.axis')
					.selectAll('text')
					.attr('fill', '#888')
					.attr('font-family', 'sans-serif')
					.attr('font-size', '0.75rem');

				for (let i = 60; i <= 100; i += 10) {
					const xcoord = x((i / 100) * max_score);
					plotElem
						.append('line')
						.attr('y1', plotHeight + 1.5 * baseFontSize + 20)
						.attr(
							'y2',
							plotHeight + 1.5 * baseFontSize + 20 + baseFontSize
						)
						.attr('x1', xcoord)
						.attr('x2', xcoord)
						.attr('stroke', '#888')
						.attr('stroke-width', '0.2rem');
				}
				for (let i = 65; i < 100; i += 10) {
					const xcoord = x((i / 100) * max_score);
					plotElem
						.append('text')
						.attr(
							'y',
							plotHeight +
							1.5 * baseFontSize +
							20 +
							0.75 * baseFontSize
						)
						.attr('x', xcoord)
						.attr('fill', getColor(i))
						.attr('font-size', '1rem')
						.attr('text-anchor', 'middle')
						.text(getLetterGrade(i));
				}

				// add line at mean
				plotElem
					.append('line')
					.attr('class', 'mean-line')
					.attr('y1', 0)
					.attr('y2', plotHeight + 1.5 * baseFontSize)
					.attr('x1', x(mean))
					.attr('x2', x(mean))
					.attr('stroke', '#888')
					.attr('stroke-width', '0.2rem');

				// add line at student score
				plotElem
					.append('line')
					.attr('class', 'score-line')
					.attr('y1', 0)
					.attr('y2', plotHeight + 1.5 * baseFontSize)
					.attr('x1', x(score))
					.attr('x2', x(score))
					.attr('stroke', '#b300ff')
					.attr('stroke-width', '0.2rem');
			},
			headerSort: false,
			cssClass: 'icon-col allow-overflow'
		},
		{
			title: 'Add',
			titleFormatter: () =>
				'<i class="fa fa-plus grades tooltip" aria-hidden="true" tooltip="New Assignment" tooltip-margin="-113px"></i>',
			headerClick: newAssignment,
			formatter: () =>
				'<i class="fa fa-times standard-icon tooltip" aria-hidden="true" style="color: #ce1515; font-size: 1.3em" tooltip="Delete Assignment" tooltip-margin="-127px"></i>',
			width: 40,
			hozAlign: 'center',
			cellClick: function (e, cell) {
				const data = cell.getRow().getData();
				replaceAssignmentFromID(
					data,
					{ assignment_id: data['assignment_id'], placeholder: true },
					selected_class_i
				);

				const undoSnackbar = new Snackbar(
					`You deleted "${data['name']}"`,
					{
						color: 'var(--red1)',
						textColor: 'var(--white)',
						buttonText: 'Undo',
						// replace assignment with placeholder containing assignment id
						buttonClick: () => {
							// get index for splicing and comparing
							index = undoData.findIndex(
								(a) => a.assignment_id === data.assignment_id
							);
							arrData = undoData[index];
							// remove snackbar before putting data back
							arrData.Snackbar = undefined;
							replaceAssignmentFromID(
								{
									assignment_id: arrData.assignment_id,
									placeholder: true
								},
								arrData,
								arrData.selected_class_i
							);
							undoData.splice(index, 1);
						},
						timeout: 7500,
						// removes snackbar link on timeout or body click
						timeoutFunction: () => {
							undoData[
								undoData
									.map((arrData) => arrData.assignment_id)
									.indexOf(data.assignment_id)
							].Snackbar = undefined;
						},
						bodyClick: () => {
							undoData[
								undoData
									.map((arrData) => arrData.assignment_id)
									.indexOf(data.assignment_id)
							].Snackbar = undefined;
						}
					}
				).show();

				data.Snackbar = undoSnackbar;
				data.selected_class_i = selected_class_i;
				undoData.unshift(data);
			},
			headerSort: false,
			cssClass: 'icon-col allow-overflow'
		}
	]
});

let scheduleTable = new Tabulator('#scheduleTable', {
	layout: 'fitDataFill',
	rowFormatter: function (row) {
		row.getElement().style.transition = 'all 1s ease';
		row.getElement().style.backgroundColor = row.getData().color;
	},
	columns: [
		{
			title: 'Period',
			field: 'period',
			width: 150,
			headerSort: false,
			formatter: 'html'
		},
		{
			title: 'Time',
			field: 'time',
			width: 150,
			headerSort: false
		},
		{
			title: 'Room',
			field: 'room',
			width: 150,
			headerSort: false
		},
		{
			title: 'Class',
			field: 'class',
			width: 400,
			headerSort: false,
			formatter: 'html'
		}
	]
});

let classesTable = new Tabulator('#classesTable', {
	index: 'name',
	selectable: 1,
	layout: 'fitColumns',
	columns: [
		{
			title: 'Class',
			field: 'name',
			formatter: (cell) => {
				let rowColor = cell.getRow().getData().color;
				let value = cell.getValue();

				if (vip_username_list.includes(currentTableData.username)) {
					return (
						"<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" +
						value +
						'</span>'
					);
				}
				if (rowColor === 'black') {
					return value;
				} else {
					return (
						"<span style='color:" +
						rowColor +
						"; font-weight:bold;'>" +
						value +
						'</span>'
					);
				}
			},
			headerSort: false
		},
		{
			title: 'Grade',
			field: 'grade',
			hozAlign: 'left',
			formatter: gradeFormatter,
			headerSort: false,
			width: window.matchMedia('(max-width: 576px)').matches ? 100 : ''
		}
	],
	rowClick: function (e, row) {
		document.getElementById('mostRecentDiv').style.display = 'none';
		hideModal('stats');

		assignmentsTable.clearFilter();
		currentFilterRow = -1;

		document.getElementById('categoriesTable').style.display = 'block';
		document.getElementById('assignmentsTable').style.display = 'block';

		const rowName = row.getData().name;
		const classesList = currentTableData.currentTermData.classes;

		const classIndex = classesList.findIndex((item) => item.name === rowName);

		if (classIndex !== -1) {
			selected_class_i = classIndex;
			const selectedClass = classesList[classIndex];

			// safely set table data with empty array fallbacks
			assignmentsTable.setData(selectedClass.assignments || []);
			categoriesTable.setData(selectedClass.categoryDisplay || []);

			// sets up tooltip margins for newly created tables
			setup_tooltips();

			adjustColumns(assignmentsTable);
			adjustColumns(categoriesTable);
			adjustColumns(mostRecentTable);
		}
	}
});

/**
 * Processes the main data payload from the server to populate the global state and initialize tables.
 * @param {noLogin|scrapedStudent} response The response object.
 * @param {scrapedStudent|string} includedTerms Optional parameter containing terms included in an import.
 */
function responseCallback(response, includedTerms) {
	if (response.nologin) {
		tableData = []; 
		currentTableData = undefined;
		currentTableDataIndex = -1;

		$('#reports_open').hide();
		$('#loader').hide();

		showModal('import');
		return;
	}
	if (response.error) {
		location.href = `/logout?error=${response.error}`;
		return;
	}

	if (response.classes.length === 0) {
		response.classes = [
			{
				name: 'No Classes',
				grade: 'No Grades',
				categories: {
					'No Categories': '1.0'
				},
				assignments: [
					{
						name: 'No Assignments',
						category: 'No Categories',
						assignment_id: 'GCD000000Fx62l',
						special: 'No Special',
						score: 10,
						max_score: 10,
						percentage: 100,
						color: '#6666FF'
					}
				],
				edited: false,
				categoryDisplay: [
					{
						category: 'No Categories',
						weight: '100%',
						score: 10,
						maxScore: 10,
						grade: '100%',
						color: '#6666FF'
					}
				],
				type: 'categoryPercent',
				calculated_grade: '100 A+',
				color: '#1E8541'
			}
		];
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

	$('#loader').hide();

	// parse data extracted by scrapers and get tabledata ready
	if (typeof currentTableData.terms === 'undefined') {
		currentTableData.terms = {
			current: {},
			q1: {},
			q2: {},
			q3: {},
			q4: {}
		};
	}

	if (typeof currentTableData.currentTermData === 'undefined') {
		currentTableData.currentTermData = {};
	}
	currentTableData.currentTermData = parseTableData(response);
	currentTableData.terms[currentTerm] = parseTableData(response);

	// populates event for each row in recentattendance table
	for (
		let i = 0;
		i < currentTableData.recent.recentAttendanceArray.length;
		i++
	) {
		currentTableData.recent.recentAttendanceArray[i].event = '';
		if (
			currentTableData.recent.recentAttendanceArray[i].dismissed ===
			'true'
		) {
			currentTableData.recent.recentAttendanceArray[i].event +=
				'Dismissed ';
		}
		if (
			currentTableData.recent.recentAttendanceArray[i].excused === 'true'
		) {
			currentTableData.recent.recentAttendanceArray[i].event +=
				'Excused ';
		}
		if (
			currentTableData.recent.recentAttendanceArray[i].absent === 'true'
		) {
			currentTableData.recent.recentAttendanceArray[i].event += 'Absent ';
		}
		if (currentTableData.recent.recentAttendanceArray[i].tardy === 'true') {
			currentTableData.recent.recentAttendanceArray[i].event += 'Tardy ';
		}
		// addition for covid
		if (currentTableData.recent.recentAttendanceArray[i].code === 'VP') {
			currentTableData.recent.recentAttendanceArray[i].event += 'VP ';
		}
	}

	// calculate gpa for current term
	currentTableData.terms.current.GPA =
		response.GPA || computeGPA(currentTableData.terms.current.classes);

	currentTableData.overview = response.overview;
	currentTableData.cumGPA =
		response.cumGPA || cumGPA(currentTableData.overview);
	if (currentTableData.cumGPA.percent == NaN) {
		currentTableData.cumGPA.percent = '';
	}
	document.getElementById('cum_gpa').innerHTML =
		'Yearly GPA: ' + currentTableData.cumGPA.percent.toFixed(2);

	// calculate gpa for each quarter
	for (let i = 1; i <= 4; i++) {
		currentTableData.terms['q' + i].GPA = computeGPAQuarter(
			currentTableData.overview,
			i
		);
	}

	document.getElementById('mostRecentDiv').style.display = 'block';
	mostRecentTable.setData(currentTableData.recent.recentActivityArray); 

	initialize_quarter_dropdown(includedTerms);
	setup_quarter_dropdown();

	termsReset[currentTerm] = JSON.parse(
		JSON.stringify(currentTableData.terms[currentTerm])
	);

	if (!$('.tableData_select-selected')[0]) {
		initialize_tableData_dropdown();
	}

	recentActivity.setData(currentTableData.recent.recentActivityArray);
	recentAttendance.setData(currentTableData.recent.recentAttendanceArray);
	classesTable.setData(response.classes); 

	fetch('/schedule', {
		method: 'POST'
	}).then(async (res) => scheduleCallback(await res.json()));

	initialize_dayOfWeek_dropdown();
	setup_tooltips();
}

/**
 * Updates the current term data with a partial response from the server and redraws the classes table.
 * @param {object} response The partial response containing class and overview data.
 */
function responseCallbackPartial(response) {
	$('#loader').hide();

	currentTableData.currentTermData = currentTableData.terms[currentTerm];

	let temp_term_data = parseTableData(response);
	currentTableData.terms[currentTerm].classes = temp_term_data.classes;
	currentTableData.terms[currentTerm].GPA = temp_term_data.GPA;
	currentTableData.terms[currentTerm].calcGPA = temp_term_data.calcGPA;
	currentTableData.terms[currentTerm].quarter_oid =
		temp_term_data.quarter_oid;

	if (!currentTableData.overview)
		currentTableData.overview = response.overview;
	currentTableData.cumGPA =
		response.cumGPA || cumGPA(currentTableData.overview);
	if (currentTableData.cumGPA.percent == NaN) {
		currentTableData.cumGPA.percent = '';
	}
	document.getElementById('cum_gpa').innerHTML =
		'Yearly GPA: ' + currentTableData.cumGPA.percent.toFixed(2);

	for (let i = 1; i <= 4; i++) {
		currentTableData.terms['q' + i].GPA = computeGPAQuarter(
			currentTableData.overview,
			i
		);
	}

	$('#classesTable').show();

	classesTable.setData(response.classes); 
	classesTable.redraw();

	termsReset[currentTerm] = JSON.parse(
		JSON.stringify(currentTableData.terms[currentTerm])
	);

	term_dropdown_active = true;
}

/**
 * Formats and applies the schedule data from the server to the schedule table.
 * @param {object} response The response containing student schedule information.
 */
function scheduleCallback(response) {
	if (!currentTableData.schedule) currentTableData.schedule = response;

	document.getElementById('scheduleTable').style.rowBackgroundColor = 'black';

	// get lists of properly formatted black and silver periods
	const [blackPeriods, silverPeriods] = ['black', 'silver'].map((bs) =>
		currentTableData.schedule[bs]
			.slice()
			.map((x) => x.aspenPeriod.substring(x.aspenPeriod.indexOf('-') + 1))
			.filter(Boolean)
	);

	const colors = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `var(--schedule${n})`);

	for (i in blackPeriods) {
		if (currentTableData.schedule.black[i]) {
			currentTableData.schedule.black[i].period = blackPeriods[i];
			currentTableData.schedule.black[i].class =
				currentTableData.schedule.black[i].name +
				'<br>' +
				currentTableData.schedule.black[i].teacher;
			currentTableData.schedule.black[i].color = colors[i]
				? colors[i]
				: colors[colors.length - 1];
		}
	}
	for (i in silverPeriods) {
		if (currentTableData.schedule.silver[i]) {
			currentTableData.schedule.silver[i].period = silverPeriods[i];
			currentTableData.schedule.silver[i].class =
				currentTableData.schedule.silver[i].name +
				'<br>' +
				currentTableData.schedule.silver[i].teacher;
			currentTableData.schedule.silver[i].color = colors[
				colors.length - 1 - i
			]
				? colors[colors.length - 1 - i]
				: colors[0];
		}
	}

	redraw_clock();
}

/**
 * Handles the response for PDF generation and triggers the rendering of the document.
 * @param {object} response The response containing the PDF file information.
 */
function pdfCallback(response) {
	$('#loader').hide();
	currentTableData.pdf_files = response;

	initialize_pdf_dropdown();
	$('#pdf_loading_text').hide();

	if (typeof currentTableData.pdf_files !== 'undefined') {
		generate_pdf(pdf_index);
	}
}

/**
 * Renders the changelog and release notes while filtering out older versions based on the current version.
 * @param {string} updates The HTML string containing the application updates and changelog.
 * @param {string} current_version The semver string representing the currently active version.
 */
function updatesCallback(updates, current_version) {
	document.querySelector('#updates').innerHTML = updates;

	// check if element exists before modifying outerhtml
	const changelogHeader = document.querySelector('#changelog');
	if (changelogHeader) {
		changelogHeader.outerHTML = "<h2 class='info-header'>Version History/What's New:</h2>";
	}

	// hide all versions prior to current minor version
	const items = document.querySelectorAll('#updates h2:nth-of-type(n+2)');
	const [, curMajor, curMinor] = current_version.match(/^v?(\d+)\.(\d+)/);
	items.forEach((x) => {
		const [, major, minor] = x.textContent.match(/^v?(\d+)\.(\d+)/);
		if (
			parseInt(minor) < parseInt(curMinor) ||
			parseInt(major) < parseInt(curMajor)
		) {
			x.style.setProperty('display', 'none');
			x.nextElementSibling.style.setProperty('display', 'none');
		} else {
			x.classList.add('info-header');
		}
	});

	// remove first two paragraphs containing semver information
	document.querySelectorAll('#updates p:nth-of-type(n-2)').forEach((x) => {
		x.style.setProperty('display', 'none');
	});
}

// event listeners and initialization
window.addEventListener('keydown', (e) => {
	var evtobj = window.event || e;
	if (evtobj.keyCode == 90 && evtobj.ctrlKey && undoData.length !== 0) {
		if (undoData[0].Snackbar !== undefined) {
			undoData[0].Snackbar.destroy();
			undoData[0].Snackbar = undefined;
		}
		replaceAssignmentFromID(
			{ assignment_id: undoData[0].assignment_id, placeholder: true },
			undoData[0],
			undoData[0].selected_class_i
		);
		undoData.shift();
	}
});

// close modal or dropdown when user clicks outside
window.addEventListener('click', function (event) {
	Object.keys(modals).forEach((key) => {
		if (event.target === modals[key]) {
			hideModal(key);
		}
	});
	// do not close a dropdown if user clicked to view a tooltip
	if (!event.target.classList.contains('hastooltip')) {
		closeAllSelect();
		pdf_closeAllSelect();
		tableData_closeAllSelect();
	}
});

// update color scheme on page load and system color scheme changes
window.addEventListener('load', loadMode);
window
	.matchMedia('(prefers-color-scheme: dark)')
	.addEventListener('change', loadMode);

window.onpopstate = (event) => {
	openTabHelper(event.state);
};

// allows exiting sidenav by clicking anywhere outside
document
	.getElementById('sidenav-overlay')
	.addEventListener('click', closeSideNav);

$('#export_button').click(() => {
	prefs = {};

	['recent', 'schedule', 'cumGPA'].forEach((pref) => {
		prefs[pref] = $(`#export_checkbox_${pref}`).prop('checked');
	});

	if ($('#export_checkbox_terms').prop('checked')) {
		prefs.terms = {};
		termConverter.forEach((term) => {
			if (
				!$(`#export_checkbox_terms_${term}`).prop('disabled') &&
				$(`#export_checkbox_terms_${term}`).prop('checked')
			)
				prefs.terms[term] = true;
			else prefs.terms[term] = false;
		});
	}

	exportTableData(prefs);
});

$('#import_button').click(async () => {
	const file = document.getElementById('import_filepicker').files[0];
	const reader = new FileReader();
	reader.readAsText(file);
	reader.addEventListener('load', async () => {
		let obj = JSON.parse(reader.result);
		obj.name = file.name;
		let response = (await importTableData(obj)) || '';
		$('#import_error').html(response);
		if (!response) {
			hideModal('import');
		}
	});
});

// bind enter key to apply corrections button
$('#corrections_modal_input').keypress(({ which }) => {
	if (which === 13) {
		correct();
	}
});

initialize_jquery_prototype();
initialize_resize_hamburger();
$('#stats_plot').width(($(window).width() * 7) / 11);
setup_tooltips();

//#ifndef lite
fetch('/data', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify({ quarter: 0, year: 'current' })
}).then(async (res) => responseCallback(await res.json()));

fetch('/version').then(async (res) => {
	const version = await res.text();
	document.querySelector('#version').textContent = version;
	updatesCallback(await (await fetch('/updates')).text(), version);
});
//#endif

//#ifdef lite
//#endif

openTab('grades');