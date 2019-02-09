let newAssignment = function() {
	tableData.classes[selected_class_i].assignments.push({
		"name": "Assignment",
		"category": Object.keys(tableData.classes[selected_class_i].categories)[0],
		"score": 10,
		"max_score": 10,
		"percentage": 100,
		"color": "green",
	});

	let computingClassData = tableData.classes[selected_class_i];

	tableData.classes[selected_class_i].calculated_grade = computeGrade(computingClassData.assignments.map(assignment => assignment.category), computingClassData.assignments.map(assignment => assignment.score === "None" ? 0 : assignment.score), computingClassData.assignments.map(assignment => assignment.max_score === "None" ? 0 : assignment.max_score), Object.keys(computingClassData.categories), Object.values(computingClassData.categories), 1);

	classesTable.setData(tableData.classes);

	assignmentsTable.setData(tableData.classes[selected_class_i].assignments);
}
