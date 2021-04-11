let pdf_index = 0;
let pdfrendering = false;

function pdfCallback(response)
{
	$("#loader").hide();
	// console.log(response);
	// currentTableData.pdf_files = response;

	// initialize_pdf_dropdown();
	$("#pdf_loading_text").hide();

	console.log(response);

	if (typeof response !== 'undefined')
	{
		generate_pdf(pdf_index, response);
	}
}

// Cannot be async
function main_pdf(currentTableData)
{
	// if (typeof currentTableData.pdf_files === 'undefined')
	// {
		// Show progress spinner
		document.getElementById('loader').style.display = 'block';
		//sets the margins for the pdf viewer
		setup_tooltips();
		fetch(new Request('/pdf',{method: 'POST'}))
			.then(data => data.json())
			.then(json => pdfCallback(json));
		// $.ajax({
		//     url: "/pdf",
		//     method: "POST",
		//     dataType: "json json",
		//     success: pdfCallback
		// });
	// }
	// else
	// {
	// 	generate_pdf(pdf_index, currentTableData.pdf_files);
	// }
	// Redraw PDF to fit new viewport dimensions when transitioning
	// in or out of fullscreen
	let elem = document.getElementById("reports");
	elem.onfullscreenchange = () =>
	{
		console.log("fullscreen change");
		window.setTimeout(generate_pdf(currentPdfIndex), 1000);
	};
	// Safari still has not implemented fullscreen standards
}

/**
 * @param {number} index
 */
function generate_pdf(index, pdfFiles)
{
	if (!pdfrendering)
	{
		pdfrendering = true;
		let adjustedHeight = $(window).height() - 280;
		if (!document.isFullScreen && !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement)
		{
			$('#pdf-container').css('height', adjustedHeight + 'px');
		}
		else
		{
			$('#pdf-container').css('height', $(window).height() + 'px');
		}

		let pdfInitParams = {
			"data": pdfFiles[index].content
		};
		// Store the index of the current PDF in `currentPdfIndex`
		currentPdfIndex = index;
		let loadingTask = pdfjsLib.getDocument(pdfInitParams);
		loadingTask.promise.then(function (pdf_)
		{
			pdf = pdf_;
			currentPageNum = 1;
			render_page_pdf(1);
		}, function (reason)
		{
			console.error(reason);
		});
	}
}

let zoom_in_pdf = function ()
{
	if (!pdfrendering)
	{
		pdfrendering = true;
		let pdfInitParams = {
			"data": (currentTableData.pdf_files)[currentPdfIndex].content
		};
		let loadingTask = pdfjsLib.getDocument(pdfInitParams);
		loadingTask.promise.then(function (pdf)
		{

			pdf.getPage(currentPageNum).then(function (page)
			{

				adjustedScale += 0.1;

				let viewport = page.getViewport(
				{
					"scale": adjustedScale
				});

				let canvas = document.getElementById('pdf-canvas');
				let context = canvas.getContext('2d');

				canvas.width = viewport.width;
				canvas.height = viewport.height;

				let renderContext = {
					canvasContext: context,
					viewport: viewport
				};

				let renderTask = page.render(renderContext);
				renderTask.promise.then(function ()
				{
					pdfrendering = false;
				});

			});


		}, function (reason)
		{
			console.error(reason);
		});
	}
}

let zoom_out_pdf = function ()
{
	if (!pdfrendering)
	{
		pdfrendering = true;
		let pdfInitParams = {
			"data": (currentTableData.pdf_files)[currentPdfIndex].content
		};
		let loadingTask = pdfjsLib.getDocument(pdfInitParams);
		loadingTask.promise.then(function (pdf)
		{

			pdf.getPage(currentPageNum).then(function (page)
			{

				adjustedScale -= 0.1;

				let viewport = page.getViewport(
				{
					"scale": adjustedScale
				});


				let canvas = document.getElementById('pdf-canvas');
				let context = canvas.getContext('2d');

				canvas.width = viewport.width;
				canvas.height = viewport.height;

				let renderContext = {
					canvasContext: context,
					viewport: viewport
				};

				let renderTask = page.render(renderContext);
				renderTask.promise.then(function ()
				{
					pdfrendering = false;
				});

			});

		}, function (reason)
		{
			console.error(reason);
		});
	}
}

// Render a certain page of the PDF or queue it to be rendered
let queue_render_page_pdf = function (pageNumber)
{
	if (pdf)
	{
		if (pdfrendering)
		{
			pendingPageNum = pageNumber;
		}
		else
		{
			render_page_pdf(pageNumber);
		}
	}
}

// Go one page back in the PDF
let prev_page_pdf = function ()
{
	if (!currentPageNum || currentPageNum <= 1) return;
	else
	{
		currentPageNum--;
		queue_render_page_pdf(currentPageNum);
	}
}

// Go one page forward in the PDF
let next_page_pdf = function ()
{
	if (!currentPageNum || currentPageNum >= pdf.numPages) return;
	else
	{
		currentPageNum++;
		queue_render_page_pdf(currentPageNum);
	}
}

let scale = 1;
let adjustedScale = 1;
let controlAdjustedScale = adjustedScale;
let pdf = null;
let currentPageNum = null;
let pendingPageNum = null;
let currentPdfIndex = null;

async function render_page_pdf(pageNumber)
{
	let page = await pdf.getPage(pageNumber);

	// Update page indicator text
	$("#page-indicator").text(`PAGE ${pageNumber} OF ${pdf.numPages}`);

	scale = 1;

	let viewport = page.getViewport(
	{
		scale
	});


	let modifier = $('#pdf-container').width();

	if ($(window).width() >= 900)
	{
		modifier = 900;
	}

	adjustedScale = (modifier / viewport.width) * 0.97;
	controlAdjustedScale = (modifier / viewport.width) * 0.97;


	viewport = page.getViewport(
	{
		"scale": adjustedScale
	});


	let canvas = document.getElementById('pdf-canvas');
	let context = canvas.getContext('2d');
	canvas.width = viewport.width;
	canvas.height = viewport.height;

	let renderContext = {
		canvasContext: context,
		viewport: viewport
	};

	let renderTask = page.render(renderContext);
	renderTask.promise.then(function ()
	{
		pdfrendering = false;
		// Another page rendering is pending
		if (pendingPageNum !== null)
		{
			render_page_pdf(pendingPageNum);
			pendingPageNum = null;
		}
	});
}




async function download_pdf()
{
	// Get current PDF file's raw data
	const data = await pdf.getData();
	// Use application/octet-stream MIME type to force a download (instead of
	// having it open in a browser PDF viewer)
	saveAs(new Blob([data],
	{
		type: "application/octet-stream"
	}), `${currentTableData.pdf_files[currentPdfIndex].title}.pdf`);
}

function pdf_closeAllSelect(elmnt)
{
	/* A function that will close all select boxes in the document,
	except the current select box: */
	let x, y, i, arrNo = [];
	x = document.getElementsByClassName("pdf_select-items");
	y = document.getElementsByClassName("pdf_select-selected");
	for (i = 0; i < y.length; i++)
	{
		if (elmnt === y[i])
		{
			arrNo.push(i)
		}
		else
		{
			y[i].classList.remove("pdf_select-arrow-active");
		}
	}
	for (i = 0; i < x.length; i++)
	{
		if (arrNo.indexOf(i))
		{
			x[i].classList.add("pdf_select-hide");
		}
	}
}

//pdf dropdown stuff
function initialize_pdf_dropdown()
{

	//let o = new Option(tableData.pdf_files[i].title, i);
	///// jquerify the DOM object 'o' so we can use the html method
	//$(o).html(tableData.pdf_files[i].title);
	//$("#pdf-select").append(o);

	for (let i = 1; i < currentTableData.pdf_files.length + 1; i++)
	{
		if (i === 1)
		{
			let o = new Option(currentTableData.pdf_files[i - 1].title, 0);
			/// jquerify the DOM object 'o' so we can use the html method
			$(o).html(currentTableData.pdf_files[i - 1].title);
			$("#pdf_select").append(o);
		}

		let o = new Option(currentTableData.pdf_files[i - 1].title, i);
		/// jquerify the DOM object 'o' so we can use the html method
		$(o).html(currentTableData.pdf_files[i - 1].title);
		$("#pdf_select").append(o);

	}

	let j, b, c;
	/* Look for any elements with the class "pdf_custom-select": */
	let selElmnt = document.getElementById('pdf_select');
	// For each element, create a new DIV that will act as the selected item:
	let newOption = document.createElement("DIV");
	newOption.setAttribute("class", "pdf_select-selected");
	newOption.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
	document.getElementById('pdf_custom-select').appendChild(newOption);
	// For each element, create a new DIV that will contain the option list: */
	b = document.createElement("DIV");
	b.setAttribute("class", "pdf_select-items pdf_select-hide");
	for (j = 1; j < selElmnt.length; j++)
	{
		/* For each option in the original select element,
		create a new DIV that will act as an option item: */
		c = document.createElement("DIV");
		c.innerHTML = selElmnt.options[j].innerHTML;
		c.setAttribute("data-value", selElmnt.options[j].value);
		c.addEventListener("click", function (e)
		{
			/* When an item is clicked, update the original select box,
			and the selected item: */
			let y, i, k, s, h;
			s = this.parentNode.parentNode.getElementsByTagName("select")[0];
			h = this.parentNode.previousSibling;
			for (i = 0; i < s.length; i++)
			{
				if (s.options[i].value === this.getAttribute("data-value"))
				{
					if (i === 0)
					{
						pdf_index = i;
						generate_pdf(i);

					}
					else
					{
						pdf_index = i - 1;
						generate_pdf(i - 1);
					}
					s.selectedIndex = i;
					h.innerHTML = this.innerHTML;
					y = this.parentNode.getElementsByClassName("pdf_same-as-selected");
					for (k = 0; k < y.length; k++)
					{
						y[k].removeAttribute("class");
					}
					this.setAttribute("class", "pdf_same-as-selected");
					break;
				}
			}
			h.click();
		});
		b.appendChild(c);
	}
	customSelect[i].appendChild(b);
	a.addEventListener("click", function (e)
	{
		/* When the select box is clicked, close any other select boxes,
		and open/close the current select box: */
		e.stopPropagation();
		pdf_closeAllSelect(this);
		closeAllSelect();
		tableData_closeAllSelect();
		this.nextSibling.classList.toggle("pdf_select-hide");
		this.classList.toggle("pdf_select-arrow-active");
	});
}
