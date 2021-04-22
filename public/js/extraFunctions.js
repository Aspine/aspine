
let vip_username_list = ["8006214", "8001874"];
// Cole: 8006697
// Tyler: 8006696
// Max: 2109723

Number.prototype.countDecimals = function () {
    if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
    return this.toString().split(".")[1].length || 0;
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

// Switch terms
// callback is a function to run once the data have been loaded
let listener = function({ target }, callback = () => {}) {
  /* When an item is clicked, update the original select box,
  and the selected item: */

  if (term_dropdown_active) {
    let y, i, k, s, h;
    s = target.parentNode.parentNode.getElementsByTagName("select")[0];
    h = target.parentNode.previousSibling;
    for (i = 0; i < s.length; i++) {
      // Make sure to get just the option text, without any tooltips or
      // tooltip text
      if (s.options[i].childNodes[0].nodeValue
          === target.childNodes[0].nodeValue) {
        if (i === 0) {
          currentTerm = termConverter[i];
        } else {
          currentTerm = termConverter[i - 1];
        }

        if (i === 0) $("#mostRecentDiv").show();
        else $("#mostRecentDiv").hide();

        if (typeof currentTableData.terms === 'undefined') {
          currentTableData.terms = {
            current: {},
            q1: {},
            q2: {},
            q3: {},
            q4: {},
          };

          // For the previous year (where there is no "current" quarter),
          // prepopulate the GPA object with dummy data
          if (currentTableData.type === "previous") {
            currentTableData.terms.current.GPA = {
              percent: NaN, outOfFour: NaN, outOfFive: NaN,
            };
          }
        }

        if (typeof currentTableData.currentTermData === 'undefined') {
          currentTableData.currentTermData = {};
        }

        if (typeof currentTableData.terms[currentTerm].classes === 'undefined') {
          // if (anyEdited()) {
          // $(".gpa_select-selected").css('padding', "5px 16px 5px 16px");
          // } else {
          $(".gpa_select-selected").css("padding", "13px 16px 13px 16px");
          // }

          term_dropdown_active = false;

          const year = currentTableDataIndex === 0 ? "current" : "previous";
          fetch("/data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ quarter: i - 1, year: year }),
          }).then(async res => {
            responseCallbackPartial(await res.json());
            callback();
          });

          $("#loader").show();
          $("#classesTable").hide();
          $("#assignmentsTable").hide(); //;.setData(tableData[i].assignments);
          $("#categoriesTable").hide(); //;.setData(tableData[i].assignments);

          s.selectedIndex = i;
          h.innerHTML = target.innerHTML;
          y = target.parentNode.getElementsByClassName("same-as-selected");
          for (k = 0; k < y.length; k++) {
            y[k].removeAttribute("class");
          }
          target.setAttribute("class", "same-as-selected");
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
          h.innerHTML = target.innerHTML;
          y = target.parentNode.getElementsByClassName("same-as-selected");
          for (k = 0; k < y.length; k++) {
            y[k].removeAttribute("class");
          }
          target.setAttribute("class", "same-as-selected");

          callback();
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

    let accessible, reason;
    if (c.id === "cum") {
      accessible = true;
      reason = "";
    } else {
      const term = termConverter[parseInt(c.id[1]) || 0];
      ({ accessible, reason } = isAccessible(term, includedTerms));
    }

    $(c)
      .removeClass("inaccessible")
      .remove(".tooltiptext")
      .removeAttr("tooltip")
      .removeAttr("tabindex");
    c.removeEventListener("click", listener);

    if (accessible) {
      c.addEventListener("click", listener);
    } else {
      $(c)
        .addClass("inaccessible")
        .attr("tooltip", reason)
        .attr("tabindex", 0);
      setup_tooltips();
    }

    b.appendChild(c);
  }
};

let setup_quarter_dropdown = function() {
  // Set up "current quarter" entry
  if (!isNaN(currentTableData.terms.current.GPA.percent)) {
    document.querySelector("#current").textContent
      = document.querySelector("#init_gpa").textContent
      = document.querySelector("#current_gpa").textContent
      = "Current Quarter GPA: " + currentTableData.currentTermData.GPA.percent;
  } else {
    document.querySelector("#current").textContent
      = document.querySelector("#init_gpa").textContent
      = document.querySelector("#current_gpa").textContent
      = "Current Quarter GPA: None";
  }

  // Set up the four quarters
  for (const term of termConverter) {
    // We already set up the current quarter; this is only for Q1 to Q4
    if (!/q\d/.test(term))
      continue;
    if (!isNaN(currentTableData.terms[term].GPA.percent)) {
      document.querySelector(`#${term}`).textContent
        = document.querySelector(`#${term}_gpa`).textContent
        = `Q${term[1]} GPA: ${currentTableData.terms[term].GPA.percent}`;
    } else {
      document.querySelector(`#${term}`).textContent
        = document.querySelector(`#${term}_gpa`).textContent
        = `Q${term[1]} GPA: None`;
    }
  }

  // Set up cumulative GPA
  document.querySelector("#cum").textContent
    = document.querySelector("#cum_gpa").textContent
    = `Cumulative GPA: ${currentTableData.cumGPA.percent}`;

  // Set text for currently selected quarter to be that of the corresponding
  // option
  document.querySelector(".gpa_select-selected").textContent
    = document.querySelector("#gpa_select")
      .options[termConverter.indexOf(currentTerm) + 1].textContent;
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

  // Get the term that we want to select (the currently selected term might no
  // longer exist due to switching currentTableData)
  let selTerm = "current";
  switch (currentTableData.type) {
    case "current":
      // Assume that the current quarter of the current year has already been
      // loaded (because we are coming back to the current year from another
      // year)
      selTerm = "current";
      break;
    case "previous":
      // Q1 must be available; there is no "current quarter" in the previous
      // year
      selTerm = "q1";
      break;
    case "imported":
      // Get the first term included in the imported data
      for (term of termConverter) {
        if (currentTableData.terms[term]
            && currentTableData.terms[term].GPA
            && !isNaN(currentTableData.terms[term].GPA.percent)) {
          selTerm = term;
          break;
        }
      }
      break;
    default:
      console.error(`Invalid currentTableData type ${currentTableData.type}`);
  }
  // Switch to this term
  listener({ target: document.getElementById(selTerm) }, () => {
    // Re-initialize the quarter dropdown with the data from
    // currentTableData
    // (this needs to be done *after* the data have been loaded, in the case
    // that the data have not yet been loaded)
    initialize_quarter_dropdown();
    setup_quarter_dropdown();
  });

  if (currentTableData.type === "previous") {
    // Transfer schedule and reports from current year to previous year
    if (!currentTableData.schedule)
      currentTableData.schedule = tableData[0].schedule;
    if (!currentTableData.pdf_files)
      currentTableData.pdf_files = tableData[0].pdf_files;
  } else if (currentTableData.type === "current") {
    // Transfer schedule and reports from previous year to current year
    // (if they were first loaded while on previous year)
    if (!currentTableData.schedule)
      currentTableData.schedule = tableData[1].schedule;
    if (!currentTableData.pdf_files)
      currentTableData.pdf_files = tableData[1].pdf_files;
  }

  // Keep Schedule tab in sync
  update_formattedSchedule();
  scheduleTable.setData(currentTableData.formattedSchedule);
  redraw_clock();

  // Reset clock
  period_names = {black:[], silver:[]};

  // Hide Reports tab for imported data
  if (currentTableData.imported || currentTableData.type === "imported") {
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
  // Deal with slow loading / weird edge cases
  if (day_of_week < 0 || day_of_week === undefined) {
    a.innerHTML = "Select Day";
  } else {
    a.innerHTML = weekdays[day_of_week];
  }
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
  // Close the select menu when you click outside of it, and flip the dropdown arrow
  document.addEventListener("click", function() {
    document.getElementsByClassName("day_select-items")[0].classList.add("select-hide");
    document.getElementById("day_select_div").classList.remove("day_select-arrow-active");
  });
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
      document.getElementById("day_select_div").classList.remove("day_select-arrow-active");
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

function parseTableData({ classes, quarter_oid }) {
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
    calcGPA,
    quarter_oid,
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
  // For the previous year, all four quarters should be accessible
  if (currentTableData.type === "previous") {
    if (term.startsWith("q")) {
      return { accessible: true, reason: "" };
    } else {
      return {
        accessible: false,
        reason: "There is no current quarter for the previous year.",
      };
    }
  }

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
    (
      currentTableData.imported || /* backwards compatibility */
      currentTableData.type === "imported"
    ) &&
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
