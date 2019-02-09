function getLetterGrade(gradeToBeLettered) {
	let parsed = parseFloat(gradeToBeLettered);
	if (parsed >= 97) {
		return "A+";
	} else if (parsed >= 93) {
		return "A";
	} else if (parsed >= 90) {
		return "A-";
	} else if (parsed >= 87) {
		return "B+";
	} else if (parsed >= 83) {
		return "B";
	} else if (parsed >= 80) {
		return "B-";
	} else if (parsed >= 77) {
		return "C+";
	} else if (parsed >= 73) {
		return "C";
	} else if (parsed >= 70) {
		return "C-";
	} else if (parsed >= 67) {
		return "D+";
	} else if (parsed >= 63) {
		return "D";
	} else if (parsed >= 60) {
		return "D-";
	} else {
		return "F";
	}
}

function getColor(gradeToBeColored) {
	if (parseFloat(gradeToBeColored) >= 90) {
		return "green";
	} else if (parseFloat(gradeToBeColored) >= 80) {
		return "blue";
	} else if (parseFloat(gradeToBeColored) >= 70) {
		return "yellow";
	} else if (parseFloat(gradeToBeColored) >= 60) {
		return "orange";
	} else if (parseFloat(gradeToBeColored) >= 0) {
		return "red";
	} else {
		return "black";
	}
}

function getLightColor(gradeToBeColored) {
	if (parseFloat(gradeToBeColored) >= 90) {
		return "#99ff66";
	} else if (parseFloat(gradeToBeColored) >= 80) {
		return "#66ccff";
	} else if (parseFloat(gradeToBeColored) >= 70) {
		return "#ffff66";
	} else if (parseFloat(gradeToBeColored) >= 60) {
		return "#ff8533";
	} else if (parseFloat(gradeToBeColored) >= 0) {
		return "#ff4d4d";
	} else {
		return "white";
	}
}

let classesRowFormatter = function(cell, formatterParams) {
	let rowColor = cell.getRow().getData().color;

	let value = cell.getValue();
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
		return "<span style='color:"+rowColor+"; font-weight:bold;'>" + value + "</span>";

	}

}

let gradeFormatter = function(cell, formatterParams) {
	let numberGrade = parseFloat(cell.getValue());


	if (isNaN(numberGrade)) {
		return "No Grade";

	} else {
		let value = parseFloat(cell.getValue()) + "% " + getLetterGrade(cell.getValue());
		if(parseFloat(numberGrade) > 90){
			return "<span style='color:green; font-weight:bold;'>" + value + "</span>";
		} if(parseFloat(numberGrade) > 80){
			return "<span style='color:blue; font-weight:bold;'>" + value + "</span>";
		} if(parseFloat(numberGrade) > 70){
			return "<span style='color:yellow; font-weight:bold;'>" + value + "</span>";
		} if(parseFloat(numberGrade) > 60){
			return "<span style='color:orange; font-weight:bold;'>" + value + "</span>";
		} else{
			return value;
		}
	}

}

let colorFormatter = function(cell, formatterParams) {

}
