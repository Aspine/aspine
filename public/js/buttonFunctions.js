let newAssignment = function() {

  currentTableData.currentTermData.classes[selected_class_i].edited = true;

  if (!isNaN(selected_class_i)) {

    currentTableData.currentTermData.classes[selected_class_i].assignments.unshift({
      "name": "Assignment",
      "category": Object.keys(currentTableData.currentTermData.classes[selected_class_i].categories)[currentFilterRow >= 0 ? currentFilterRow : 0],
      "score": 10,
      "max_score": 10,
      "percentage": 100,
      "color": "green",
      "synthetic": "true",
    });

    updateGradePage();

  }
}


let editAssignment = function(data) {

  currentTableData.currentTermData.classes[selected_class_i].edited = true;

  currentTableData.currentTermData.classes[selected_class_i].assignments = data.slice();


  for (let j = 0; j < currentTableData.currentTermData.classes[selected_class_i].assignments.length; j++) {
    currentTableData.currentTermData.classes[selected_class_i].assignments[j].percentage = Math.round(currentTableData.currentTermData.classes[selected_class_i].assignments[j].score / currentTableData.currentTermData.classes[selected_class_i].assignments[j].max_score * 1000) / 10;
    currentTableData.currentTermData.classes[selected_class_i].assignments[j].color = getColor(currentTableData.currentTermData.classes[selected_class_i].assignments[j].percentage);

    if (currentTableData.currentTermData.classes[selected_class_i].assignments[j].category.includes("(")) {
      currentTableData.currentTermData.classes[selected_class_i].assignments[j].category = currentTableData.currentTermData.classes[selected_class_i].assignments[j].category.substring(0, currentTableData.currentTermData.classes[selected_class_i].assignments[j].category.indexOf("(") - 1);
    }


    if (isNaN(currentTableData.currentTermData.classes[selected_class_i].assignments[j].score) || currentTableData.currentTermData.classes[selected_class_i].assignments[j].score === "") {
      currentTableData.currentTermData.classes[selected_class_i].assignments[j].score = "None";
    }


    if (isNaN(currentTableData.currentTermData.classes[selected_class_i].assignments[j].max_score) || currentTableData.currentTermData.classes[selected_class_i].assignments[j].max_score === "") {
      currentTableData.currentTermData.classes[selected_class_i].assignments[j].max_score = "None";
    }
  }

  updateGradePage();


}

let resetTableData = function() {

  //tableData.currentTermData.classes[selected_class_i].edited = false;
  currentTableData.terms[currentTerm] = JSON.parse(JSON.stringify(termsReset[currentTerm]));
  currentTableData.currentTermData = currentTableData.terms[currentTerm];
  if (selected_class_i) {
    assignmentsTable.setData(currentTableData.currentTermData.classes[selected_class_i].assignments);
    categoriesTable.setData(currentTableData.currentTermData.classes[selected_class_i].categoryDisplay);
  }
  classesTable.setData(currentTableData.currentTermData.classes);

  currentTableData.currentTermData.calcGPA = computeGPA(currentTableData.currentTermData.classes);
  let GPA = currentTableData.terms[currentTerm].GPA;
  let calcGPA = currentTableData.terms[currentTerm].calcGPA;

  if (anyEdited()) {
    //fix the editing system in the if statement above to be true if any of the classes are edited
    if (currentTerm === "current") {
      $(".gpa_select-selected").css('padding', "5px 16px 5px 16px");
      $(".gpa_select-selected").html("Current Quarter GPA: " + GPA.percent + "<br>Calculated GPA: " + calcGPA.percent);
      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Current Quarter GPA: "  + GPA.percent + "<br>Calculated GPA: " + calcGPA.percent);
      document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA: "  + GPA.percent + "<br>Calculated GPA: " + calcGPA.percent;
      document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA: "  + GPA.percent + "<br>Calculated GPA: " + calcGPA.percent;

    } else {
      currentTableData.currentTermData.calcGPA = computeGPA(currentTableData.currentTermData.classes);




      $(".gpa_select-selected").css('padding', "5px 16px 5px 16px");
      $(".gpa_select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA.percent + "<br>Calculated GPA: " + calcGPA.percent);

      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA.percent + "<br>Calculated GPA: " + calcGPA.percent);
      document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML = "Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA.percent + "<br>Calculated GPA: " + calcGPA.percent;
    }
  } else {
    if (currentTerm ==="current") {
      $(".gpa_select-selected").css("padding", "13px 16px 13px 16px");
      $(".gpa_select-selected").html("Current Quarter GPA: " + GPA.percent);

      $("#" + currentTerm).css("padding", "13px 16px 13px 16px");
      $("#" + currentTerm).html("Current Quarter GPA: "  + GPA.percent);
      document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA: "  + GPA.percent;
      document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA: "  + GPA.percent;

    } else {
      $(".gpa_select-selected").css("padding", "13px 16px 13px 16px");
      $(".gpa_select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA.percent);

      $("#" + currentTerm).css("padding", "13px 16px 13px 16px");
      $("#" + currentTerm).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA.percent);
      document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML = "Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA.percent;
    }
  }
  $("#assignmentsTable").hide(); //;.setData(tableData[i].assignments);
  $("#categoriesTable").hide(); //;.setData(tableData[i].assignments);
}

let hideCategoriesTable = function() {
  document.getElementById("categoriesTable").style.display = "none";
}

let updateGradePage = function() {
  let computingClassData = currentTableData.currentTermData.classes[selected_class_i];

  let gradeInfo = (computeGrade(computingClassData.assignments, computingClassData.categories, computingClassData.decimals, computingClassData.init_calculated_grade, computingClassData.grade));

  currentTableData.currentTermData.classes[selected_class_i].calculated_grade = gradeInfo[computingClassData.type];

  currentTableData.currentTermData.classes[selected_class_i].categoryDisplay = getCategoryDisplay(gradeInfo, computingClassData);

  classesTable.replaceData(currentTableData.currentTermData.classes);
  categoriesTable.setData(currentTableData.currentTermData.classes[selected_class_i].categoryDisplay);

  assignmentsTable.replaceData(currentTableData.currentTermData.classes[selected_class_i].assignments);

  currentTableData.currentTermData.calcGPA = computeGPA(currentTableData.currentTermData.classes);
  currentTableData.terms[currentTerm].calcGPA = computeGPA(currentTableData.currentTermData.classes);

  let GPA = currentTableData.terms[currentTerm].GPA;
  let calcGPA = currentTableData.terms[currentTerm].calcGPA;

  if (anyEdited()) {
    //fix the editing system in the if statement above to be true if any of the classes are edited
    $(".gpa_select-selected").css('padding', "5px 16px 5px 16px");

    let selectedElem = $(".gpa_select-selected");

    let quarterData = currentTableData.terms[currentTerm];
    let quarterName;

    if (currentTerm === "current") {
      quarterName = "Current Quarter";
    }
    else {
      quarterName = "Q" + termConverter.indexOf(currentTerm);
    }


    if (selectedElem.html().includes("GPA")) {
      if (quarterData.GPA.percent !== quarterData.calcGPA.percent) {
        $("#current, #current_gpa, #init_gpa").html(
          "Current Quarter GPA: " + currentTableData.terms.current.GPA.percent.toFixed(2) +
          "<br> Calculated: " + currentTableData.terms.current.calcGPA.percent.toFixed(2)
        );
        for (let i = 1; i <= 4; i++) {
          $(`#q${i}, #q${i}_gpa`).html(
            "Q" + i + " GPA: " + currentTableData.terms["q" + i].GPA.percent.toFixed(2) +
            (currentTableData.terms["q" + i].calcGPA ? (
              "<br> Calculated: " + currentTableData.terms["q" + i].calcGPA.percent.toFixed(2)
            ) : "")
          );
        }
        selectedElem.html(
          quarterName + " GPA: " + quarterData.GPA.percent.toFixed(2) +
          "<br> Calculated: " + quarterData.calcGPA.percent.toFixed(2)
        );
        $("#cum, #cum_gpa").html(
          "Cumulative GPA: " + currentTableData.cumGPA.percent.toFixed(2)
        );
      }
      else {
        $("#current, #current_gpa, #init_gpa").html(
          "Current Quarter GPA: " + currentTableData.terms.current.GPA.percent.toFixed(2)
        );
        for (let i = 1; i <= 4; i++) {
          $(`#q${i}, #q${i}_gpa`).html(
            "Q" + i + " GPA: " + currentTableData.terms["q" + i].GPA.percent.toFixed(2)
          );
        }
        selectedElem.html(
          quarterName + " GPA: " + quarterData.GPA.percent.toFixed(2)
        );
        $("#cum, #cum_gpa").html(
          "Cumulative GPA: " + currentTableData.cumGPA.percent.toFixed(2)
        );
      }
    }
    else if (selectedElem.html().includes("Unweighted")) {
      if (quarterData.GPA.outOfFour !== quarterData.calcGPA.outOfFour) {
        $("#current, #current_gpa, #init_gpa").html(
          "Current Quarter Unweighted: " + currentTableData.terms.current.GPA.outOfFour.toFixed(2) +
          "<br> Calculated: " + currentTableData.terms.current.calcGPA.outOfFour.toFixed(2)
        );
        for (let i = 1; i <= 4; i++) {
          $(`#q${i}, #q${i}_gpa`).html(
            "Q" + i + " Unweighted: " + currentTableData.terms["q" + i].GPA.outOfFour.toFixed(2) +
            (currentTableData.terms["q" + i].calcGPA ? (
              "<br> Calculated: " + currentTableData.terms["q" + i].calcGPA.outOfFour.toFixed(2)
              ) : "")
          );
        }
        selectedElem.html(
          quarterName + " Unweighted: " + quarterData.GPA.outOfFour.toFixed(2) +
          "<br> Calculated: " + quarterData.calcGPA.outOfFour.toFixed(2)
        );
        $("#cum, #cum_gpa").html(
          "Cumulative Unweighted: " + currentTableData.cumGPA.outOfFour.toFixed(2)
        );
      }
      else {
        $("#current, #current_gpa, #init_gpa").html(
          "Current Quarter Unweighted: " + currentTableData.terms.current.GPA.outOfFour.toFixed(2)
        );
        for (let i = 1; i <= 4; i++) {
          $(`#q${i}, #q${i}_gpa`).html(
            "Q" + i + " Unweighted: " + currentTableData.terms["q" + i].GPA.outOfFour.toFixed(2)
            );
        }
        selectedElem.html(
          quarterName + " Unweighted: " + quarterData.GPA.outOfFour.toFixed(2)
        );
        $("#cum, #cum_gpa").html(
          "Cumulative Unweighted: " + currentTableData.cumGPA.outOfFour.toFixed(2)
        );
      }
    }
    else if (selectedElem.html().includes("Weighted")) {
      if (quarterData.GPA.outOfFive != quarterData.calcGPA.outOfFive) {
        $("#current, #current_gpa, #init_gpa").html(
          "Current Quarter Weighted: " + currentTableData.terms.current.GPA.outOfFive.toFixed(2) +
          "<br> Calculated: " + currentTableData.terms.current.calcGPA.outOfFive.toFixed(2)
        );
        for (let i = 1; i <= 4; i++) {
          $(`#q${i}, #q${i}_gpa`).html(
            "Q" + i + " Weighted: " + currentTableData.terms["q" + i].GPA.outOfFive.toFixed(2) +
            (currentTableData.terms["q" + i].calcGPA ? (
              "<br> Calculated: " + currentTableData.terms["q" + i].calcGPA.outOfFive.toFixed(2)
              ) : "")
          );
        }
        selectedElem.html(
          quarterName + " Weighted: " + quarterData.GPA.outOfFive.toFixed(2) +
          "<br> Calculated: " + quarterData.calcGPA.outOfFive.toFixed(2)
        );
        $("#cum, #cum_gpa").html(
          "Cumulative Weighted: " + currentTableData.cumGPA.outOfFive.toFixed(2)
        );
      }
      else {
        $("#current, #current_gpa, #init_gpa").html(
          "Current Quarter Weighted: " + currentTableData.terms.current.GPA.outOfFive.toFixed(2)
        );
        for (let i = 1; i <= 4; i++) {
          $(`#q${i}, #q${i}_gpa`).html(
            "Q" + i + " Weighted: " + currentTableData.terms["q" + i].GPA.outOfFive.toFixed(2)
          );
        }
        selectedElem.html(
          quarterName + " Weighted: " + quarterData.GPA.outOfFive.toFixed(2)
        );
        $("#cum, #cum_gpa").html(
          "Cumulative Weighted: " + currentTableData.cumGPA.outOfFive.toFixed(2)
        );
      }
    }

    //document.getElementById("GPA").style.padding = "3.5px 16px 3.5px 16px";
    //+ " <i class=\"fa fa-sync-alt\" aria-hidden=\"true\"></i>"
    //document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA + "<br>Calculated GPA: " + tableData.calcGPA + " <i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>";
  } else {
    $(".gpa_select-selected").css("padding", "13px 16px 13px 16px");
    $("#" + currentTerm).css("padding", "13px 16px 13px 16px");

    $(".gpa_select-selected").html("Quarter GPA: " + GPA.percent);
    $("#" + currentTerm).html("Quarter GPA: " + GPA.percent);
  }
}

let exportTableData = async function(prefs) {
  resetTableData();

  let obj = {};

//#ifndef lite
  obj.version = await $.ajax("/version");
//#endif

//#ifdef lite
/*
  obj.version = (
//#include version
  );
*/
//#endif

  obj.username = currentTableData.username;
  obj.overview = currentTableData.overview;

  if (prefs.recent) obj.recent = currentTableData.recent;
  if (prefs.schedule) obj.schedule = currentTableData.schedule;
  if (prefs.terms) {
    const origCurrentTerm = currentTerm;
    try {
      terms = await Promise.all(termConverter.map(async term => {
        // Term is selected by user and its data are already downloaded
        if (prefs.terms[term] && currentTableData.terms[term].classes) {
          return currentTableData.terms[term];
        }
        // Term is selected by user and its data have not been downloaded
        else if (prefs.terms[term] && !currentTableData.imported) {
          try {
            $("#export_status").html(
              `Downloading quarter "${term}" from Aspen&hellip;`
            );
            const response = await $.ajax({
              url: "/data",
              method: "POST",
              data: { quarter: parseInt(term.match(/\d+/)[0]) },
              dataType: "json json"
            });
            currentTerm = term;
            responseCallbackPartial(response);
            $("#export_status").html("");
            return currentTableData.terms[term];
          }
          catch (err) {
            throw `Error while downloading quarter "${term}".`;
          }
        }
      }));
      obj.terms = {};
      // Add the term data to obj.terms
      termConverter.forEach((term, i) => {
        if (terms[i]) {
          obj.terms[term] = terms[i];
        }
      });
    }
    catch (err) {
      $("#export_status").html(err);
      return;
    }
    finally {
      currentTerm = origCurrentTerm;
      currentTableData.currentTermData = currentTableData.terms[currentTerm];
      classesTable.setData(currentTableData.currentTermData.classes);
      classesTable.redraw();
    }
  }
  if (prefs.cumGPA) obj.cumGPA = currentTableData.cumGPA;

  let jsonString = JSON.stringify(obj);

  const filename = `aspine-export-${new Date().toISOString()}.json`;

  $("#export_status").html(`Generated file "${filename}".`);

  saveAs(new Blob([jsonString], {
    type: "application/json;charset=utf-8"
  }), filename);
};

/**
 * Imports a JSON file and adds the data as a TableDataObject to the
 *
 * @param {object} obj - Data loaded from json file
 * @returns {Promise<string>}
 */
let importTableData = async function(obj) {

//#ifndef lite
  let version = await $.ajax("/version");
//#endif

//#ifdef lite
/*
  let version = (
//#include version
  );
*/
//#endif

  let _ov, _v;
  if (
      (
        // Check if major version differs
        (_ov = parseInt(obj.version.match(/^v?(\d+)/)[1]))
        !== (_v = parseInt(version.match(/^v?(\d+)/)[1]))
      )
      || (
        // Check if minor version is newer
        (_ov = parseInt(obj.version.match(/^v?\d+\.(\d+)/)[1]))
        > (_v = parseInt(version.match(/^v?\d+\.(\d+)/)[1]))
      )
  ) {
    return `This JSON file is from Aspine version ${obj.version} and is `
    + `incompatible with Aspine version ${version}. `
    + `${_ov < _v ? "Older" : "Newer"} versions of Aspine can be downloaded `
    + `at <a href="https://github.com/Aspine/aspine/releases">`
    + `https://github.com/Aspine/aspine/releases</a>.`;
  }

  currentTableDataIndex++;
  tableData[currentTableDataIndex] = {};
  currentTableData = tableData[currentTableDataIndex];
  currentTableData.imported = true;
  currentTableData.name = obj.name;

  let includedTerms = {};
  termConverter.forEach(term => {
    if (obj.terms[term]) {
      includedTerms[term] = true;
    }
    else {
      includedTerms[term] = false;
    }
  });

  currentTerm = "";
  termConverter.forEach(term => {
    if (!currentTerm && obj.terms[term]) currentTerm = term;
  });
  if (currentTerm) responseCallback({
    username: obj.username || "",
    recent: {
      recentActivityArray: obj.recent.recentActivityArray || [],
      recentAttendanceArray: obj.recent.recentAttendanceArray || []
    },
    overview: obj.overview || [],
    classes: obj.terms[currentTerm].classes || [],
    GPA: obj.terms[currentTerm].GPA || undefined,
    cumGPA: obj.cumGPA || undefined
  }, includedTerms);

  scheduleCallback(obj.schedule || {});

  let firstTerm = currentTerm;

  termConverter.forEach(term => {
    if (term === firstTerm || !obj.terms[term]) return;
    currentTerm = term;
    responseCallbackPartial({
      classes: obj.terms[currentTerm].classes || []
    });
  });

  currentTerm = firstTerm;

  for (const i in tableData) {
    if (!$(`#tableData_select option[value='${i}']`)[0]) {
      // Add new option to list
      let option = document.createElement("option");
      option.value = `${i}`;
      option.textContent = tableData[i].name;
      $("#tableData_select")[0].insertBefore(
        option, $("#tableData_select option[value='import']")[0]
      );

      let div = document.createElement("div");
      div.id = `tableData_select-items-${i}`;
      div.textContent = tableData[i].name;
      div.addEventListener("click", tableData_option_onclick);
      $(".tableData_select-items")[0].insertBefore(
        div, $("#tableData_select-items-import")[0]
      );
    }
  }

  if (currentTableDataIndex === 0) {
    // currentTableData is the initial object uploaded by user,
    // modify the text of the existing "Current Year" option
    $("#tableData_select option[value='0']")[0].textContent =
      tableData[0].name;
    $("#tableData_select-items-0")[0].textContent =
      tableData[0].name;
  }

  $(`#tableData_select-items-${currentTableDataIndex}`).click();
};
