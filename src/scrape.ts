/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { URLSearchParams } from 'url';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer-extra';
import { Buffer } from 'buffer';
import randomUseragent from 'random-useragent';
import puppeteerStealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(puppeteerStealthPlugin());
import type {
	Session,
	PDFFileInfo,
	ClassInfo,
	ClassDetails,
	Category
} from './types';

import type {
	PDFFile,
	OverviewItem,
	Schedule,
	ScheduleItem,
	Assignment,
	StudentData,
	Class,
	Recent,
	AttendanceEvent,
	ActivityEvent,
	Stats,
	TermSpec
} from './types-shared';

// using import type with an enum disallows accessing the enum variants
import { AspineErrorCode } from './types';
import { Quarter, Year } from './types-shared';
import { createValidAbsoluteUrl } from 'pdfjs-dist';

const encode = (str: string): string =>
	Buffer.from(str, 'binary').toString('base64');

export async function get_student(
	username: string,
	password: string,
	quarter: Quarter = Quarter.Current,
	year: Year = Year.Current
): Promise<StudentData> {
	console.log('fetching student data for user:', username);
	return await get_session(username, password, async (session) => {
		const { student_name, student_oid } = await get_student_info(session);
		const quarter_oids = await get_quarter_oids(session, year);

		const academics = await get_academics(
			session,
			student_oid,
			quarter_oids,
			year
		);
		const class_details = await Promise.all(
			academics.map(async (class_info) =>
				get_class_details(session, class_info)
			)
		);
		
		console.log('assembling overview and fetching assignments');
		const overview = assemble_overview(class_details);
		const assignments = await Promise.all(
			class_details.map(async (details) =>
				get_assignments(session, quarter, quarter_oids, details)
			)
		);
		const recent = await get_recent(session);

		const isClass = function (x: Class | undefined): x is Class {
			return x !== undefined;
		};
		const classes = (
			await Promise.all(
				class_details.map(async (details, i) => {
					// do not include a class if it does not exist in this quarter
					if (!details.grades.has(quarter)) {
						return undefined;
					}

					// for previous year data every class is listed under every quarter so we need to do an additional check using the term attribute
					if (
						year !== Year.Current &&
						!(await match_termspec(
							session,
							details.term,
							quarter,
							year
						))
					) {
						return undefined;
					}

					// exclude classes that do not receive grades in aspen
					if (
						[
							'Study Support',
							'Advisory',
							'Community Meeting',
							'PE Athletics',
							'PE 10-12 Wellness Elective',
							'PE RSTA',
							'Falcon Block Balance',
							'Falcon Pathway'
						].includes(details.name)
					) {
						return undefined;
					}

					let categories: { [key: string]: string } = {};
					for (const [cat, { weight }] of details.categories) {
						categories[cat] = weight.toString();
					}
					return {
						name: details.name,
						grade: details.grades.get(quarter) || '',
						categories: categories,
						assignments: assignments[i],
						oid: details.oid
					};
				})
			)
		).filter(isClass);
		const quarter_oid = quarter_oids.get(quarter) || 'current';

		console.log('student data successfully retrieved');
		return { classes, recent, overview, username, quarter, quarter_oid };
	});
}

// return an array containing all pdf files
export async function get_pdf_files(
	username: string,
	password: string
): Promise<PDFFile[]> {
	console.log('fetching pdf files');
	return await get_session(username, password, async (session) => {
		const pdf_files = [];
		// get pdf files sequentially to avoid rejection of requests
		for (const { id, filename } of await list_pdf_files(session)) {
			console.log('downloading pdf:', filename);
			pdf_files.push({
				title: filename,
				content: await download_pdf(session, id)
			});
		}
		return pdf_files;
	});
}

export async function get_schedule(
	username: string,
	password: string
): Promise<Schedule> {
	console.log('fetching schedule');
	return await get_session(username, password, async (session) => {
		const current_quarter = await get_current_quarter(
			session,
			Year.Current
		);
		let current_semester;
		if (current_quarter <= 2) {
			current_semester = 1;
		} else {
			current_semester = 2;
		}
		const initial_page = await (
			await fetch(
				'https://aspen.cpsd.us/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list',
				{
					headers: {
						Cookie: `JSESSIONID=${session.session_id};`
					}
				}
			)
		).text();
		
		// this is a term oid that is specific to the schedule view not the same as the oids in the output of get_quarter_oids
		// currently uses semester view to scrape since quarter view behaved weirdly but can switch back easily
		const [, term_oid] = new RegExp(
			String.raw`<option value="(.+)">S${current_semester}</option>`
		).exec(initial_page) as RegExpExecArray;

		const schedule_page = await (
			await fetch(
				'https://aspen.cpsd.us/aspen/studentScheduleMatrix.do?' +
					new URLSearchParams({
						navkey: 'myInfo.sch.matrix',
						termOid: term_oid
					}),
				{
					headers: {
						Cookie: `JSESSIONID=${session.session_id}; deploymentId=ma-camrbidge; showNavbar=true`
					}
				}
			)
		).text();

		const {
			window: { document }
		} = new JSDOM(schedule_page);

		const rows = document.querySelectorAll(
			"table[cellspacing='1'] > tbody > tr:not([class])"
		);

		// get a matrix of the cells in the first three columns of the table then transpose it to get a list of periods a list of silver day classes and a list of black day classes
		const transpose = <T>(matrix: T[][]): T[][] =>
			matrix[0].map((col, i) => matrix.map((row) => row[i]));
		
		// transpose algorithm from stack overflow

		// row to 1 5 6 will get the periods from column 1 and all the class names from thursday and friday
		const [periods, silver_html, black_html] = transpose(
			[...rows].map((row) =>
				[1, 5, 6].map(
					(n) =>
						row
							.querySelector(`td:nth-child(${n})`)
							?.querySelector('td, th')
							?.innerHTML.trim() ?? ''
				)
			)
		);
		const isScheduleItem = function (
			x: ScheduleItem | undefined
		): x is ScheduleItem {
			return x !== undefined;
		};
		const [black, silver] = [black_html, silver_html].map((arr) =>
			arr
				.map((x, i) => {
					if (x) {
						const lines = x.split('<br>');

						// decode html entities
						const textarea = document.createElement('textarea');
						const [id, name, teacher, room] = lines.map((line) => {
							textarea.innerHTML = line;
							return textarea.value.trim();
						});

						let aspenPeriod = periods[i];

						// convert aspenperiod from incorrect to correct period
						// remove this once aspen reports periods correctly
						let [num, per] = aspenPeriod.split('-');
						let match;
						if (per === 'CM') {
							per = '02B';
						} else if ((match = per.match(/0\d/))) {
							let perNum = parseInt(match[0].slice(-1));
							if (perNum == 2 || perNum == 3) {
								per = `0${perNum + 1}B`;
							} else if (perNum >= 4) {
								per = 'PM';
							}
						}
						aspenPeriod = `${num}-${per}`;

						if (name === 'Study Support') {
							return undefined;
						}

						return { id, name, teacher, room, aspenPeriod };
					}
				})
				.filter(isScheduleItem)
		);
		console.log('schedule successfully retrieved');
		return { black, silver };
	});
}

export async function get_stats(
	username: string,
	password: string,
	assignment_id: string,
	class_id: string,
	quarter_id: string,
	year: Year,
	student_oid: String
): Promise<Stats | {}> {
	console.log('fetching stats for assignment:', assignment_id);
	return await get_session(username, password, async ({ session_id }) => {
		// the rest api does not expose assignment statistics so we need to use the regular aspen desktop site which is picky about the order of requests

		// get list of classes
		const class_list_page = await (
			await fetch(
				`https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?count=25&customParams=selectedYear%7Ccurrent;selectedTerm%7Ccurrent&fieldSetOid=fsnX2ClsMbl+++&filter=%23%23%23all&offset=1&selectedStudent=${student_oid}&sort=default&unique=true`,
				{
					headers: {
						Cookie: `JSESSIONID=${session_id};`
					}
				}
			)
		).text();

		// get updated apache token
		const [, apache_token] =
			/name="org.apache.struts.taglib.html.TOKEN" value="(.+)"/.exec(
				class_list_page
			) as RegExpExecArray;

		// change term in classes list
		await fetch('https://aspen.cpsd.us/aspen/portalClassList.do', {
			headers: {
				Cookie: `JSESSIONID=${session_id}; deploymentId=ma-cambridge`
			},
			method: 'POST',
			body: new URLSearchParams({
				'org.apache.struts.taglib.html.TOKEN': apache_token,
				userEvent: '950',
				termFilter: quarter_id,
				yearFilter: year
			})
		});

		// get class details
		await fetch('https://aspen.cpsd.us/aspen/portalClassList.do', {
			headers: {
				Cookie: `JSESSIONID=${session_id};`
			},
			method: 'POST',
			body: new URLSearchParams({
				'org.apache.struts.taglib.html.TOKEN': apache_token,
				userEvent: '2100',
				userParam: class_id
			})
		});

		// get list of assignments
		await fetch(
			'https://aspen.cpsd.us/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd',
			{
				headers: {
					Cookie: `deploymentId=ma-cambridge; JSESSIONID=${session_id};`
				}
			}
		);

		// change term in assignments list
		await fetch('https://aspen.cpsd.us/aspen/portalAssignmentList.do', {
			headers: {
				Cookie: `JSESSIONID=${session_id};`
			},
			method: 'POST',
			body: new URLSearchParams({
				'org.apache.struts.taglib.html.TOKEN': apache_token,
				userEvent: '2210',
				gradeTermOid: quarter_id
			})
		});

		// get assignment statistics
		const stats_page = await (
			await fetch('https://aspen.cpsd.us/aspen/portalAssignmentList.do', {
				headers: {
					Cookie: `JSESSIONID=${session_id};`
				},
				method: 'POST',
				body: new URLSearchParams({
					'org.apache.struts.taglib.html.TOKEN': apache_token,
					userEvent: '2100',
					userParam: assignment_id
				})
			})
		).text();

		const {
			window: { document }
		} = new JSDOM(stats_page);

		const rows = document.querySelectorAll(
			'#mainTable td[width="50%"]:nth-of-type(2) tr:nth-child(n+3):nth-child(-n+6)'
		);

		if (rows.length < 4) {
			console.log('insufficient data to compile stats');
			return {};
		}

		const statistics: Partial<Stats> = {};

		for (const row of rows) {
			const stat_type_raw =
				row.querySelector('td:first-child')?.textContent?.trim() ?? '';
			const stat_value =
				row.querySelector('td:last-child')?.textContent?.trim() ?? '';

			let stat_type: keyof Stats;
			switch (stat_type_raw) {
				case 'High':
					stat_type = 'high';
					break;
				case 'Low':
					stat_type = 'low';
					break;
				case 'Median':
					stat_type = 'median';
					break;
				case 'Average':
					stat_type = 'mean';
					break;
				default:
					continue;
			}
			statistics[stat_type] = parseFloat(stat_value);
		}

		console.log('stats successfully retrieved');
		return statistics;
	});
}

async function get_recent(session: Session): Promise<Recent> {
	console.log('fetching recent activity');
	const page = await (
		await fetch(
			'https://aspen.cpsd.us/aspen/studentRecentActivityWidget.do?' +
				new URLSearchParams({
					preferences: `<?xml version="1.0" encoding="UTF-8"?><preference-set>
        <pref id="dateRange" type="int">4</pref>
      </preference-set>`
				}),
			{
				headers: {
					Cookie: `JSESSIONID=${session.session_id}; deploymentId=ma-cambridge; showNavbar=true`
				}
			}
		)
	).text();

	const {
		window: { document }
	} = new JSDOM(page, { contentType: 'text/xml' });
	const recentAttendanceArray = [
		...document.querySelectorAll('periodAttendance')
	].map(
		(x) =>
			Object.fromEntries(
				[
					'date',
					'period',
					'code',
					'classname',
					'dismissed',
					'absent',
					'excused',
					'tardy'
				].map((att) => [att, x.getAttribute(att)])
			) as unknown as AttendanceEvent
	);
	const recentActivityArray = [
		...document.querySelectorAll('gradebookScore')
	].map((x) => {
		let item = Object.fromEntries(
			['date', 'classname', 'grade', 'assignmentname'].map((att) => [
				att,
				x.getAttribute(att)
			])
		) as any;

		item.score = item.grade;
		item.assignment = item.assignmentname;
		delete item.grade;
		delete item.assignmentname;
		return item as ActivityEvent;
	});
	return { recentAttendanceArray, recentActivityArray };
}

// get the current quarter in the absence of the oid of a class this function makes a request to get the oid of one class
async function get_current_quarter(
	session: Session,
	year: Year,
	class_info?: ClassInfo
): Promise<Quarter> {
	console.log('determining current quarter');
	// complete this logic
	// if not current year the current quarter is undefined and we can let it be q1
	if (year != Year.Current) {
		return Quarter.Q1;
	}

	let oid: string;
	if (class_info) {
		({ oid } = class_info);
	} else {
		const { student_oid } = await get_student_info(session);
		var param = new URLSearchParams({
			selectedStudent: student_oid,
			customParams: `selectedYear|${year};selectedTerm|all`
		});
		var url =
			'https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?count=25&' +
			param +
			'&fieldSetOid=fsnX2Cls++++++';
		[{ oid }] = await (
			await fetch(url, {
				headers: {
					Cookie: `JSESSIONID=${session.session_id}; deploymentId=ma-cambridge; showNavbar=true`
				}
			})
		).json();
	}

	const { currentTermIndex } = await (
		await fetch(
			`https://aspen.cpsd.us/aspen/rest/studentSchedule/${oid}/gradeTerms`,
			{
				headers: {
					Cookie: `JSESSIONID=${session.session_id}; deploymentId=ma-cambridge; showNavbar=true`
				}
			}
		)
	).json();

	if (currentTermIndex + 1 in Quarter) {
		return currentTermIndex + 1;
	} else {
		return Quarter.Q2;
	}
}

// get a list of published reports
async function list_pdf_files({ session_id }: Session): Promise<PDFFileInfo[]> {
	console.log('listing published pdf files');
	const pdf_files: any[] = await (
		await fetch('https://aspen.cpsd.us/aspen/rest/reports', {
			headers: {
				Cookie: `JSESSIONID=${session_id};`
			}
		})
	).json();
	try {
		return pdf_files.filter(
			({ contentTypeId }) => contentTypeId == 'cttPdf'
		);
	} catch (e) {
		console.error('error filtering pdf files:', e);
		return [];
	}
}

// get name and oid of student
async function get_student_info({ session_id }: Session): Promise<{
	student_name: string;
	student_oid: string;
}> {
	console.log('fetching student name and oid');
	const a = await fetch('https://aspen.cpsd.us/aspen/rest/users/students', {
		headers: {
			Cookie: `JSESSIONID=${session_id}; deploymentId=ma-cambridge; showNavbar=true`
		}
	});

	const data = await a.json();

	// Guard against non-array error responses from Aspen
	if (!Array.isArray(data) || data.length === 0) {
		console.error('Unexpected response from get_student_info:', data);
		throw new Error(AspineErrorCode.LOGINFAIL);
	}

	const [{ name: student_name, studentOid: student_oid }] = data;
	return { student_name, student_oid };
}

async function get_quarter_oids(
	session: Session,
	year: Year
): Promise<Map<Quarter, string>> {
	console.log('fetching quarter oids');
	const mapping = new Map<Quarter, string>();
	const terms: { gradeTermId: string; oid: string }[] = await (
		await fetch(
			'https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list/studentGradeTerms?count=25&customParams=selectedYear%7Ccurrent;selectedTerm%7Ccurrent&fieldSetOid=fsnX2ClsMbl+++&filter=%23%23%23all&offset=1&selectedStudent=stdX2002104931&sort=default&unique=true',
			{
				headers: {
					Cookie: `JSESSIONID=${session.session_id}; deploymentId=ma-cambridge; showNavbar=true`
				}
			}
		)
	).json();
	for (const { gradeTermId, oid } of terms) {
		const [, quarter] = /^Q(\d)$/.exec(gradeTermId) as RegExpExecArray;
		const quarter_num = parseInt(quarter) ?? -1;
		if (quarter_num in Quarter) {
			mapping.set(quarter_num, oid);
		}
	}
	mapping.set(
		Quarter.Current,
		mapping.get(await get_current_quarter(session, year)) || 'current'
	);
	return mapping;
}

// get basic information about classes
async function get_academics(
	{ session_id }: Session,
	student_oid: string,
	quarter_oids: Map<Quarter, string>,
	year: Year
): Promise<ClassInfo[]> {
	console.log('fetching basic academic information');
	const get_classes = async (quarter_oid: string) =>
		(await (
			await fetch(
				'https://aspen.cpsd.us/aspen/rest/lists/academics.classes.list?' +
					new URLSearchParams({
						count: '25',
						customParams: `selectedYear|${year};selectedTerm|${quarter_oid}`,
						selectedStudent: student_oid
					}) +
					'&fieldSetOid=fsnX2ClsMbl++++++&filter=%23%23%23all&offset=1&sort=default&unique=true',
				{
					headers: {
						Cookie: `JSESSIONID=${session_id}; deploymentId=ma-cambridge; showNavbar=true`
					}
				}
			)
		).json()) as any[];

	// get classes from all terms in an array
	const all_classes = await get_classes('all');
	
	// set up a mapping from quarters to mappings from oids to class info
	const term_classes_mapping = new Map<Quarter, Map<string, any>>();

	// populate term classes mapping with data from each term
	await Promise.all(
		[...quarter_oids.entries()].map(async ([quarter, quarter_oid]) =>
			term_classes_mapping.set(
				quarter,
				// construct a 2d array with elements oid and rest where rest is the object containing class info then convert that to a map
				new Map<string, any>(
					(await get_classes(quarter_oid)).map(({ oid, ...rest }) => [
						oid,
						rest
					])
				)
			)
		)
	);
	
	// for each class assemble a classinfo object
	return all_classes.map(
		({
			oid,
			relSscMstOid_mstDescription: name,
			relSscMstOid_mstStaffView: teachers,
			sscTermView: term
		}) => {
			// mapping the terms in which this class meets to the corresponding term averages
			const grades = new Map<Quarter, string>();

			for (const quarter of Object.values(Quarter)) {
				// exclude enum variant names as we iterate over current q1 q2 etc
				if (typeof quarter !== 'number') continue;

				const term_data = term_classes_mapping.get(quarter)?.get(oid);
				
				// do not count this term if the class does not have any data for this term
				if (!term_data) continue;

				// enter the grade for this term into the grades mapping
				grades.set(quarter, (term_data.cfTermAverage ?? '') as string);
			}

			let teacher = '';
			try {
				[{ name: teacher }] = teachers;
			} catch (e) {
				// in the case of a typeerror let teacher be an empty string
				if (!(e instanceof TypeError)) {
					throw e;
				}
			}

			return { name, grades, teacher, term, oid };
		}
	);
}

// get extended information about a class including attendance and categories
async function get_class_details(
	{ session_id }: Session,
	class_info: ClassInfo
): Promise<ClassDetails> {
	console.log('fetching details for class:', class_info.name);
	const { averageSummary, attendanceSummary } = await (
		await fetch(
			`https://aspen.cpsd.us/aspen/rest/studentSchedule/${class_info.oid}/academics`,
			{
				headers: {
					Cookie: `JSESSIONID=${session_id}; deploymentId=ma-cambridge; showNavbar=true`
				}
			}
		)
	).json();

	const attendance = { absent: 0, tardy: 0, dismissed: 0 };
	for (const { total, type } of attendanceSummary) {
		switch (type) {
			case 'Absent':
				attendance.absent = total;
				break;
			case 'Tardy':
				attendance.tardy = total;
				break;
			case 'Dismissed':
				attendance.dismissed = total;
				break;
		}
	}
	const categories = new Map<string, Category>();
	for (const {
		category,
		categoryOid,
		percentageQ1,
		percentageQ2,
		percentageQ3,
		percentageQ4
	} of averageSummary) {
		if (category !== 'Gradebook average') {
			categories.set(category, {
				weight:
					parseFloat(
						percentageQ1 ||
							percentageQ2 ||
							percentageQ3 ||
							percentageQ4
					) / 100.0,
				oid: categoryOid
			});
		}
	}

	return { attendance, categories, ...class_info };
}

async function get_assignments(
	{ session_id }: Session,
	quarter: Quarter,
	quarter_oids: Map<Quarter, string>,
	class_details: ClassDetails
): Promise<Assignment[]> {
	console.log('fetching assignments for class:', class_details.name);
	// if this class does not exist in the given quarter then there are no assignments
	if (!class_details.grades.has(quarter)) {
		return [];
	}

	const quarter_oid = quarter_oids.get(quarter);
	const [past_due, upcoming] = await Promise.all(
		['pastDue', 'upcoming'].map(
			async (x) =>
				await (
					await fetch(
						`https://aspen.cpsd.us/aspen/rest/studentSchedule/${class_details.oid}/categoryDetails/${x}?gradeTermOid=${quarter_oid}`,
						{
							headers: {
								Cookie: `JSESSIONID=${session_id}; deploymentId=ma-cambridge; showNavbar=true`
							}
						}
					)
				).json()
		)
	);
	return (
		[...past_due, ...upcoming]
			.map(
				({
					name,
					categoryOid,
					assignedDate,
					dueDate,
					remark,
					oid,
					scoreElements: [{ score, pointMax }]
				}) => {
					// get category name
					let category = '';
					for (const [cat, { oid }] of class_details.categories) {
						if (categoryOid === oid) {
							category = cat;
						}
					}

					return {
						name: name,
						category: category,
						date_assigned: new Date(assignedDate),
						date_due: new Date(dueDate),
						feedback: remark || '',
						assignment_id: oid,
						special: '',
						score: score,
						max_score: pointMax
					};
				}
			)
			.sort(({ date_due: d1, name: n1 }, { date_due: d2, name: n2 }) => {
				// sort assignments in reverse chronological order by due date
				if (d1 > d2) return -1;
				if (d1 < d2) return 1;
				// if same due date sort by name case insensitive
				const n1u = n1.toUpperCase();
				const n2u = n2.toUpperCase();
				if (n1u < n2u) return -1;
				if (n1u > n2u) return 1;

				// same due date and same name
				return 0;
			})
			// convert date objects to strings
			.map(({ date_assigned: da, date_due: dd, ...rest }) => ({
				date_assigned: da.toLocaleDateString('en-US'),
				date_due: dd.toLocaleDateString('en-US'),
				...rest
			}))
	);
}

function assemble_overview(class_details: ClassDetails[]): OverviewItem[] {
	return class_details.map(
		({
			name,
			grades,
			teacher,
			term,
			oid,
			attendance: { absent, tardy, dismissed }
		}) => {
			const [q1, q2, q3, q4] = [
				Quarter.Q1,
				Quarter.Q2,
				Quarter.Q3,
				Quarter.Q4
			].map((q) => parseFloat(grades.get(q) ?? ''));
			// get all quarter grades that are not nan and average them to get the year to date grade
			const quarter_grades = [q1, q2, q3, q4].filter((x) => !isNaN(x));
			const ytd = quarter_grades.length
				? quarter_grades.reduce((a, b) => a + b) / quarter_grades.length
				: NaN;
			// custom function for formatting numbers so that nan is mapped to the empty string
			const format = (x: number) => (isNaN(x) ? '' : x.toString());
			return {
				class: name,
				teacher: teacher,
				term: term,
				q1: format(q1),
				q2: format(q2),
				q3: format(q3),
				q4: format(q4),
				ytd: format(ytd),
				absent: format(absent),
				tardy: format(tardy),
				dismissed: format(dismissed)
			};
		}
	);
}

// download a pdf file by id
async function download_pdf(
    { session_id }: Session,
    id: string
): Promise<string> {
    console.log('downloading pdf with id:', id);
    const response = await fetch(`https://aspen.cpsd.us/aspen/rest/reports/${id}/file`, {
        headers: {
            Cookie: `JSESSIONID=${session_id}; deploymentId=ma-cambridge; showNavbar=true`
        }
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
}

// check if a quarter matches a term specification
async function match_termspec(
	session: Session,
	termspec: TermSpec,
	quarter: Quarter,
	year: Year
): Promise<boolean> {
	// make sure that quarter is q1 q2 q3 or q4 and not current
	if (quarter === Quarter.Current) {
		quarter = await get_current_quarter(session, year);
	}
	switch (termspec) {
		case 'FY':
			return true;
		case 'S1':
			return [Quarter.Q1, Quarter.Q2].includes(quarter);
		case 'S2':
			return [Quarter.Q3, Quarter.Q4].includes(quarter);
		case 'Q1':
			return quarter === Quarter.Q1;
		case 'Q2':
			return quarter === Quarter.Q2;
		case 'Q3':
			return quarter === Quarter.Q3;
		case 'Q4':
			return quarter === Quarter.Q4;
		default: 
			// fallback in case aspen gives some other termspec
			return true;
	}
}

// Store active sessions and pending session creation promises in memory
interface ActiveSession {
	session_id: string;
	apache_token: string;
	timestamp: number;
}

const sessionCache = new Map<string, ActiveSession>();
const pendingSessions = new Map<string, Promise<ActiveSession>>();

async function create_session(username: string, password: string): Promise<ActiveSession> {
	console.log('initiating session generation for user:', username);
	const headless = false;
	const browser = await puppeteer.launch({
		headless,
		args: ['--no-sandbox', '--disable-setuid-sandbox']
	});
	const page = await browser.newPage();
	await page.setViewport({
		width: 1280,
		height: 800,
		deviceScaleFactor: 1,
		hasTouch: false,
		isLandscape: true,
		isMobile: false
	});
	await page.setJavaScriptEnabled(true);

	try {
		await page.goto(
			'https://aspen.cpsd.us/aspen/logonSSO.do?deploymentId=ma-cambridge&districtId=*dst&idpName=Cambridge%20Google%20SAML'
		);
		page.setDefaultNavigationTimeout(60000);

		const emailSelector = '#identifierId';
		await page.waitForSelector(emailSelector, { visible: true, timeout: 15000 });
		await new Promise((r) => setTimeout(r, 754));
		await page.click(emailSelector);
		await new Promise((r) => setTimeout(r, 500));
		await page.type(emailSelector, username);

		await Promise.all([
			page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }),
			page.keyboard.press('Enter')
		]);

		const passwordSelector = 'input[type="password"]';
		try {
			await page.waitForSelector(passwordSelector, { visible: true, timeout: 15000 });
		} catch (e) {
			console.log('failed to find password input:', e);
			throw new Error(AspineErrorCode.LOGINFAIL);
		}

		await page.click(passwordSelector);
		await new Promise((r) => setTimeout(r, 500));
		await page.type(passwordSelector, password);

		await Promise.all([
			page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
			page.keyboard.press('Enter')
		]);

		const currentUrl = page.url();
		if (currentUrl.includes('.cpsd.us')) {
			const jsessionid = currentUrl.match(/jsessionid=([^&]*)/)![1];
			await page.setCookie({
				name: 'JSESSIONID',
				value: jsessionid,
				domain: '.cpsd.us',
				path: '/'
			});
			const page_content = await page.content();
			const [, apache_token] =
				(/name="org.apache.struts.taglib.html.TOKEN" value="(.+)"/.exec(
					page_content
				) as RegExpExecArray);
			await browser.close();

			console.log('session successfully retrieved');
			return { session_id: jsessionid, apache_token, timestamp: Date.now() };
		} else {
			console.error('not a district domain:', currentUrl);
			await browser.close();
			throw new Error('not a district domain');
		}
	} catch (error) {
		console.error('puppet execution failed with error:', error);
		await browser.close();
		throw error;
	}
}

async function obtain_session(username: string, password: string): Promise<ActiveSession> {
	if (pendingSessions.has(username)) {
		return await pendingSessions.get(username)!;
	}

	const cached = sessionCache.get(username);
	if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
		return cached;
	}

	const sessionPromise = create_session(username, password);
	pendingSessions.set(username, sessionPromise);

	try {
		const session = await sessionPromise;
		sessionCache.set(username, session);
		return session;
	} catch (e) {
		sessionCache.delete(username);
		throw e;
	} finally {
		pendingSessions.delete(username);
	}
}

export async function get_session<T>(
	username: string,
	password: string,
	callback: (session: Session) => Promise<T>
): Promise<T> {
	let activeSession = await obtain_session(username, password);

	try {
		return await callback({
			session_id: activeSession.session_id,
			apache_token: activeSession.apache_token
		});
	} catch (error: any) {
		if (
			error?.message === AspineErrorCode.LOGINFAIL ||
			error?.message?.includes('loginfail')
		) {
			console.log('Session invalidated by Aspen server. Clearing cache and retrying...');
			sessionCache.delete(username);
			activeSession = await obtain_session(username, password);
			return await callback({
				session_id: activeSession.session_id,
				apache_token: activeSession.apache_token
			});
		}
		throw error;
	}
}