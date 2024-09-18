let pdfrendering = false;
let scale = 1;
let adjustedScale = 1;
let controlAdjustedScale = adjustedScale;
let pdf = null;
let currentPageNum = null;
let pendingPageNum = null;
let currentPdfIndex = null;

let render_page_pdf = function (pageNumber) {
	pdf.getPage(pageNumber).then(function (page) {
		// Update page indicator text
		$('#page-indicator').text(`PAGE ${pageNumber} OF ${pdf.numPages}`);

		scale = 1;

		let viewport = page.getViewport({ scale });

		let modifier = $('#pdf-container').width();

		if ($(window).width() >= 900) {
			modifier = 900;
		}

		adjustedScale = (modifier / viewport.width) * 0.97;
		controlAdjustedScale = (modifier / viewport.width) * 0.97;

		viewport = page.getViewport({ scale: adjustedScale });

		let canvas = document.getElementById('pdf-canvas');
		let context = canvas.getContext('2d');
		canvas.width = viewport.width;
		canvas.height = viewport.height;

		let renderContext = {
			canvasContext: context,
			viewport: viewport
		};

		let renderTask = page.render(renderContext);
		renderTask.promise.then(function () {
			pdfrendering = false;
			// Another page rendering is pending
			if (pendingPageNum !== null) {
				render_page_pdf(pendingPageNum);
				pendingPageNum = null;
			}
		});
	});
};

let generate_pdf = function (index) {
	if (!pdfrendering) {
		pdfrendering = true;
		let adjustedHeight = $(window).height() - 280;
		if (
			!document.isFullScreen &&
			!document.fullscreenElement &&
			!document.webkitFullscreenElement &&
			!document.mozFullScreenElement &&
			!document.msFullscreenElement
		) {
			$('#pdf-container').css('height', adjustedHeight + 'px');
		} else {
			$('#pdf-container').css('height', $(window).height() + 'px');
		}

		let pdfInitParams = { data: currentTableData.pdf_files[index].content };
		// Store the index of the current PDF in `currentPdfIndex`
		currentPdfIndex = index;
		let loadingTask = pdfjsLib.getDocument(pdfInitParams);
		loadingTask.promise.then(
			function (pdf_) {
				pdf = pdf_;
				currentPageNum = 1;
				render_page_pdf(1);
			},
			function (reason) {
				console.error(reason);
			}
		);
	}
};

let zoom_in_pdf = function () {
	if (!pdfrendering) {
		pdfrendering = true;
		let pdfInitParams = {
			data: currentTableData.pdf_files[currentPdfIndex].content
		};
		let loadingTask = pdfjsLib.getDocument(pdfInitParams);
		loadingTask.promise.then(
			function (pdf) {
				pdf.getPage(currentPageNum).then(function (page) {
					adjustedScale += 0.1;

					let viewport = page.getViewport({ scale: adjustedScale });

					let canvas = document.getElementById('pdf-canvas');
					let context = canvas.getContext('2d');

					canvas.width = viewport.width;
					canvas.height = viewport.height;

					let renderContext = {
						canvasContext: context,
						viewport: viewport
					};

					let renderTask = page.render(renderContext);
					renderTask.promise.then(function () {
						pdfrendering = false;
					});
				});
			},
			function (reason) {
				console.error(reason);
			}
		);
	}
};

let zoom_out_pdf = function () {
	if (!pdfrendering) {
		pdfrendering = true;
		let pdfInitParams = {
			data: currentTableData.pdf_files[currentPdfIndex].content
		};
		let loadingTask = pdfjsLib.getDocument(pdfInitParams);
		loadingTask.promise.then(
			function (pdf) {
				pdf.getPage(currentPageNum).then(function (page) {
					adjustedScale -= 0.1;

					let viewport = page.getViewport({ scale: adjustedScale });

					let canvas = document.getElementById('pdf-canvas');
					let context = canvas.getContext('2d');

					canvas.width = viewport.width;
					canvas.height = viewport.height;

					let renderContext = {
						canvasContext: context,
						viewport: viewport
					};

					let renderTask = page.render(renderContext);
					renderTask.promise.then(function () {
						pdfrendering = false;
					});
				});
			},
			function (reason) {
				console.error(reason);
			}
		);
	}
};

// Render a certain page of the PDF or queue it to be rendered
let queue_render_page_pdf = function (pageNumber) {
	if (pdf) {
		if (pdfrendering) {
			pendingPageNum = pageNumber;
		} else {
			render_page_pdf(pageNumber);
		}
	}
};

// Go one page back in the PDF
let prev_page_pdf = function () {
	if (!currentPageNum || currentPageNum <= 1) return;
	else {
		currentPageNum--;
		queue_render_page_pdf(currentPageNum);
	}
};

// Go one page forward in the PDF
let next_page_pdf = function () {
	if (!currentPageNum || currentPageNum >= pdf.numPages) return;
	else {
		currentPageNum++;
		queue_render_page_pdf(currentPageNum);
	}
};

async function download_pdf() {
	// Get current PDF file's raw data
	const data = await pdf.getData();
	// Use application/octet-stream MIME type to force a download (instead of
	// having it open in a browser PDF viewer)
	saveAs(
		new Blob([data], {
			type: 'application/octet-stream'
		}),
		`${currentTableData.pdf_files[currentPdfIndex].title}.pdf`
	);
}

function pdf_closeAllSelect(elmnt) {
	/* A function that will close all select boxes in the document,
  except the current select box: */
	let x,
		y,
		i,
		arrNo = [];
	x = document.getElementsByClassName('pdf_select-items');
	y = document.getElementsByClassName('pdf_select-selected');
	for (i = 0; i < y.length; i++) {
		if (elmnt === y[i]) {
			arrNo.push(i);
		} else {
			y[i].classList.remove('pdf_select-arrow-active');
		}
	}
	for (i = 0; i < x.length; i++) {
		if (arrNo.indexOf(i)) {
			x[i].classList.add('pdf_select-hide');
		}
	}
}
function closeAllSelect(elmnt) {
	//  $('.select-selected').removeClass("activated-selected-item");
	$('.select-items div').removeClass('activated-select-items');
	/* A function that will close all select boxes in the document,
  except the current select box: */
	let x,
		y,
		i,
		arrNo = [];
	x = document.getElementsByClassName('gpa_select-items');
	y = document.getElementsByClassName('gpa_select-selected');
	for (i = 0; i < y.length; i++) {
		if (elmnt === y[i]) {
			arrNo.push(i);
		} else {
			y[i].classList.remove('select-arrow-active');
		}
	}
	for (i = 0; i < x.length; i++) {
		if (arrNo.indexOf(i)) {
			x[i].classList.add('select-hide');
		}
	}
	if (!$('.gpa_select-selected').hasClass('select-arrow-active')) {
		$('.gpa_select-selected').removeClass('activated-selected-item');
		$('.gpa_select-items div').removeClass('activated-select-items');
	}
}
function tableData_closeAllSelect(elmnt) {
	//  $('.select-selected').removeClass("activated-selected-item");
	$('.tableData_select-items div').removeClass('activated-select-items');
	/* A function that will close all select boxes in the document,
  except the current select box: */
	let x,
		y,
		i,
		arrNo = [];
	x = document.getElementsByClassName('tableData_select-items');
	y = document.getElementsByClassName('tableData_select-selected');
	for (i = 0; i < y.length; i++) {
		if (elmnt === y[i]) {
			arrNo.push(i);
		} else {
			y[i].classList.remove('select-arrow-active');
		}
	}
	for (i = 0; i < x.length; i++) {
		if (arrNo.indexOf(i)) {
			x[i].classList.add('select-hide');
		}
	}
	if (!$('.tableData_select-selected').hasClass('select-arrow-active')) {
		$('.tableData_select-selected').removeClass('activated-selected-item');
		$('.tableData_select-items div').removeClass('activated-select-items');
	}
}

function initialize_resize_hamburger() {
	// Total width of all items in tab minus hamburger
	let total_width = -44.25;

	// Width of all items to the left (because they get removed last) plus logout button and hamburger widths
	// 44.25 is hamburger width, has to be hardcoded becuase it might be display: none;'d
	let left_width = 44.25 + $('#logout_button').outerWidth();

	// Gets all non-tablinks-right elements and adds their width to total_width  and also left_width
	$('.tab .tablinks:not(.tablinks-right)').outerWidth((_, w) => {
		total_width += w;
		left_width += w;
	});

	// Gets all tablinks-right elements and adds their width to total_width
	$('.tab .tablinks-right').outerWidth((_, w) => {
		total_width += w;
	});

	const switch_left_items = () => {
		// Checks if left items are in sidenav
		const in_sidenav =
			$('.tab .tablinks:not(.tablinks-right, .switch-exempt)').length ===
			0;

		if (in_sidenav) {
			// Moves items from sidenav to tab
			$('#sidenav .tablinks:not(.tablinks-right, .switch-exempt)')
				.detach()
				.appendTo($('.tab'));
		} else {
			// Moves items from tab to sidenav
			$('.tab .tablinks:not(.tablinks-right, .switch-exempt)')
				.detach()
				.appendTo($('#sidenav'));
			// Puts all the tablinks-right things below the non-tablinks-right things
			for (const child of $('#sidenav .tablinks-right')) {
				$('#sidenav').append(child);
			}
		}
	};

	// REASON IT ADDS ITEMS IN REVERSE:
	// Otherwise the items would basically go from right to left (in tab)
	// To down to up, when I'd like it to be up to down.
	const switch_right_items = function () {
		// Checks if right-items (more specifically buttons) are hidden

		const in_sidenav = $('.tab .gpa_custom-select').length == 0;

		if (in_sidenav) {
			// Adds right items to tab in reverse
			const children = $('#sidenav .tablinks-right:not(#logout_button)');
			for (const child of [...children].reverse()) {
				$('.tab').append(child);
			}

			// Also closes the sidebar
			closeSideNav();
		} else {
			// Adds right items to sidenav in reverse
			const children = $('.tab .tablinks-right:not(#logout_button)');
			for (const child of [...children].reverse()) {
				$('#sidenav').append(child);
			}
		}
	};

	const switch_hamburger = function () {
		// Hides or unhides the hamburger
		if ($('#hamburger_button').hasClass('hide')) {
			$('#hamburger_button').removeClass('hide');
		} else {
			$('#hamburger_button').addClass('hide');
		}
	};

	// navbar_state has 3 states
	// 0 -> bar has enough space for everything, THIS IS THE DEFAULT IN THE CSS/HTML
	// 1 -> bar can't fit the items on the right
	// 2 -> bar can only fit logout and hamburger
	// old_navbar_state is used to compare the newer navbar_state to the current navbar_state
	let navbar_state, old_navbar_state;
	const update_navbar_state = function () {
		if ($('.tab').width() <= left_width) {
			navbar_state = 2;
		} else if ($('.tab').width() <= total_width) {
			navbar_state = 1;
		} else {
			navbar_state = 0;
		}
	};

	// Initially instantiates nav_bar_state and old_nav_bar_state
	update_navbar_state();
	old_navbar_state = navbar_state;

	// Initially switches whatever is necessary, only if navbar_state is 1 or 2 because 0 is default
	if (navbar_state === 1) {
		switch_right_items();
		switch_hamburger();
	} else if (navbar_state === 2) {
		switch_right_items();
		switch_left_items();
		switch_hamburger();
	}

	// ADDS THE EVENT LISTENER
	window.addEventListener('resize', function () {
		// Updates navbar_state
		update_navbar_state();

		// If they're different, updates the tab and sidenav
		if (old_navbar_state !== navbar_state) {
			if (
				(old_navbar_state === 0 && navbar_state === 1) ||
				(old_navbar_state === 1 && navbar_state === 0)
			) {
				// When moving to and from 0 and 1, needs to switch both right items and hamburgers
				switch_right_items();
				switch_hamburger();
			} else if (
				(old_navbar_state === 1 && navbar_state === 2) ||
				(old_navbar_state === 2 && navbar_state === 1)
			) {
				// When moving between 1 and 2, needs to switch left items
				switch_left_items();
			} else if (
				(old_navbar_state === 0 && navbar_state === 2) ||
				(old_navbar_state === 2 && navbar_state === 0)
			) {
				// If it goes from 0 to 2 or 2 to 0, do everything in succession
				switch_right_items();
				switch_hamburger();
				switch_left_items();
			}
		}

		// Updates the old navbar state for later comparisons
		old_navbar_state = navbar_state;
	});
}

//pdf dropdown stuff
let initialize_pdf_dropdown = function () {
	//let o = new Option(tableData.pdf_files[i].title, i);
	///// jquerify the DOM object 'o' so we can use the html method
	//$(o).html(tableData.pdf_files[i].title);
	//$("#pdf-select").append(o);

	for (let i = 1; i < currentTableData.pdf_files.length + 1; i++) {
		if (i === 1) {
			let o = new Option(currentTableData.pdf_files[i - 1].title, 0);
			/// jquerify the DOM object 'o' so we can use the html method
			$(o).html(currentTableData.pdf_files[i - 1].title);
			$('#pdf_select').append(o);
		}

		let o = new Option(currentTableData.pdf_files[i - 1].title, i);
		/// jquerify the DOM object 'o' so we can use the html method
		$(o).html(currentTableData.pdf_files[i - 1].title);
		$('#pdf_select').append(o);
	}

	let x, i, j, selElmnt, a, b, c;
	/* Look for any elements with the class "pdf_custom-select": */
	x = document.getElementsByClassName('pdf_custom-select');
	for (i = 0; i < x.length; i++) {
		selElmnt = x[i].getElementsByTagName('select')[0];
		/* For each element, create a new DIV that will act as the selected item: */
		a = document.createElement('DIV');
		a.setAttribute('class', 'pdf_select-selected');
		a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
		x[i].appendChild(a);
		/* For each element, create a new DIV that will contain the option list: */
		b = document.createElement('DIV');
		b.setAttribute('class', 'pdf_select-items pdf_select-hide');
		for (j = 1; j < selElmnt.length; j++) {
			/* For each option in the original select element,
      create a new DIV that will act as an option item: */
			c = document.createElement('DIV');
			c.innerHTML = selElmnt.options[j].innerHTML;
			c.setAttribute('data-value', selElmnt.options[j].value);
			c.addEventListener('click', function (e) {
				/* When an item is clicked, update the original select box,
        and the selected item: */
				let y, i, k, s, h;
				s =
					this.parentNode.parentNode.getElementsByTagName(
						'select'
					)[0];
				h = this.parentNode.previousSibling;
				for (i = 0; i < s.length; i++) {
					if (
						s.options[i].value === this.getAttribute('data-value')
					) {
						if (i === 0) {
							pdf_index = i;
							generate_pdf(i);
						} else {
							pdf_index = i - 1;
							generate_pdf(i - 1);
						}
						s.selectedIndex = i;
						h.innerHTML = this.innerHTML;
						y = this.parentNode.getElementsByClassName(
							'pdf_same-as-selected'
						);
						for (k = 0; k < y.length; k++) {
							y[k].removeAttribute('class');
						}
						this.setAttribute('class', 'pdf_same-as-selected');
						break;
					}
				}
				h.click();
			});
			b.appendChild(c);
		}
		x[i].appendChild(b);
		a.addEventListener('click', function (e) {
			/* When the select box is clicked, close any other select boxes,
      and open/close the current select box: */
			e.stopPropagation();
			pdf_closeAllSelect(this);
			closeAllSelect();
			tableData_closeAllSelect();
			this.nextSibling.classList.toggle('pdf_select-hide');
			this.classList.toggle('pdf_select-arrow-active');
		});
	}
};

let toggle_fullscreen_icon = function () {
	if ($('#expand-pdf-icon i').hasClass('fa-expand-alt')) {
		$('#expand-pdf-icon i')
			.removeClass('fa-expand-alt')
			.addClass('fa-compress-alt');
		$('#expand-pdf-icon .tooltiptext')
			.attr(
				'style',
				$('#expand-pdf-icon .tooltiptext')
					.attr('style')
					.replace('margin-left: -92px;', 'margin-left: -95px;')
			)
			.replace_text('Exit Fullscreen');
	} else {
		$('#expand-pdf-icon i')
			.removeClass('fa-compress-alt')
			.addClass('fa-expand-alt');
		$('#expand-pdf-icon .tooltiptext')
			.attr(
				'style',
				$('#expand-pdf-icon .tooltiptext')
					.attr('style')
					.replace('margin-left: -95px;', 'margin-left: -92px;')
			)
			.replace_text('Go Fullscreen');
	}
};

let toggle_fullscreen_pdf = function () {
	let elem = document.getElementById('reports');

	console.log('Fullscreen Activate');
	if (
		!document.isFullScreen &&
		!document.fullscreenElement &&
		!document.webkitFullscreenElement &&
		!document.mozFullScreenElement &&
		!document.msFullscreenElement
	) {
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
			toggle_fullscreen_icon();
		} else if (elem.mozRequestFullScreen) {
			/* Firefox */
			elem.mozRequestFullScreen();
			toggle_fullscreen_icon();
		} else if (elem.webkitRequestFullscreen) {
			/* Chrome, Safari and Opera */
			let new_height = $(window).height();
			elem.webkitRequestFullscreen();
			toggle_fullscreen_icon();
		} else if (elem.msRequestFullscreen) {
			/* IE/Edge */
			elem.msRequestFullscreen();
			toggle_fullscreen_icon();
		}
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
			toggle_fullscreen_icon();
		} else if (document.mozCancelFullScreen) {
			/* Firefox */
			document.mozCancelFullScreen();
			toggle_fullscreen_icon();
		} else if (document.webkitExitFullscreen) {
			/* Chrome, Safari and Opera */
			document.webkitExitFullscreen();
			toggle_fullscreen_icon();
		} else if (document.msExitFullscreen) {
			/* IE/Edge */
			document.msExitFullscreen();
			toggle_fullscreen_icon();
		}
	}
};
