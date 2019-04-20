let newAssignment = function() {

	tableData.currentTerm.classes[selected_class_i].edited = true;

	if (!isNaN(selected_class_i)) {

		tableData.currentTerm.classes[selected_class_i].assignments.unshift({
			"name": "Assignment",
			"category": Object.keys(tableData.currentTerm.classes[selected_class_i].categories)[0],
			"score": 10,
			"max_score": 10,
			"percentage": 100,
			"color": "green",
		});

		updateGradePage();		

	}
}


let editAssignment = function(data) {
	
	tableData.currentTerm.classes[selected_class_i].edited = true;

	tableData.currentTerm.classes[selected_class_i].assignments = data.slice();


	for (let j = 0; j < tableData.currentTerm.classes[selected_class_i].assignments.length; j++) {
		tableData.currentTerm.classes[selected_class_i].assignments[j].percentage = Math.round(tableData.currentTerm.classes[selected_class_i].assignments[j].score / tableData.currentTerm.classes[selected_class_i].assignments[j].max_score * 1000) / 10;
		tableData.currentTerm.classes[selected_class_i].assignments[j].color = getColor(tableData.currentTerm.classes[selected_class_i].assignments[j].percentage);

		if (tableData.currentTerm.classes[selected_class_i].assignments[j].category.includes("(")) {
			tableData.currentTerm.classes[selected_class_i].assignments[j].category = tableData.currentTerm.classes[selected_class_i].assignments[j].category.substring(0, tableData.currentTerm.classes[selected_class_i].assignments[j].category.indexOf("(") - 1); 
		}


		if (isNaN(tableData.currentTerm.classes[selected_class_i].assignments[j].score) || tableData.currentTerm.classes[selected_class_i].assignments[j].score === "") {
			tableData.currentTerm.classes[selected_class_i].assignments[j].score = "None";
		}


		if (isNaN(tableData.currentTerm.classes[selected_class_i].assignments[j].max_score) || tableData.currentTerm.classes[selected_class_i].assignments[j].max_score === "") {
			tableData.currentTerm.classes[selected_class_i].assignments[j].max_score = "None";
		}
	}

	updateGradePage();

	
}

let resetTableData = function() {

  //tableData.currentTerm.classes[selected_class_i].edited = false;
  tableData.terms[currentTerm] = JSON.parse(JSON.stringify(termsReset[currentTerm]));
  tableData.currentTerm = tableData.terms[currentTerm];
  if (selected_class_i) {
    assignmentsTable.setData(tableData.currentTerm.classes[selected_class_i].assignments);
    categoriesTable.setData(tableData.currentTerm.classes[selected_class_i].categoryDisplay);
  }
  classesTable.setData(tableData.currentTerm.classes);

  tableData.currentTerm.calcGPA = computeGPA();

  let GPA = tableData.terms[currentTerm].GPA;
  let calcGPA = tableData.terms[currentTerm].calcGPA;

	if (anyEdited()) {
    //fix the editing system in the if statement above to be true if any of the classes are edited
    if (currentTerm == "current") {
      $(".select-selected").css('padding', "5px 16px 5px 16px");
      $(".select-selected").html("Current Quarter GPA: " + GPA + "<br>Calculated GPA: " + calcGPA);
      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Current Quarter GPA:"  + GPA + "<br>Calculated GPA: " + calcGPA);
      document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA:"  + GPA + "<br>Calculated GPA: " + calcGPA;
      document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA:"  + GPA + "<br>Calculated GPA: " + calcGPA;

    } else {
      $(".select-selected").css('padding', "5px 16px 5px 16px");
      $(".select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA + "<br>Calculated GPA: " + calcGPA);

      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA + "<br>Calculated GPA: " + calcGPA);
      document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML = "Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA + "<br>Calculated GPA: " + calcGPA;
    }
  } else {
    if (currentTerm == "current") {
      $(".select-selected").css("padding", "13px 16px 13px 16px");
      $(".select-selected").html("Current Quarter GPA: " + GPA);

      $("#" + currentTerm).css("padding", "13px 16px 13px 16px");
      $("#" + currentTerm).html("Current Quarter GPA:"  + GPA);
      document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA:"  + GPA;
      document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA:"  + GPA;

    } else {
      $(".select-selected").css("padding", "13px 16px 13px 16px");
      $(".select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA);

      $("#" + currentTerm).css("padding", "13px 16px 13px 16px");
      $("#" + currentTerm).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA);
      document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML = "Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA;
    }
  }
  $("#assignmentsTable").hide(); //;.setData(tableData[i].assignments);
  $("#categoriesTable").hide(); //;.setData(tableData[i].assignments);
}

let hideCategoriesTable = function() {
	document.getElementById("categoriesTable").style.display = "none";
}

let updateGradePage = function() {
	let computingClassData = tableData.currentTerm.classes[selected_class_i];

	let gradeInfo = (computeGrade(computingClassData.assignments, computingClassData.categories, computingClassData.decimals, computingClassData.init_calculated_grade, computingClassData.grade));

	tableData.currentTerm.classes[selected_class_i].calculated_grade = gradeInfo[computingClassData.type];

	tableData.currentTerm.classes[selected_class_i].categoryDisplay = getCategoryDisplay(gradeInfo, computingClassData);

	classesTable.replaceData(tableData.currentTerm.classes);
	categoriesTable.setData(tableData.currentTerm.classes[selected_class_i].categoryDisplay);

	assignmentsTable.replaceData(tableData.currentTerm.classes[selected_class_i].assignments);

	tableData.currentTerm.calcGPA = computeGPA();

  let GPA = tableData.terms[currentTerm].GPA;
  let calcGPA = tableData.terms[currentTerm].calcGPA;

	if (anyEdited()) {
    //fix the editing system in the if statement above to be true if any of the classes are edited
    if (currentTerm == "current") {
      $(".select-selected").css('padding', "5px 16px 5px 16px");
      $(".select-selected").html("Current Quarter GPA: " + GPA + "<br>Calculated GPA: " + calcGPA);
      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Current Quarter GPA:"  + GPA + "<br>Calculated GPA: " + calcGPA);
      document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA:"  + GPA + "<br>Calculated GPA: " + calcGPA;
      document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA:"  + GPA + "<br>Calculated GPA: " + calcGPA;

    } else {
      $(".select-selected").css('padding', "5px 16px 5px 16px");
      $(".select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA + "<br>Calculated GPA: " + calcGPA);

      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA + "<br>Calculated GPA: " + calcGPA);
      document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML = "Q" + termConverter.indexOf(currentTerm) + " GPA: " + GPA + "<br>Calculated GPA: " + calcGPA;
    }

		//document.getElementById("GPA").style.padding = "3.5px 16px 3.5px 16px";
    //+ " <i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>"
		//document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA + "<br>Calculated GPA: " + tableData.calcGPA + " <i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>";
	} else {
		$(".select-selected").css("padding", "13px 16px 13px 16px");
		$("#" + currentTerm).css("padding", "13px 16px 13px 16px");

    $(".select-selected").html("Quarter GPA: " + GPA);
		$("#" + currentTerm).html("Quarter GPA: " + GPA);
	}
}
