let pages = null;
let currentPdfIndex = 0;

let pdfrendering = false;
let scale = 1;
let adjustedScale = 1;
let currentPageNum = null;
let pendingPageNum = null;

function pdfCallback(response) {
	pages = response;
	$("#loader").hide();
	if (typeof response !== 'undefined')
		generate_pdf();
	initialize_pdf_dropdown(response);
}

// Cannot be async
function main_pdf()
{
	// Show progress spinner
	document.getElementById('loader').style.display = 'block';
	//sets the margins for the pdf viewer
	setup_tooltips();
	fetch(new Request('/pdf',{method: 'POST', headers: {'Content-Type': 'text/plain'}}))
		.then(data => data.json())
		.then(json => pdfCallback(json));
	// Redraw PDF to fit new viewport dimensions when transitioning
	// in or out of fullscreen
	let elem = document.getElementById("reports");
	elem.onfullscreenchange = () =>	window.setTimeout(generate_pdf, 1000);
	// Safari still has not implemented fullscreen standards
}

/**
 * @param {number} index
 */
async function generate_pdf() {
	let pdfEmbed = document.getElementById('pdf-embed');
	pdfEmbed.width = pdfEmbed.parentElement.offsetWidth;

	// This is a weird hack to make loading multiple binary files possible
	// TODO is there a better way to create Blobs from Buffer?
	let base64 = btoa(String.fromCharCode(...pages[currentPdfIndex].content.data));
	let file = await (await fetch(`data:application/pdf;base64, ${base64}`)).blob();
	
	pdfEmbed.data = window.URL.createObjectURL(file);
}

// function zoom_in_pdf() {
// 	if (!pdfrendering) {
// 		pdfrendering = true;
// 		let pdfInitParams = {
// 			"data": (currentTableData.pdf_files)[currentPdfIndex].content
// 		};
// 		let loadingTask = pdfjsLib.getDocument(pdfInitParams);
// 		loadingTask.promise.then( async pdf =>
// 		{
// 			let page = pdf.getPage(currentPageNum);


// 				adjustedScale += 0.1;

// 				let viewport = page.getViewport(
// 				{
// 					"scale": adjustedScale
// 				});

// 				let canvas = document.getElementById('pdf-canvas');
// 				let context = canvas.getContext('2d');

// 				canvas.width = viewport.width;
// 				canvas.height = viewport.height;

// 				let renderContext = {
// 					canvasContext: context,
// 					viewport: viewport
// 				};

// 				let renderTask = page.render(renderContext);
// 				renderTask.promise.then(function ()
// 				{
// 					pdfrendering = false;
// 				});

// 		}), reason => console.error(reason)
// 	}
// }

// let zoom_out_pdf = function ()
// {
// 	if (!pdfrendering)
// 	{
// 		pdfrendering = true;
// 		let pdfInitParams = {
// 			"data": (currentTableData.pdf_files)[currentPdfIndex].content
// 		};
// 		let loadingTask = pdfjsLib.getDocument(pdfInitParams);
// 		loadingTask.promise.then(function (pdf)
// 		{

// 			pdf.getPage(currentPageNum).then(function (page)
// 			{

// 				adjustedScale -= 0.1;

// 				let viewport = page.getViewport(
// 				{
// 					"scale": adjustedScale
// 				});


// 				let canvas = document.getElementById('pdf-canvas');
// 				let context = canvas.getContext('2d');

// 				canvas.width = viewport.width;
// 				canvas.height = viewport.height;

// 				let renderContext = {
// 					canvasContext: context,
// 					viewport: viewport
// 				};

// 				let renderTask = page.render(renderContext);
// 				renderTask.promise.then(function ()
// 				{
// 					pdfrendering = false;
// 				});

// 			});

// 		}, function (reason)
// 		{
// 			console.error(reason);
// 		});
// 	}
// }

// Render a certain page of the PDF or queue it to be rendered
function queue_render_page_pdf(pageNumber)
{
	if (pdfrendering) {
		pendingPageNum = pageNumber;
	} else {
		render_page_pdf(pageNumber);
	}
}

// Go one page back in the PDF
function prev_page_pdf() {
	if (currentPageNum > 1) {
		currentPageNum--;
		render_page_pdf(currentPageNum);
	}
}

// Go one page forward in the PDF
function next_page_pdf() {
	if (currentPageNum < pdf.numPages) {
		currentPageNum++;
		render_page_pdf(currentPageNum);
	}
}

async function render_page_pdf(pdf, pageNumber) {
	let page = pdf.getPage(pageNumber);

	// Update page indicator text
	document.getElementById('page-indicator').innerText =
		`PAGE ${pageNumber} OF ${pdf.numPages}`;
	let modifier = window.innerWidth >= 900 ? 900 :
		document.getElementById('reports').offsetWidth;

	let canvas = document.getElementById('pdf-canvas');

	// Get default width of page then scale and make viewport
	page = await page;
	let viewport = page.getViewport({scale: 1});
	adjustedScale = (modifier / viewport.width) * 0.97;
	viewport = page.getViewport({ scale: adjustedScale });

	canvas.width = viewport.width;
	canvas.height = viewport.height;

	let renderContext = {
		canvasContext: canvas.getContext('2d'),
		viewport
	};

	let renderTask = page.render(renderContext);
	await renderTask.promise;
	pdfrendering = false;
	// Another page rendering is pending
	// if (pendingPageNum !== null) {
	// 	render_page_pdf(pendingPageNum);
	// 	pendingPageNum = null;
	// }
}

async function download_pdf()
{
	// Get current PDF file's raw data
	const data = await pages[currentPdfIndex].content;
	// Use application/octet-stream MIME type to force a download (instead of
	// having it open in a browser PDF viewer)
	saveAs(new Blob([data],
	{
		type: "application/octet-stream"
	}), pages[currentPdfIndex].title);
}

//pdf dropdown stuff
function initialize_pdf_dropdown(pdfFiles) {
	// console.log(pdfFiles);
	const pdfSelector = document.getElementById('pdf_select');
	for (let i = 0; i < pdfFiles.length; i++) {
	  pdfSelector.append(new Option(pdfFiles[i].title, i));
	}

	pdfSelector.addEventListener('click', evt => {
		currentPdfIndex = evt.target.value;
		generate_pdf();
	})
}
