let pages = null;
let currentPdfIndex = 0;

function pdfCallback(response) {
	pages = response;
	$("#loader").hide();
	if (typeof response !== 'undefined')
		generate_pdf();
	initialize_pdf_dropdown(response);
}

// Cannot be async
function main_pdf() {
	// Show progress spinner
	document.getElementById('loader').style.display = 'block';
	//sets the margins for the pdf viewer
	setup_tooltips();
	fetch(new Request('/pdf',{method: 'POST', headers: {'Content-Type': 'text/plain'}}))
		.then(data => data.json())
		.then(json => pdfCallback(json));
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
	let pdfURL = window.URL.createObjectURL(file);
	pdfEmbed.data = pdfURL;
	pdfEmbed.firstElementChild.href = pdfURL;
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
