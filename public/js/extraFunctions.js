
let vip_username_list = ["8006214", "8001874"];
// Cole: 8006697
// Tyler: 8006696
// Max: 2109723

Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0;
}

//in a function because when extraFunctions first runs, jquery isn't initialized
function initialize_jquery_prototype() {
  jQuery.prototype.replace_text = function(input) {
    this.contents().filter(function() {return (this.nodeType == 3);}).replaceWith(input)
  }
}

function getGPA(gradeToBeGPA) {

  let parsed = parseFloat(gradeToBeGPA);
  if (parsed >= 97) {
    return 4.0;
  } else if (parsed >= 93) {
    return 4.0;
  } else if (parsed >= 90) {
    return 3.7;
  } else if (parsed >= 87) {
    return 3.3;
  } else if (parsed >= 83) {
    return 3.0;
  } else if (parsed >= 80) {
    return 2.7;
  } else if (parsed >= 77) {
    return 2.3;
  } else if (parsed >= 73) {
    return 2.0;
  } else if (parsed >= 70) {
    return 1.7;
  } else if (parsed >= 67) {
    return 1.3;
  } else if (parsed >= 63) {
    return 1.0;
  } else if (parsed >= 60) {
    return 0.7;
  } else {
    return 0.0;
  }
}

function GPAType() {
  let selectElem = $("#gpa_select");
  let selectedElem = $(".gpa_select-selected");
  let selection = $("#gpa_select option")[selectElem.prop("selectedIndex")].value;

  let quarterName = "";
  let quarterData;

  if (selection == 0) {
    quarterName = "Current Quarter";
    quarterData = currentTableData.terms.current;
  }
  else {
    quarterName = "Q" + selection;
    quarterData = currentTableData.terms["q" + selection];
  }

  if (selectedElem.html().includes("GPA")) {
    if (quarterData.GPA.outOfFour != quarterData.calcGPA.outOfFour) {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter Unweighted: " + currentTableData.terms.current.GPA.outOfFour.toFixed(2) +
        "<br> Calculated: " + currentTableData.terms.current.calcGPA.outOfFour.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " Unweighted: " + currentTableData.terms["q" + i].GPA.outOfFour.toFixed(2) +
          (currentTableData.terms["q" + i].calcGPA ? (
            "<br> Calculated: " + currentTableData.terms["q" + i].calcGPA.outOfFour.toFixed(2)
          ) : "")
        );
      }
      selectedElem.replace_text(
        quarterName + " Unweighted: " + quarterData.GPA.outOfFour.toFixed(2) +
        "<br> Calculated: " + quarterData.calcGPA.outOfFour.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative Unweighted: " + currentTableData.cumGPA.outOfFour.toFixed(2)
      );
    }
    else {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter Unweighted: " + currentTableData.terms.current.GPA.outOfFour.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " Unweighted: " + currentTableData.terms["q" + i].GPA.outOfFour.toFixed(2)
        );
      }
      selectedElem.replace_text(
        quarterName + " Unweighted: " + quarterData.GPA.outOfFour.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative Unweighted: " + currentTableData.cumGPA.outOfFour.toFixed(2)
      );
    }
  }
  else if (selectedElem.html().includes("Unweighted")) {
    if (quarterData.GPA.outOfFive != quarterData.calcGPA.outOfFive) {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter Weighted: " + currentTableData.terms.current.GPA.outOfFive.toFixed(2) +
        "<br> Calculated: " + currentTableData.terms.current.calcGPA.outOfFive.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " Weighted: " + currentTableData.terms["q" + i].GPA.outOfFive.toFixed(2) +
          (currentTableData.terms["q" + i].calcGPA ? (
            "<br> Calculated: " + currentTableData.terms["q" + i].calcGPA.outOfFive.toFixed(2)
          ) : "")
        );
      }
      selectedElem.replace_text(
        quarterName + " Weighted: " + quarterData.GPA.outOfFive.toFixed(2) +
        "<br> Calculated: " + quarterData.calcGPA.outOfFive.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative Weighted: " + currentTableData.cumGPA.outOfFive.toFixed(2)
      );
    }
    else {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter Weighted: " + currentTableData.terms.current.GPA.outOfFive.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " Weighted: " + currentTableData.terms["q" + i].GPA.outOfFive.toFixed(2)
        );
      }
      selectedElem.replace_text(
        quarterName + " Weighted: " + quarterData.GPA.outOfFive.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative Weighted: " + currentTableData.cumGPA.outOfFive.toFixed(2)
      );
    }
  }
  else if (selectedElem.html().includes("Weighted")) {
    if (quarterData.GPA.percent != quarterData.calcGPA.percent) {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter GPA: " + currentTableData.terms.current.GPA.percent.toFixed(2) +
        "<br> Calculated: " + currentTableData.terms.current.calcGPA.percent.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " GPA: " + currentTableData.terms["q" + i].GPA.percent.toFixed(2) +
          (currentTableData.terms["q" + i].calcGPA ? (
            "<br> Calculated: " + currentTableData.terms["q" + i].calcGPA.percent.toFixed(2)
          ) : "")
        );
      }
      selectedElem.replace_text(
        quarterName + " GPA: " + quarterData.GPA.percent.toFixed(2) +
        "<br> Calculated: " + quarterData.calcGPA.percent.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative GPA: " + currentTableData.cumGPA.percent.toFixed(2)
      );
    }
    else {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter GPA: " + currentTableData.terms.current.GPA.percent.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " GPA: " + currentTableData.terms["q" + i].GPA.percent.toFixed(2)
        );
      }
      selectedElem.replace_text(
        quarterName + " GPA: " + quarterData.GPA.percent.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative GPA: " + currentTableData.cumGPA.percent.toFixed(2)
      );
    }
  }
}

function getLetterGrade(gradeToBeLettered) {
  let parsed = parseFloat(gradeToBeLettered);
  if (parsed >= 96.5) {
    return "A+";
  } else if (parsed >= 92.5) {
    return "A";
  } else if (parsed >= 89.5) {
    return "A-";
  } else if (parsed >= 86.5) {
    return "B+";
  } else if (parsed >= 82.5) {
    return "B";
  } else if (parsed >= 79.5) {
    return "B-";
  } else if (parsed >= 76.5) {
    return "C+";
  } else if (parsed >= 72.5) {
    return "C";
  } else if (parsed >= 69.5) {
    return "C-";
  } else if (parsed >= 66.5) {
    return "D+";
  } else if (parsed >= 62.5) {
    return "D";
  } else if (parsed >= 59.5) {
    return "D-";
  } else {
    return "F";
  }
}

function getColor(gradeToBeColored) {
  if (vip_username_list.includes(currentTableData.username)) {
    return "#1E8541";
  }

  if (parseFloat(gradeToBeColored) >= 89.5) {
    return "#1E8541";
  } else if (parseFloat(gradeToBeColored) >= 79.5) {
    return "#6666FF";
  } else if (parseFloat(gradeToBeColored) >= 69.5) {
    return "#ff9900";
  } else if (parseFloat(gradeToBeColored) >= 59.5) {
    return "orange";
  } else if (parseFloat(gradeToBeColored) >= 0) {
    return "red";
  } else {
    return "black";
  }
}

let lightColors = ["#3d995c", "#a3a3f5", "#eba947", "#ebb147", "#eb4747"];
function getLightColor(gradeToBeColored) {
  if (vip_username_list.includes(currentTableData.username)) {
    return "#1E8541";
  }

  if (parseFloat(gradeToBeColored) >= 89.5) {
    return lightColors[0];
  } else if (parseFloat(gradeToBeColored) >= 79.5) {
    return lightColors[1];
  } else if (parseFloat(gradeToBeColored) >= 69.5) {
    return lightColors[2];
  } else if (parseFloat(gradeToBeColored) >= 59.5) {
    return lightColors[3];
  } else if (parseFloat(gradeToBeColored) >= 0) {
    return lightColors[4];
  } else {
    return "black";
  }
}

let rowFormatter = function(cell) {
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
}

let classColors = [
  "#FF7070",
  "#FFB170",
  "#00Ad00",
  "#008282",
  "#008500",
  "#006464",
  "#D90000",
  "#00FFFF"
]

let classIndex = function(classname) {
  let classesArray = currentTableData.currentTermData.classes.map(x => x.name);
  return (classesArray.indexOf(classname));
  // why the mod 8?
}

let classFormatter = function(cell, formatterParams) {
  let rowClass = cell.getRow().getData().classname;
  let classColor = classColors[classIndex(rowClass)];
  let value = cell.getValue();

  if (vip_username_list.includes(currentTableData.username)) {
    return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + value + "</span>";

  }

  if (classColor === "black") {
    return value;
  } else {
    return "<span style='color:" + classColor + "; font-weight:bold;'>" + value + "</span>";
  }
}

let weightFormatter = function(cell, formatterParams) {
  let value = cell.getValue();
  let rowColor = cell.getRow().getData().color;

  if (value.indexOf(".") != -1) {
    value = value.substring(0, value.indexOf(".") + 2) + "%";
  }

  if (vip_username_list.includes(currentTableData.username)) {
    return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + value + "</span>";
  }

  if (rowColor === "black") {
    return value;
  } else {
    return "<span style='color:" + rowColor + "; font-weight:bold;'>" + value + "</span>";
  }
}

let rowGradeFormatter = function(cell, formatterParams) {
  let numberGrade = parseFloat(cell.getValue());
  let rowColor = cell.getRow().getData().color;



  if (isNaN(numberGrade)) {
    return "No Grade";

  } else {
    let value = parseFloat(cell.getValue()) + "% " + getLetterGrade(cell.getValue());

    if (vip_username_list.includes(currentTableData.username)) {
      return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + value + "</span>";
    }

    if (numberGrade > 100) {
      return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + value + "</span>";
    } else {
      return "<span style='color:" + rowColor + "; font-weight:bold;'>" + value + "</span>";
    }

  }

}

let gradeFormatter = function(cell, formatterParams) {
  let numberGrade = parseFloat(cell.getValue());
  let calculated_grade = cell.getRow().getData().calculated_grade;
  let edited = cell.getRow().getData().edited;



  if (isNaN(numberGrade)) {
    return "No Grade";

  } else {

    let real = parseFloat(cell.getValue()) + "% " + getLetterGrade(cell.getValue());
    let fake = "";
    if (edited) {
      fake = "Calculated Grade: " + calculated_grade + "% " + getLetterGrade(calculated_grade);
    }
    let realColor = getColor(parseFloat(real));
    let fakeColor = getColor(parseFloat(fake));

    if (numberGrade >= 100 && calculated_grade >= 100) {

      return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + real + "</span>" + "<br>" + "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + fake + "</span>";

    } else if (numberGrade >= 100) {

      return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + real + "</span>" + "<br>" + "<span style='color:" + getColor(parseFloat(fake)) + "; font-weight:bold;'>" + fake + "</span>";

    } else if (calculated_grade >= 100) {

      return "<span style='color:" + getColor(parseFloat(real)) + "; font-weight:bold;'>" + real + "</span>" + "<br>" + "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + fake + "</span>";

    } else {
      if (vip_username_list.includes(currentTableData.username)) {
        return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + real + "</span>" + "<br>" + "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + fake + "</span>";
      }

      return "<span style='color:" + getColor(parseFloat(real)) + "; font-weight:bold;'>" + real + "</span>" + "<br>" + "<span style='color:" + getColor(parseFloat(calculated_grade)) + "; font-weight:bold;'>" + fake + "</span>";

    }
    //return "<span style='color:" + getColor(parseFloat(real)) + "; font-weight:bold;'>" + real + "</span>" + "<br>" + "<span style='color:" + getColor(parseFloat(calculated_grade)) + "; font-weight:bold;'>" + fake + "</span>";

  }

}
let scale = 1;
let adjustedScale = 1;
let controlAdjustedScale = adjustedScale;
let pdf = null;
let currentPageNum = null;
let pendingPageNum = null;
let currentPdfIndex = null;

let render_page_pdf = function(pageNumber) {
  pdf.getPage(pageNumber).then(function(page) {

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

  });
}

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
function closeAllSelect(elmnt) {
  //  $('.select-selected').removeClass("activated-selected-item");
  $('.select-items div').removeClass("activated-select-items");
  /* A function that will close all select boxes in the document,
  except the current select box: */
  let x, y, i, arrNo = [];
  x = document.getElementsByClassName("gpa_select-items");
  y = document.getElementsByClassName("gpa_select-selected");
  for (i = 0; i < y.length; i++) {
    if (elmnt === y[i]) {
      arrNo.push(i)
    } else {
      y[i].classList.remove("select-arrow-active");
    }
  }
  for (i = 0; i < x.length; i++) {
    if (arrNo.indexOf(i)) {
      x[i].classList.add("select-hide");
    }
  }
  if (!$(".gpa_select-selected").hasClass("select-arrow-active")) {
    $('.gpa_select-selected').removeClass("activated-selected-item");
    $('.gpa_select-items div').removeClass("activated-select-items");
  }

}
function tableData_closeAllSelect(elmnt) {
  //  $('.select-selected').removeClass("activated-selected-item");
  $('.tableData_select-items div').removeClass("activated-select-items");
  /* A function that will close all select boxes in the document,
  except the current select box: */
  let x, y, i, arrNo = [];
  x = document.getElementsByClassName("tableData_select-items");
  y = document.getElementsByClassName("tableData_select-selected");
  for (i = 0; i < y.length; i++) {
    if (elmnt === y[i]) {
      arrNo.push(i)
    } else {
      y[i].classList.remove("select-arrow-active");
    }
  }
  for (i = 0; i < x.length; i++) {
    if (arrNo.indexOf(i)) {
      x[i].classList.add("select-hide");
    }
  }
  if (!$(".tableData_select-selected").hasClass("select-arrow-active")) {
    $('.tableData_select-selected').removeClass("activated-selected-item");
    $('.tableData_select-items div').removeClass("activated-select-items");
  }

}

function initialize_resize_hamburger() {

  // Total width of all items in tab minus hamburger
  let total_width = -44.25;

  // Width of all items to the left (because they get removed last) plus logout button and hamburger widths
  // 44.25 is hamburger width, has to be hardcoded becuase it might be display: none;'d
  let left_width = 44.25 + $('#logout_button').outerWidth()

  // Gets all non-tablinks-right elements and adds their width to total_width  and also left_width
  $('.tab .tablinks:not(.tablinks-right)').outerWidth((_, w) => {
    total_width += w;
    left_width += w;
  });

  // Gets all tablinks-right elements and adds their width to total_width
  $('.tab .tablinks-right').outerWidth((_, w) => {total_width += w;})

  const switch_left_items = () => {
    // Checks if left items are in sidenav
    const in_sidenav = $('.tab .tablinks:not(.tablinks-right, .switch-exempt)').length === 0

    if (in_sidenav) {
      // Moves items from sidenav to tab
      $('#sidenav .tablinks:not(.tablinks-right, .switch-exempt)').detach().appendTo($(".tab"));
    } else {
      // Moves items from tab to sidenav
      $('.tab .tablinks:not(.tablinks-right, .switch-exempt)').detach().appendTo($("#sidenav"));
      // Puts all the tablinks-right things below the non-tablinks-right things
      for (const child of $('#sidenav .tablinks-right')) {
        $('#sidenav').append(child);
      }
    }
  }

  // REASON IT ADDS ITEMS IN REVERSE:
  // Otherwise the items would basically go from right to left (in tab) 
  // To down to up, when I'd like it to be up to down.
  const switch_right_items = function() {
    // Checks if right-items (more specifically buttons) are hidden

    const in_sidenav = $('.tab .gpa_custom-select').length == 0

    if (in_sidenav) {

      // Adds right items to tab in reverse
      const children = $('#sidenav .tablinks-right:not(#logout_button)')
      for (const child of [...children].reverse()) {
        $(".tab").append(child);
      }

      // Also closes the sidebar
      closeSideNav();
    } else {

      // Adds right items to sidenav in reverse
      const children = $('.tab .tablinks-right:not(#logout_button)')
      for (const child of [...children].reverse()) {
        $("#sidenav").append(child)
      }
    }
  }

  const switch_hamburger = function() {
    
    // Hides or unhides the hamburger
    if ($('#hamburger_button').hasClass("hide")) {
      $('#hamburger_button').removeClass("hide")
    } else {
      $('#hamburger_button').addClass("hide")
    }
  }

  // navbar_state has 3 states
  // 0 -> bar has enough space for everything, THIS IS THE DEFAULT IN THE CSS/HTML
  // 1 -> bar can't fit the items on the right
  // 2 -> bar can only fit logout and hamburger
  // old_navbar_state is used to compare the newer navbar_state to the current navbar_state
  let navbar_state, old_navbar_state;
  const update_navbar_state = function() {
    if ($(".tab").width() <= left_width) {
      navbar_state = 2;
    } else if ($(".tab").width() <= total_width) {
      navbar_state = 1;
    } else {
      navbar_state = 0;
    }
  }

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
  window.addEventListener("resize", function () {

    // Updates navbar_state
    update_navbar_state();

    // If they're different, updates the tab and sidenav
    if (old_navbar_state !== navbar_state) {
      if ((old_navbar_state === 0 && navbar_state === 1) || (old_navbar_state === 1 && navbar_state === 0)) {
        // When moving to and from 0 and 1, needs to switch both right items and hamburgers
        switch_right_items();
        switch_hamburger();
      }
      else if ((old_navbar_state === 1 && navbar_state === 2) || (old_navbar_state === 2 && navbar_state === 1)) {
        // When moving between 1 and 2, needs to switch left items
        switch_left_items();
      }
      else if ((old_navbar_state === 0 && navbar_state === 2) || (old_navbar_state === 2 && navbar_state === 0)) {
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
let initialize_pdf_dropdown = function() {

  //let o = new Option(tableData.pdf_files[i].title, i);
  ///// jquerify the DOM object 'o' so we can use the html method
  //$(o).html(tableData.pdf_files[i].title);
  //$("#pdf-select").append(o);

  for (let i = 1; i < currentTableData.pdf_files.length + 1; i++) {
    if (i === 1) {
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

  let x, i, j, selElmnt, a, b, c;
  /* Look for any elements with the class "pdf_custom-select": */
  x = document.getElementsByClassName("pdf_custom-select");
  for (i = 0; i < x.length; i++) {
    selElmnt = x[i].getElementsByTagName("select")[0];
    /* For each element, create a new DIV that will act as the selected item: */
    a = document.createElement("DIV");
    a.setAttribute("class", "pdf_select-selected");
    a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
    x[i].appendChild(a);
    /* For each element, create a new DIV that will contain the option list: */
    b = document.createElement("DIV");
    b.setAttribute("class", "pdf_select-items pdf_select-hide");
    for (j = 1; j < selElmnt.length; j++) {
      /* For each option in the original select element,
      create a new DIV that will act as an option item: */
      c = document.createElement("DIV");
      c.innerHTML = selElmnt.options[j].innerHTML;
      c.addEventListener("click", function(e) {
        /* When an item is clicked, update the original select box,
        and the selected item: */
        let y, i, k, s, h;
        s = this.parentNode.parentNode.getElementsByTagName("select")[0];
        h = this.parentNode.previousSibling;
        for (i = 0; i < s.length; i++) {
          if (s.options[i].innerHTML === this.innerHTML) {
            if (i === 0) {
              pdf_index = i;
              generate_pdf(i);

            } else {
              pdf_index = i - 1;
              generate_pdf(i - 1);
            }
            s.selectedIndex = i;
            h.innerHTML = this.innerHTML;
            y = this.parentNode.getElementsByClassName("pdf_same-as-selected");
            for (k = 0; k < y.length; k++) {
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
    x[i].appendChild(b);
    a.addEventListener("click", function(e) {
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


}

let listener = function(event) {
  let _this = event.target;
  /* When an item is clicked, update the original select box,
  and the selected item: */

  if (term_dropdown_active) {
    let y, i, k, s, h;
    s = _this.parentNode.parentNode.getElementsByTagName("select")[0];
    h = _this.parentNode.previousSibling;
    for (i = 0; i < s.length; i++) {
      if (s.options[i].innerHTML === _this.innerHTML) {
        if (i === 0) {
          currentTerm = termConverter[i];
        } else {
          currentTerm = termConverter[i - 1];
        }

        if (i === 0) $("#mostRecentDiv").show();
        else $("#mostRecentDiv").hide();

        if (typeof currentTableData.terms[currentTerm].classes === 'undefined') {
          // if (anyEdited()) {
          // $(".gpa_select-selected").css('padding', "5px 16px 5px 16px");
          // } else {
          $(".gpa_select-selected").css("padding", "13px 16px 13px 16px");
          // }

          term_dropdown_active = false;

          $.ajax({
            url: "/data",
            method: "POST",
            data: { quarter: (i - 1) },
            dataType: "json json",
            success: responseCallbackPartial
          });

          $("#loader").show();
          $("#classesTable").hide();
          $("#assignmentsTable").hide(); //;.setData(tableData[i].assignments);
          $("#categoriesTable").hide(); //;.setData(tableData[i].assignments);

          s.selectedIndex = i;
          h.innerHTML = this.innerHTML;
          y = this.parentNode.getElementsByClassName("same-as-selected");
          for (k = 0; k < y.length; k++) {
            y[k].removeAttribute("class");
          }
          this.setAttribute("class", "same-as-selected");
          break;

        } else {
          if (anyEdited()) {
            $(".gpa_select-selected").css('padding', "5px 16px 5px 16px");
          } else {
            $(".gpa_select-selected").css("padding", "13px 16px 13px 16px");
          }

          if (i === 0) {
            currentTableData.currentTermData = currentTableData.terms.current;
          } else {
            currentTableData.currentTermData = currentTableData.terms["q" + (i - 1)];
          }

          classesTable.setData(currentTableData.currentTermData.classes);

          $("#assignmentsTable").hide(); //;.setData(tableData[i].assignments);
          $("#categoriesTable").hide(); //;.setData(tableData[i].assignments);
          selected_class_i = undefined;
          //categoriesTable.setData(tableData[i].categoryDisplay);

          s.selectedIndex = i;
          h.innerHTML = this.innerHTML;
          y = this.parentNode.getElementsByClassName("same-as-selected");
          for (k = 0; k < y.length; k++) {
            y[k].removeAttribute("class");
          }
          this.setAttribute("class", "same-as-selected");
          break;
        }
      }
    }
    h.click();
  } else {
    console.log("Term dropdown not active");
  }
};

/*
 * includedTerms is an optional parameter which contains the terms
 * included in an import (in the case that currentTableData is imported
 * and not all of the terms' data have been put into currentTableData)
 */
let initialize_quarter_dropdown = function(includedTerms) {

  /* Look for any elements with the class "gpa_custom-select": */
  let x = document.getElementsByClassName("gpa_custom-select")[0];
  let selElmnt = x.getElementsByTagName("select")[0];

  /* For each element, create a new DIV that will act as the selected item: */
  let a;
  if (!(a = document.getElementsByClassName("gpa_select-selected")[0])) {
    a = document.createElement("DIV");
    a.setAttribute("class", "gpa_select-selected select-selected");
    x.appendChild(a);
    a.addEventListener("click", function(e) {
      /* When the select box is clicked, close any other select boxes,
      and open/close the current select box: */
      e.stopPropagation();
      closeAllSelect(this);
      pdf_closeAllSelect();
      tableData_closeAllSelect();
      this.nextSibling.classList.toggle("select-hide");
      this.classList.toggle("select-arrow-active");
      $('.gpa_select-selected').toggleClass("activated-selected-item");
      $('.gpa_select-items div').toggleClass("activated-select-items");
      //resetTableData();

      //sets up tooltip margins for this
      setup_tooltips();
    });
  }
  a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;

  /* For each element, create a new DIV that will contain the option list: */
  let b;
  if (!(b = document.getElementById("view_gpa_select"))) {
    b = document.createElement("DIV");
    b.setAttribute("class", "gpa_select-items select-items select-hide");
    b.setAttribute("id", "view_gpa_select");
    x.appendChild(b);
  }

  for (let j = 1; j < selElmnt.length; j++) {
    /* For each option in the original select element,
    create a new DIV that will act as an option item: */
    let c;
    if (!(c = document.getElementById(termConverter[j - 1] || "cum"))) {
      c = document.createElement("DIV");
      c.innerHTML = selElmnt.options[j].innerHTML;
      c.id = termConverter[j - 1] || "cum";
    }
    const term = termConverter[parseInt(c.id[1]) || 0];
    const isAccessibleObj = isAccessible(term, includedTerms);
    $(c)
      .removeClass("inaccessible")
      .remove(".tooltiptext")
      .removeAttr("tooltip")
      .removeAttr("tabindex");
    c.removeEventListener("click", listener);

    if (isAccessibleObj.accessible) {
      c.addEventListener("click", listener);
    }
    else {
      $(c)
        .addClass("inaccessible")
        .attr("tooltip", isAccessibleObj.reason)
        .attr("tabindex", 0);

      setup_tooltips();
    }

    b.appendChild(c);
  }
};

let setup_quarter_dropdown = function() {
  $(".gpa_select-selected").html("Current Quarter GPA: " + currentTableData.currentTermData.GPA.percent);
  $("#current").html("Current Quarter GPA: " + currentTableData.currentTermData.GPA.percent);
  document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA: " + currentTableData.currentTermData.GPA.percent;
  document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA: " + currentTableData.currentTermData.GPA.percent;

  $(".gpa_select-items").children().each(function(i, elem) {
      if (i < 5) {//Don't try to get quarter data for the 5th element in the list because that's not a quarter...
          if (i === 0) {
              $(this).html("Current Quarter GPA: " + currentTableData.terms["current"].GPA.percent);
              document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA: " + currentTableData.terms["current"].GPA.percent;
              document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA: " + currentTableData.terms["current"].GPA.percent;
          } else {
              if (!isNaN(currentTableData.terms["q" + i].GPA.percent)) {
                  $(this).html("Q" + i + " GPA: " + currentTableData.terms["q" + i].GPA.percent);
                  document.getElementById('gpa_select').options[i + 1].innerHTML ="Q" + i + " GPA: " + currentTableData.terms["q" + i].GPA.percent;
              } else {
                  $(this).append("Q" + i + " GPA: None");
                  document.getElementById('gpa_select').options[i + 1].innerHTML ="Q" + i + " GPA: None";
              }
          }
      }
  });
};

let tableData_option_onclick = function() {
  if (this.id === "tableData_select-items-import") {
    showModal("import");
    return;
  }

  let index_temp = parseInt(this.id.substring("tableData_select-items-".length))
  currentTableDataIndex =
    isNaN(index_temp) ? currentTableDataIndex : index_temp;
  currentTableData = tableData[currentTableDataIndex];

  /* When an item is clicked, update the original select box,
  and the selected item: */
  let y, i, k, s, h;
  s = this.parentNode.parentNode.getElementsByTagName("select")[0];
  h = this.parentNode.previousSibling;
  for (i = 0; i < s.length; i++) {
    if (s.options[i].innerHTML === this.innerHTML) {
      s.selectedIndex = i;
      h.innerHTML = this.innerHTML;
      y = this.parentNode.getElementsByClassName("tableData_same-as-selected");
      for (k = 0; k < y.length; k++) {
        y[k].removeAttribute("class");
      }
      this.setAttribute("class", "tableData_same-as-selected");
      break;
    }
  }

  // Re-initialize the quarter dropdown with the data from
  // currentTableData
  initialize_quarter_dropdown()
  setup_quarter_dropdown();



  classesTable.setData(currentTableData.currentTermData.classes);
  scheduleTable.setData(currentTableData.schedule.black);

  // Reset clock
  period_names = {black:[], silver:[]};

  // Hide Reports tab for imported data
  if (currentTableData.imported) {
    $("#reports_open").hide();
  }
  else {
    $("#reports_open").show();
  }
  h.click();
}

let initialize_tableData_dropdown = function() {
  let x, i, j, selElmnt, a, b, c;
  /* Look for any elements with the class "tableData_custom-select": */
  x = document.getElementsByClassName("tableData_custom-select");
  for (i = 0; i < x.length; i++) {
    selElmnt = x[i].getElementsByTagName("select")[0];
    /* For each element, create a new DIV that will act as the selected item: */
    a = document.createElement("DIV");
    a.setAttribute("class", "tableData_select-selected select-selected");
    a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
    x[i].appendChild(a);
    /* For each element, create a new DIV that will contain the option list: */
    b = document.createElement("DIV");
    b.setAttribute("class", "tableData_select-items select-items select-hide");
    for (j = 1; j < selElmnt.length; j++) {
      /* For each option in the original select element,
      create a new DIV that will act as an option item: */
      c = document.createElement("DIV");
      c.id = `tableData_select-items-${selElmnt.options[j].value}`;
      c.innerHTML = selElmnt.options[j].innerHTML;
      c.addEventListener("click", tableData_option_onclick);
      b.appendChild(c);
    }
    x[i].appendChild(b);
    a.addEventListener("click", function(e) {
      /* When the select box is clicked, close any other select boxes,
      and open/close the current select box: */
      e.stopPropagation();
      pdf_closeAllSelect(this);
      closeAllSelect();
      this.nextSibling.classList.toggle("select-hide");
      this.classList.toggle("select-arrow-active");
      $('.tableData_select-selected').toggleClass("activated-selected-item");
      $('.tableData_select-items div').toggleClass("activated-select-items");
    });
  }
}

// Initialize the dropdown menu by creating divs around each option
let initialize_dayOfWeek_dropdown = function() {
  let i, selElmnt, a, b, c;
  // Find the day select menu
  selElmnt = document.getElementById("day_custom-select").getElementsByTagName("select")[0];
  // Create a new div for the select menu and assign it a class
  a = document.createElement("DIV");
  a.setAttribute("class", "day_select-selected");
  a.setAttribute("id", "day_select_div");
  document.getElementById("day_custom-select").appendChild(a);
  let weekdays = ["Select Day", "Monday (Silver)", "Tuesday (Black)", "Wednesday", "Thursday (Silver)", "Friday (Black)", "Select Day"];
  a.innerHTML = weekdays[day_of_week];
  // Create a new div to store the option list
  b = document.createElement("DIV");
  b.setAttribute("class", "day_select-items select-hide");
  // Loop through each of the options and add a div for each one
  for (i = 1; i < selElmnt.length; i++) {
    c = document.createElement("DIV");
    c.id = `day_select-items-${selElmnt.options[i].value}`;
    c.innerHTML = selElmnt.options[i].innerHTML;
    c.addEventListener("click", dayOfWeek_onclick);
    b.appendChild(c);
  }
  document.getElementById("day_custom-select").appendChild(b);
  // Close all other select boxes when one is clicked
  a.addEventListener("click", function(e) {
    e.stopPropagation();
    closeAllSelect(this);
    this.nextSibling.classList.toggle("select-hide");
    this.classList.toggle("day_select-arrow-active");
  });
  // Close the select menu when you click outside of it
  document.addEventListener("click", closeAllSelect);
}

// Toggle the schedule when an element in the dropdown is selected
let dayOfWeek_onclick = function() {
  let select = document.getElementById("day_select");
  // Iterate through the select menu and look for the selected option
  for (let i = 0; i < select.length; i++) {
    if (select.options[i].innerHTML === this.innerHTML) {
      // Toggle the schedule for the selected day
      select.selectedIndex = i;
      select.addEventListener("change", schedule_toggle(i));
      // Change the HTML of the select menu to match the day shown
      document.getElementById("day_select_div").innerHTML = this.innerHTML;
      // Hide the other dropdown items when one is selected
      document.getElementsByClassName("day_select-items")[0].classList.add("select-hide");
      // Flip the dropdown arrow
      document.getElementById("day_select_div").classList.toggle("day_select-arrow-active");
      // Update selected_day_of_week
      selected_day_of_week = i;
      break;
    }
  }
}

// To add a tooltip to anything, follow these 3 easy steps
// 1. Make sure the element allows for overflow
// 2. Make sure the element's position is clearly defined as relative or absolute or something
// 3. Give the element the attribute 'tooltip="loreum ipsum dolor sit amet"
// If the tooltip's position needs to be readjusted manually, give it the attribute tooltip-margin.
function setup_tooltips() {

  // Checks if it already has a tooltip
  for (const child of document.querySelectorAll('[tooltip]')) {

    if (child.querySelector('.tooltiptext') === null) {

      // Creates the tooltip
      const node = document.createElement("SPAN")
      
      // Gives it the class
      node.classList.add("tooltiptext")
      
      // Adds the text from the tooltip attribute of the parent to the tooltip
      node.appendChild(document.createTextNode(child.getAttribute("tooltip")))

      // Adds the unfinished node to the parent
      child.appendChild(node)

      let tooltiptext = child.querySelector('.tooltiptext')


      // Set the margin to either be overridden or to be found
      // For clarity, resize-exempt is given to an element so that it knows not to try to resize it again
      if (child.hasAttribute("tooltip-margin")) {
        tooltiptext.style.marginLeft = child.getAttribute("tooltip-margin")
        tooltiptext.classList.add("resize-exempt")

      } else if (tooltiptext.offsetWidth !== 0) {
        tooltiptext.style.marginLeft = `${-tooltiptext.offsetWidth/2}px`
        tooltiptext.classList.add("resize-exempt")
      }

    // If it's trying to set up the margins again because it couldn't do it the first time, it does so here
    } else if (!child.querySelector('.tooltiptext').classList.contains("resize-exempt")) {

      let node = child.querySelector('.tooltiptext')

      if (node.offsetWidth !== 0) {
        node.style.marginLeft = `${-node.offsetWidth/2}px`
        node.classList.add("resize-exempt")
      }
    }
  }
}

let toggle_fullscreen_icon = function() {
  if ($('#expand-pdf-icon i').hasClass('fa-expand-alt')) {
    $('#expand-pdf-icon i').removeClass("fa-expand-alt").addClass("fa-compress-alt");
    $('#expand-pdf-icon .tooltiptext').attr('style', $('#expand-pdf-icon .tooltiptext').attr('style').replace("margin-left: -92px;", "margin-left: -95px;")).replace_text("Exit Fullscreen")

  } else {
    $('#expand-pdf-icon i').removeClass("fa-compress-alt").addClass("fa-expand-alt");
    $('#expand-pdf-icon .tooltiptext').attr('style', $('#expand-pdf-icon .tooltiptext').attr('style').replace("margin-left: -95px;", "margin-left: -92px;")).replace_text("Go Fullscreen")

  }
}

let toggle_fullscreen_pdf = function() {
  let elem = document.getElementById('reports');

  console.log("Fullscreen Activate");
  if (!document.isFullScreen && !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
      toggle_fullscreen_icon();

    } else if (elem.mozRequestFullScreen) { /* Firefox */
      elem.mozRequestFullScreen();
      toggle_fullscreen_icon();

    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      let new_height = $(window).height();
      elem.webkitRequestFullscreen();
      toggle_fullscreen_icon();

    } else if (elem.msRequestFullscreen) { /* IE/Edge */
      elem.msRequestFullscreen();
      toggle_fullscreen_icon();

    }
  } else {

    if (document.exitFullscreen) {
      document.exitFullscreen();
      toggle_fullscreen_icon();

    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();
      toggle_fullscreen_icon();

    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
      toggle_fullscreen_icon();

    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();
      toggle_fullscreen_icon();

    }
  }
}


function parseTableData(classes) {
  for (let i = 0; i < classes.length; i++) {

    //initialize every the edited key for every class and set it to false
    classes[i].edited = false;

    //initialize category grades which will be used for the categoryGrades table
    classes[i].categoryGrades = {};

    //determine the number of decimal places each class uses in Aspen so that Aspine can maintain consistency
    if (!isNaN(parseFloat(classes[i].grade))) {
      classes[i].decimals = parseFloat(classes[i].grade).countDecimals();
    }


    //cycle through each assignment of every class for further parsing
    for (let j = 0; j < (classes[i].assignments || []).length; j++) {
      //initialize the percentage of the assignment.
      classes[i].assignments[j].percentage = Math.round(classes[i].assignments[j].score / classes[i].assignments[j].max_score * 1000) / 10;
      //initialize how the assignment should be colored in the table; based on percentage
      classes[i].assignments[j].color = getColor(classes[i].assignments[j].percentage);

      //an if statement to handle assignments without a score
      if (isNaN(classes[i].assignments[j].score)) {
        //an if statement to handle assignments with a special characteristic
        if (classes[i].assignments[j].special) {

          //an if statement to handle assignments with a special characteristic that includes a left and right parenthesis.
          if (("" + classes[i].assignments[j].special).includes("(") && ("" + classes[i].assignments[j].special).includes(")")) {
            // a reg expression to extract only the information from between the parenthesis.
            let regExp = /\(([^)]+)\)/;

            classes[i].assignments[j].score = (regExp.exec(classes[i].assignments[j].special))[1];
            classes[i].assignments[j].max_score = (regExp.exec(classes[i].assignments[j].special))[1];
          } else {
            // if no parenthesis, set it equal to special in its entirety
            classes[i].assignments[j].score = classes[i].assignments[j].special;
            classes[i].assignments[j].max_score = classes[i].assignments[j].special;

          }
        } else {
          // if no special and no grade, set score and max_score to ungraded
          classes[i].assignments[j].score = "Ungraded";
          classes[i].assignments[j].max_score = "Ungraded";

        }
      }
    }

    //initializing a calculated_grade for classes with a grade
    if (classes[i].grade != "") {

      let computingClassData = classes[i];

      //getting calculated values related to classes
      let gradeInfo = determineGradeType(computingClassData.assignments, computingClassData.categories, computingClassData.grade);
      //populating categoryDisplay which is the object used to display the category grading information
      classes[i].categoryDisplay = getCategoryDisplay(gradeInfo, computingClassData);

      //setting grading type. Total vs. category
      classes[i].type = gradeInfo.type;

      //setting calculated_grade and initcalcGrade
      classes[i].init_calculated_grade = gradeInfo.categoryPercent;

      classes[i].calculated_grade = computeGrade(computingClassData.assignments, computingClassData.categories, computingClassData.decimals, computingClassData.init_calculated_grade, computingClassData.grade).categoryPercent;

      //setting how the class should be colored in the classes table.
      classes[i].color = getColor(classes[i].calculated_grade);
    }
  }
  currentTableData.currentTermData.classes = classes;
  let GPA = computeGPA(currentTableData.currentTermData.classes);
  let calcGPA = computeGPA(currentTableData.currentTermData.classes);
  return {
    classes,
    GPA,
    calcGPA
  };
}
let anyEdited = function() {
  let termsEdited = (currentTableData.terms[currentTerm].classes).map(function(currentValue, index, array) {
    return currentValue.edited
  });
  let finalDecision = false;
  termsEdited.forEach(function(editedMaybe) {
    if (editedMaybe === true) {
      finalDecision = true;
    }
  });
  return finalDecision;
}

/*
 * Returns an object containing whether or not a term is 'accessible',
 * and if not, a reason for inaccessibility.
 * A term is accessible if its data are available in currentTableData
 * or can be retrieved from Aspen.
 *
 * includedTerms is an optional parameter which contains the terms
 * included in an import (in the case that currentTableData is imported
 * and not all of the terms' data have been put into currentTableData)
 */
let isAccessible = function(term, includedTerms) {
  // Always keep the current term as 'accessible', even if there are no grades
  // on Aspen
  if (term === "current") {
    return { accessible: true, reason: "" };
  }

  // Boolean storing whether or not this term is 'accessible'
  let accessible = true;
  // Reason for term being inaccessible
  let reason = "";
  // If no GPA is available for the term, it is inaccessible
  // (the term was not included in Aspen's overview)
  if (!currentTableData.terms[term].GPA.percent) {
    accessible = false;
    reason = "This term is not available on Aspen.";
  }
  // If currentTableData is imported, we cannot scrape Aspen
  // for more data, so any terms not included in the import
  // are inaccessible
  if (
    currentTableData.imported &&
    (
      (includedTerms && !includedTerms[term]) ||
      !currentTableData.terms[term].classes
    )
  ) {
    accessible = false;
    reason = "This term is not included in the imported data.";
  }

  return {
    accessible: accessible,
    reason: reason
  };
}
