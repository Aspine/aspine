let pdf_index = 0;
let pdfrendering = false;

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

function main_pdf() {
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
}}

let generate_pdf = function(index) {
    if (!pdfrendering) {
      pdfrendering = true;
      let adjustedHeight = $(window).height() - 280;
      if (!document.isFullScreen && !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) { $('#pdf-container').css('height', adjustedHeight + 'px');
    } else {
      $('#pdf-container').css('height', $(window).height() + 'px');
    }

    let pdfInitParams = {"data": ((currentTableData.pdf_files)[index]).content};
    // Store the index of the current PDF in `currentPdfIndex`
    currentPdfIndex = index;
    let loadingTask = pdfjsLib.getDocument(pdfInitParams);
    loadingTask.promise.then(function(pdf_) {
      pdf = pdf_;
      currentPageNum = 1;
      render_page_pdf(1);
    }, function (reason) {
      console.error(reason);
    });
  }
  }

  let zoom_in_pdf = function() {
    if (!pdfrendering) {
      pdfrendering = true;
      let pdfInitParams = {"data": (currentTableData.pdf_files)[currentPdfIndex].content};
      let loadingTask = pdfjsLib.getDocument(pdfInitParams);
      loadingTask.promise.then(function(pdf) {

        pdf.getPage(currentPageNum).then(function(page) {

          adjustedScale += 0.1;

          let viewport = page.getViewport({"scale": adjustedScale});

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


      }, function (reason) {
        console.error(reason);
      });
    }
  }

  let zoom_out_pdf = function() {
    if (!pdfrendering) {
      pdfrendering = true;
      let pdfInitParams = {"data": (currentTableData.pdf_files)[currentPdfIndex].content};
      let loadingTask = pdfjsLib.getDocument(pdfInitParams);
      loadingTask.promise.then(function(pdf) {

        pdf.getPage(currentPageNum).then(function(page) {

          adjustedScale -= 0.1;

          let viewport = page.getViewport({"scale": adjustedScale});


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

      }, function (reason) {
        console.error(reason);
      });
    }
  }

  // Render a certain page of the PDF or queue it to be rendered
  let queue_render_page_pdf = function(pageNumber) {
    if (pdf) {
      if (pdfrendering) {
        pendingPageNum = pageNumber;
      }
      else {
        render_page_pdf(pageNumber);
      }
    }
  }

  // Go one page back in the PDF
  let prev_page_pdf = function() {
    if (!currentPageNum || currentPageNum <= 1) return;
    else {
      currentPageNum--;
      queue_render_page_pdf(currentPageNum);
    }
  }

  // Go one page forward in the PDF
  let next_page_pdf = function() {
    if (!currentPageNum || currentPageNum >= pdf.numPages) return;
    else {
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

async function render_page_pdf(pageNumber) {
    let page = await pdf.getPage(pageNumber);

    // Update page indicator text
    $("#page-indicator").text(`PAGE ${pageNumber} OF ${pdf.numPages}`);

    scale = 1;

    let viewport = page.getViewport({scale});


    let modifier = $('#pdf-container').width();

    if ($(window).width() >= 900) {
        modifier = 900;
    }

    adjustedScale = (modifier / viewport.width) * 0.97;
    controlAdjustedScale = (modifier / viewport.width) * 0.97;


    viewport = page.getViewport({"scale": adjustedScale});


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
}




async function download_pdf() {
  // Get current PDF file's raw data
  const data = await pdf.getData();
  // Use application/octet-stream MIME type to force a download (instead of
  // having it open in a browser PDF viewer)
  saveAs(new Blob([data], {
    type: "application/octet-stream"
  }), `${currentTableData.pdf_files[currentPdfIndex].title}.pdf`);
}

function pdf_closeAllSelect(elmnt) {
  /* A function that will close all select boxes in the document,
  except the current select box: */
  let x, y, i, arrNo = [];
  x = document.getElementsByClassName("pdf_select-items");
  y = document.getElementsByClassName("pdf_select-selected");
  for (i = 0; i < y.length; i++) {
    if (elmnt === y[i]) {
      arrNo.push(i)
    } else {
      y[i].classList.remove("pdf_select-arrow-active");
    }
  }
  for (i = 0; i < x.length; i++) {
    if (arrNo.indexOf(i)) {
      x[i].classList.add("pdf_select-hide");
    }
  }
}
