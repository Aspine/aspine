const fs = require('fs');
const fsp = fs.promises;
const fse = require('fs-extra');
const pathLib = require('path');
const readline = require('readline');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const marked = require('marked');
const TOML = require('@iarna/toml');

const dep_mappings = require('./frontend-dependencies');

const INPUT = pathLib.join(__dirname, 'public');
const OUTPUT = pathLib.join(__dirname, 'dist-lite');

async function main() {
	// Create the output directory and copy all files from public
	await fsp.mkdir(OUTPUT, { recursive: true });
	await fse.copy(INPUT, OUTPUT, { overwrite: true });

	// Copy frontend dependencies
	await Promise.all(
		[...dep_mappings.files, ...dep_mappings.directories].map(
			([endpoint, path]) =>
				fse.copy(
					pathLib.join(__dirname, pathLib.normalize(path)),
					pathLib.join(OUTPUT, pathLib.normalize(endpoint))
				)
		)
	);

	// Remove login page
	await fsp.rm(pathLib.join(OUTPUT, 'login.html'));

	// Preprocess HTML and JS files
	await processHTML('home.html');
	await Promise.all(
		(await fsp.readdir(pathLib.join(OUTPUT, 'js'))).map((file) =>
			processJS(pathLib.join('js', file))
		)
	);
}

// Preprocess a HTML file, respecting #ifdef and #ifndef
async function processHTML(file) {
	let out;
	try {
		out = await fsp.open(pathLib.join(OUTPUT, file), 'w');
		const input_stream = fs.createReadStream(pathLib.join(INPUT, file));
		const rl = readline.createInterface({
			input: input_stream,
			crlfDelay: Infinity
		});

		// Keep track of whether we are inside an ifndef, in which case lines should
		// not be copied
		let ifndef = false;

		for await (const line of rl) {
			// Beginning or end of ifdef
			if (line === '<!--#ifdef lite>' || line === '<!#endif-->') {
				continue;
			}
			// Beginning of ifndef
			if (line === '<!--#ifndef lite-->') {
				ifndef = true;
				continue;
			}
			// End of ifndef
			if (line === '<!--#endif-->') {
				ifndef = false;
				continue;
			}
			if (!ifndef) {
				await out.write(line + '\n');
			}
		}
	} finally {
		out.close();
	}
}

// Preprocess a JS file, respecting #ifdef, #ifndef, and #include
async function processJS(file) {
	let out;
	try {
		out = await fsp.open(pathLib.join(OUTPUT, file), 'w');
		const input_stream = fs.createReadStream(pathLib.join(INPUT, file));
		const rl = readline.createInterface({
			input: input_stream,
			crlfDelay: Infinity
		});

		// Keep track of whether we are inside an ifndef, in which case lines should
		// not be copied
		let ifndef = false;

		// Keep track of if we are in an ifdef (to recognize the comment indicators)
		let ifdef = false;

		for await (const line of rl) {
			// Beginning of ifdef
			if (line === '//#ifdef lite') {
				ifdef = true;
				continue;
			}
			// Comment indicator for ifdef
			if (ifdef && (line === '/*' || line === '*/')) {
				continue;
			}
			// Beginning of ifndef
			if (line === '//#ifndef lite') {
				ifndef = true;
				continue;
			}
			// End of ifdef or ifndef
			if (line === '//#endif') {
				ifdef = false;
				ifndef = false;
				continue;
			}

			if (line === '//#include VERSION') {
				const version = (await exec('git describe')).stdout
					.toString()
					.trim()
					.match(/^v?(.*)/)[1];
				await out.write(JSON.stringify(version) + '\n');
				continue;
			}
			if (line === '//#include CHANGELOG') {
				const changelog = marked(
					(await fsp.readFile(__dirname + '/CHANGELOG.md')).toString()
				);
				await out.write(JSON.stringify(changelog) + '\n');
				continue;
			}
			if (line === '//#include SCHEDULE') {
				const schedule = TOML.parse(
					await fsp.readFile(__dirname + '/public/schedule.toml')
				);
				await out.write(JSON.stringify(schedule) + '\n');
				continue;
			}
			// All other include directives
			let match;
			if ((match = line.match(/^\/\/#include (.*)/))) {
				const path = pathLib.join(
					__dirname,
					pathLib.normalize(match[1])
				);
				await out.write((await fsp.readFile(path)) + '\n');
				continue;
			}

			if (!ifndef) {
				await out.write(line + '\n');
			}
		}
	} finally {
		if (out !== undefined) out.close();
	}
}

main().catch(console.error);
