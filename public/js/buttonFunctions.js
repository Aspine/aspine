let newAssignment = function() {

  console.log("new assignment clicked");
	tableData.classes[selected_class_i].edited = true;

	if (!isNaN(selected_class_i)) {

		tableData.classes[selected_class_i].assignments.unshift({
			"name": "Assignment",
			"category": Object.keys(tableData.classes[selected_class_i].categories)[0],
			"score": 10,
			"max_score": 10,
			"percentage": 100,
			"color": "green",
		});

		updateGradePage();		

	}
}


let editAssignment = function(data) {
	
	tableData.classes[selected_class_i].edited = true;

	tableData.classes[selected_class_i].assignments = data.slice();


	for (let j = 0; j < tableData.classes[selected_class_i].assignments.length; j++) {
		tableData.classes[selected_class_i].assignments[j].percentage = Math.round(tableData.classes[selected_class_i].assignments[j].score / tableData.classes[selected_class_i].assignments[j].max_score * 1000) / 10;
		tableData.classes[selected_class_i].assignments[j].color = getColor(tableData.classes[selected_class_i].assignments[j].percentage);

		if (tableData.classes[selected_class_i].assignments[j].category.includes("(")) {
			tableData.classes[selected_class_i].assignments[j].category = tableData.classes[selected_class_i].assignments[j].category.substring(0, tableData.classes[selected_class_i].assignments[j].category.indexOf("(") - 1); 
		}


		if (isNaN(tableData.classes[selected_class_i].assignments[j].score) || tableData.classes[selected_class_i].assignments[j].score === "") {
			tableData.classes[selected_class_i].assignments[j].score = "None";
		}


		if (isNaN(tableData.classes[selected_class_i].assignments[j].max_score) || tableData.classes[selected_class_i].assignments[j].max_score === "") {
			tableData.classes[selected_class_i].assignments[j].max_score = "None";
		}
	}

	updateGradePage();

	
}

let resetTableData = function() {

  try {
    tableData.classes[selected_class_i].edited = false;
    tableData.classes = JSON.parse(JSON.stringify(classesReset));
    assignmentsTable.setData(tableData.classes[selected_class_i].assignments);
    categoriesTable.setData(tableData.classes[selected_class_i].categoryDisplay);
    classesTable.setData(tableData.classes);

    tableData.classes.calcGPA = computeGPA();
  } catch (e) {

  }
	if (anyEdited()) {
    //fix the editing system in the if statement above to be true if any of the classes are edited
    if (currentTerm == "current") {
      $(".select-selected").css('padding', "5px 16px 5px 16px");
      $(".select-selected").html("Current Quarter GPA: " + tableData.classes.GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA);
      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Current Quarter GPA:"  + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA);
      document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA:"  + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA;
      document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA:"  + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA;

    } else {
      $(".select-selected").css('padding', "5px 16px 5px 16px");
      $(".select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA);

      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA);
      document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML = "Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA;
    }
  } else {
    console.log("trying");
    if (currentTerm == "current") {
      $(".select-selected").css("padding", "13px 16px 13px 16px");
      $(".select-selected").html("Current Quarter GPA: " + tableData.classes.GPA);

      $("#" + currentTerm).css("padding", "13px 16px 13px 16px");
      $("#" + currentTerm).html("Current Quarter GPA:"  + tableData.terms[currentTerm].GPA);
      document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA:"  + tableData.terms[currentTerm].GPA;
      document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA:"  + tableData.terms[currentTerm].GPA;

    } else {
      $(".select-selected").css("padding", "13px 16px 13px 16px");
      $(".select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.terms[currentTerm].GPA);

      $("#" + currentTerm).css("padding", "13px 16px 13px 16px");
      $("#" + currentTerm).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.terms[currentTerm].GPA);
      document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML = "Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.terms[currentTerm].GPA;
    }
  }
}

let hideCategoriesTable = function() {
	document.getElementById("categoriesTable").style.display = "none";
}

let updateGradePage = function() {
	let computingClassData = tableData.classes[selected_class_i];

	let gradeInfo = (computeGrade(computingClassData.assignments, computingClassData.categories, computingClassData.decimals, computingClassData.init_calculated_grade, computingClassData.grade));

	tableData.classes[selected_class_i].calculated_grade = gradeInfo[computingClassData.type];

	tableData.classes[selected_class_i].categoryDisplay = getCategoryDisplay(gradeInfo, computingClassData);

	classesTable.replaceData(tableData.classes);
	categoriesTable.setData(tableData.classes[selected_class_i].categoryDisplay);

	assignmentsTable.replaceData(tableData.classes[selected_class_i].assignments);

	tableData.classes.calcGPA = computeGPA();

	if (anyEdited()) {
    //fix the editing system in the if statement above to be true if any of the classes are edited
    if (currentTerm == "current") {
      $(".select-selected").css('padding', "5px 16px 5px 16px");
      $(".select-selected").html("Current Quarter GPA: " + tableData.classes.GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA);
      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Current Quarter GPA:"  + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA);
      document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA:"  + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA;
      document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA:"  + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA;

    } else {
      $(".select-selected").css('padding', "5px 16px 5px 16px");
      $(".select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA);

      $("#" + currentTerm).css('padding', "5px 16px 5px 16px");
      $("#" + currentTerm).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA);
      document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML = "Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.terms[currentTerm].GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA;
    }

    //$(".select-items").children().each(function(i, elem) {
    //  if (i == 0) {
    //    $(this).html("Current Quarter GPA: " + tableData.terms["current"].GPA);
    //    document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA: " + tableData.terms["current"].GPA;
    //    document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA: " + tableData.terms["current"].GPA;
    //  } else {
    //    $(this).html("Q" + i + " GPA: " + tableData.terms["q" + i].GPA);
    //    document.getElementById('gpa_select').options[i + 1].innerHTML ="Q" + i + " GPA: " + tableData.terms["q" + i].GPA; 
    //  }
    //});

		//document.getElementById("GPA").style.padding = "3.5px 16px 3.5px 16px";
    //+ " <i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>"
		//document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA + "<br>Calculated GPA: " + tableData.calcGPA + " <i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>";
	} else {
		$(".select-selected").css("padding", "13px 16px 13px 16px");
		$("#" + currentTerm).css("padding", "13px 16px 13px 16px");

    $(".select-selected").html("Quarter GPA: " + tableData.classes.GPA);
		$("#" + currentTerm).html("Quarter GPA: " + tableData.classes.GPA);
		//document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA;
	}
}
