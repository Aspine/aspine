let newAssignment = function() {
	tableData.classes[selected_class_i].assignments.push({
		"name": "Assignment",
		"category": Object.keys(tableData.classes[selected_class_i].categories)[0],
		"score": 10,
		"max_score": 10,
		"percentage": 100,
		"color": "green",
	});
	assignmentsTable.setData(tableData.classes[selected_class_i].assignments);
}
