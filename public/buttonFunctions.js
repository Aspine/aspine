let newAssignment = function() {

	if (!isNaN(selected_class_i)) {

		tableData.classes[selected_class_i].assignments.unshift({
			"name": "Assignment",
			"category": Object.keys(tableData.classes[selected_class_i].categories)[0],
			"score": 10,
			"max_score": 10,
			"percentage": 100,
			"color": "green",
		});

		let computingClassData = tableData.classes[selected_class_i];

		tableData.classes[selected_class_i].calculated_grade = (computeGrade(computingClassData.assignments, computingClassData.categories, computingClassData.decimals))[computingClassData.type];

		classesTable.setData(tableData.classes);

		assignmentsTable.setData(tableData.classes[selected_class_i].assignments);

		tableData.calcGPA = computeGPA();

		if (tableData.GPA != tableData.calcGPA) {
			document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA + "  (Calc: " + tableData.calcGPA + ")";
		} else {
			document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA;
		}

	}
}


let editAssignment = function(data) {
	
	tableData.classes[selected_class_i].assignments = data.slice();

	for (let j = 0; j < tableData.classes[selected_class_i].assignments.length; j++) {
		tableData.classes[selected_class_i].assignments[j].percentage = Math.round(tableData.classes[selected_class_i].assignments[j].score / tableData.classes[selected_class_i].assignments[j].max_score * 1000) / 10;
		tableData.classes[selected_class_i].assignments[j].color = getColor(tableData.classes[selected_class_i].assignments[j].percentage);


		if (isNaN(tableData.classes[selected_class_i].assignments[j].score) || tableData.classes[selected_class_i].assignments[j].score === "") {
			tableData.classes[selected_class_i].assignments[j].score = "None";
		}


		if (isNaN(tableData.classes[selected_class_i].assignments[j].max_score) || tableData.classes[selected_class_i].assignments[j].max_score === "") {
			tableData.classes[selected_class_i].assignments[j].max_score = "None";
		}
	}

	assignmentsTable.setData(tableData.classes[selected_class_i].assignments);

	let computingClassData = tableData.classes[selected_class_i];

	tableData.classes[selected_class_i].calculated_grade = (computeGrade(computingClassData.assignments, computingClassData.categories, computingClassData.decimals))[computingClassData.type];

	tableData.classes[selected_class_i].color = getColor(tableData.classes[selected_class_i].calculated_grade);

	classesTable.setData(tableData.classes);

	tableData.calcGPA = computeGPA();

	if (tableData.GPA != tableData.calcGPA) {
		document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA + "  (Calc: " + tableData.calcGPA + ")";
	} else {
		document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA;
	}
}

let resetTableData = function() {
	tableData = JSON.parse(JSON.stringify(tableDataReset));
	assignmentsTable.setData(tableData.classes[selected_class_i].assignments);
	classesTable.setData(tableData.classes);
	
	tableData.calcGPA = computeGPA();


	if (tableData.GPA != tableData.calcGPA) {
		document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA + "  (Calc: " + tableData.calcGPA + ")";
	} else {
		document.getElementById("GPA").innerHTML = "Quarter GPA: " + tableData.GPA;
	}
}
