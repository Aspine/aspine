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

	tableData.classes[selected_class_i].edited = false;

	tableData = JSON.parse(JSON.stringify(tableDataReset));
	assignmentsTable.setData(tableData.classes[selected_class_i].assignments);
	categoriesTable.setData(tableData.classes[selected_class_i].categoryDisplay);
	classesTable.setData(tableData.classes);
	
	tableData.classes.calcGPA = computeGPA();


	if (tableData.classes[selected_class_i].edited) {
    $(".select-selected").html("Quarter GPA: " + tableData.classes.GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA + " <i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>");
		//document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA + "<br>Calculated GPA: " + tableData.calcGPA + " <i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>";
	} else {
		document.getElementById("GPA").style.padding = "14px 16px 14px 16px";
    $(".select-selected").html("Quarter GPA: " + tableData.classes.GPA);
		//document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA;
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

	if (tableData.classes[selected_class_i].edited) {
    $(".select-selected").css('padding', "5px 16px 5px 16px");
		//document.getElementById("GPA").style.padding = "3.5px 16px 3.5px 16px";
    //
    $(".select-selected").html("Quarter GPA: " + tableData.classes.GPA + "<br>Calculated GPA: " + tableData.classes.calcGPA + " <i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>");
		//document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA + "<br>Calculated GPA: " + tableData.calcGPA + " <i class=\"fa fa-refresh\" aria-hidden=\"true\"></i>";
	} else {
    $(".select-selected").html("Quarter GPA: " + tableData.classes.GPA);
		//document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA;
	}
}
