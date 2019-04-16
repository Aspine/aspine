
let vip_username_list = ["8006214", "8001874"];
// Cole: 8006697
// Max: 2109723

Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0; 
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

let addAssignmentFormatter = function(value, data, cell, row, options) {
	return "<i class=\"fa fa-plus grades\"aria-hidden=\"true\"></i>";
};

let statInfoFormatter = function(cell, formatterParams) {

	if (!isNaN(cell.getRow().getData().score)) {
		return "<i class=\"fa fa-info\"aria-hidden=\"true\"></i>";
	}
}

let statInfoHeaderFormatter = function(value, data, cell, row, options) {
	return "<i class=\"fa fa-info-circle\"aria-hidden=\"true\"></i>";
}

let getAttendanceEvent = function(value, data, cell, row, options) {
	return "Absent";
};
let hideCategoriesFormatter = function(value, data, cell, row, options) {
	return "<i class=\"fa fa-eye-slash\"aria-hidden=\"true\"></i>";
};
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
  if (vip_username_list.includes(tableData.username)) {
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

function getLightColor(gradeToBeColored) {
  if (vip_username_list.includes(tableData.username)) {
    return "#1E8541";
  }

	if (parseFloat(gradeToBeColored) >= 89.5) {
		return "#99ff66";
	} else if (parseFloat(gradeToBeColored) >= 79.5) {
		return "#66ccff";
	} else if (parseFloat(gradeToBeColored) >= 69.5) {
		return "#ffff66";
	} else if (parseFloat(gradeToBeColored) >= 59.5) {
		return "#ff8533";
	} else if (parseFloat(gradeToBeColored) >= 0) {
		return "#ff4d4d";
	} else {
		return "black";
	}
}

let classesRowFormatter = function(cell, formatterParams) {
	let rowColor = cell.getRow().getData().color;

	let value = cell.getValue();

  if (vip_username_list.includes(tableData.username)) {
			return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + value + "</span>";
  }

	if (rowColor === "black") {
		return value;
	} else {
		return "<span style='color:" + rowColor + "; font-weight:bold;'>" + value + "</span>";
	}


}

let rowFormatter = function(cell, formatterParams) {
	let numberGrade = parseFloat(cell.getValue());
	let rowColor = cell.getRow().getData().color;

	let value = cell.getValue();

  if (vip_username_list.includes(tableData.username)) {
			return "<span style='background: -webkit-linear-gradient(left, red, orange, green, blue, purple);-webkit-background-clip: text; -webkit-text-fill-color:transparent; font-weight:bold;'>" + value + "</span>";
  }

	if (rowColor === "black") {
		return value;
	} else {
		return "<span style='color:" + rowColor + "; font-weight:bold;'>" + value + "</span>";
	}
}

let weightFormatter = function(cell, formatterParams) {
	let value = cell.getValue();
	let rowColor = cell.getRow().getData().color;

  if (value.indexOf(".") != -1) {
    value = value.substring(0, value.indexOf(".") + 2) + "%";
  }

  if (vip_username_list.includes(tableData.username)) {
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

	  if (vip_username_list.includes(tableData.username)) {
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
      if (vip_username_list.includes(tableData.username)) {
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
let generate_pdf = function(index) {
  if (!pdfrendering) {
    pdfrendering = true;
    let adjustedHeight = $(window).height() - 280;
    if (!document.isFullScreen && !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
      $('#pdf-container').css('height', adjustedHeight + 'px');
    } else {
      $('#pdf-container').css('height', $(window).height() + 'px');
    }

    let pdfInitParams = {"data": ((tableData.pdf_files)[index]).content};
    let loadingTask = pdfjsLib.getDocument(pdfInitParams);
    loadingTask.promise.then(function(pdf) {
      let pageNumber = 1;

      pdf.getPage(pageNumber).then(function(page) {

        scale = 1

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

        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        var renderTask = page.render(renderContext);
        renderTask.promise.then(function () {
          pdfrendering = false;
        });

      });

    }, function (reason) {
      console.error(reason);
    });
  }
}

let zoom_in_pdf = function() {
  if (!pdfrendering) {
    pdfrendering = true;
    let pdfInitParams = {"data": (tableData.pdf_files)[0].content};
    let loadingTask = pdfjsLib.getDocument(pdfInitParams);
    loadingTask.promise.then(function(pdf) {
      let pageNumber = 1;

      pdf.getPage(pageNumber).then(function(page) {

        adjustedScale += 0.1;

        viewport = page.getViewport({"scale": adjustedScale});

        let canvas = document.getElementById('pdf-canvas');
        let context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        var renderTask = page.render(renderContext);
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
    let pdfInitParams = {"data": (tableData.pdf_files)[0].content};
    let loadingTask = pdfjsLib.getDocument(pdfInitParams);
    loadingTask.promise.then(function(pdf) {
      let pageNumber = 1;

      pdf.getPage(pageNumber).then(function(page) {

        adjustedScale -= 0.1;

        viewport = page.getViewport({"scale": adjustedScale});


        let canvas = document.getElementById('pdf-canvas');
        let context = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        var renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        var renderTask = page.render(renderContext);
        renderTask.promise.then(function () {
          pdfrendering = false;
        });

      });

    }, function (reason) {
      console.error(reason);
    });
  }
}


function closeAllSelect(elmnt) {
  /* A function that will close all select boxes in the document,
  except the current select box: */
  var x, y, i, arrNo = [];
  x = document.getElementsByClassName("select-items");
  y = document.getElementsByClassName("select-selected");
  for (i = 0; i < y.length; i++) {
    if (elmnt == y[i]) {
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
}

//pdf dropdown stuff
let initialize_dropdown = function() {      

    //let o = new Option(tableData.pdf_files[i].title, i);
    ///// jquerify the DOM object 'o' so we can use the html method
    //$(o).html(tableData.pdf_files[i].title);
    //$("#pdf-select").append(o);

  for (let i = 1; i < tableData.pdf_files.length + 1; i++) {
    if (i == 1) {
      let o = new Option(tableData.pdf_files[i - 1].title, 0);
      /// jquerify the DOM object 'o' so we can use the html method
      $(o).html(tableData.pdf_files[i - 1].title);
      $("#pdf-select").append(o);
    }

    let o = new Option(tableData.pdf_files[i - 1].title, i);
    /// jquerify the DOM object 'o' so we can use the html method
    $(o).html(tableData.pdf_files[i - 1].title);
    $("#pdf-select").append(o);

  }
  
  let x, i, j, selElmnt, a, b, c;
  /* Look for any elements with the class "custom-select": */
  x = document.getElementsByClassName("custom-select");
  for (i = 0; i < x.length; i++) {
    selElmnt = x[i].getElementsByTagName("select")[0];
    /* For each element, create a new DIV that will act as the selected item: */
    a = document.createElement("DIV");
    a.setAttribute("class", "select-selected");
    a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
    x[i].appendChild(a);
    /* For each element, create a new DIV that will contain the option list: */
    b = document.createElement("DIV");
    b.setAttribute("class", "select-items select-hide");
    for (j = 1; j < selElmnt.length; j++) {
      /* For each option in the original select element,
        create a new DIV that will act as an option item: */
      c = document.createElement("DIV");
      c.innerHTML = selElmnt.options[j].innerHTML;
      c.addEventListener("click", function(e) {
        /* When an item is clicked, update the original select box,
            and the selected item: */
        var y, i, k, s, h;
        s = this.parentNode.parentNode.getElementsByTagName("select")[0];
        h = this.parentNode.previousSibling;
        for (i = 0; i < s.length; i++) {
          if (s.options[i].innerHTML == this.innerHTML) {
            if (i == 0) {
              pdf_index = i;
              generate_pdf(i);

            } else {
              pdf_index = i - 1;
              generate_pdf(i - 1);
            }
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
        h.click();
      });
      b.appendChild(c);
    }
    x[i].appendChild(b);
    a.addEventListener("click", function(e) {
      /* When the select box is clicked, close any other select boxes,
        and open/close the current select box: */
      e.stopPropagation();
      closeAllSelect(this);
      this.nextSibling.classList.toggle("select-hide");
      this.classList.toggle("select-arrow-active");
    });
  }
};

let toggle_fullscreen_pdf = function() {
  let elem = document.getElementById('reports'); 

  console.log("attempting fullscreen");
if (!document.isFullScreen && !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();

      $('#expand-pdf-icon').html("<i class=\"fa fa-compress\" aria-hidden=\"true\"></i>");
    } else if (elem.mozRequestFullScreen) { /* Firefox */
      elem.mozRequestFullScreen();

      $('#expand-pdf-icon').html("<i class=\"fa fa-compress\" aria-hidden=\"true\"></i>");
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
    let new_height = $(window).height();
      elem.webkitRequestFullscreen();

      $('#expand-pdf-icon').html("<i class=\"fa fa-compress\" aria-hidden=\"true\"></i>");
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
      elem.msRequestFullscreen();

      $('#expand-pdf-icon').html("<i class=\"fa fa-compress\" aria-hidden=\"true\"></i>");
    }
  } else { 

    if (document.exitFullscreen) {
      document.exitFullscreen();

      $('#expand-pdf-icon').html("<i class=\"fa fa-expand\" aria-hidden=\"true\"></i>");
    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();

      $('#expand-pdf-icon').html("<i class=\"fa fa-expand\" aria-hidden=\"true\"></i>");
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();

      $('#expand-pdf-icon').html("<i class=\"fa fa-expand\" aria-hidden=\"true\"></i>");
    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();

      $('#expand-pdf-icon').html("<i class=\"fa fa-expand\" aria-hidden=\"true\"></i>");
    }
  }
}
