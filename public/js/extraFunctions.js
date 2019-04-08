

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
	return "<i class=\"fa fa-plus\"aria-hidden=\"true\"></i>";
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
	if (parseFloat(gradeToBeColored) >= 90) {
		return "#1E8541";
	} else if (parseFloat(gradeToBeColored) >= 80) {
		return "#6666FF";
	} else if (parseFloat(gradeToBeColored) >= 70) {
		return "#ff9900";
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
		return "black";
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

let weightFormatter = function(cell, formatterParams) {
	let value = cell.getValue();
	let rowColor = cell.getRow().getData().color;

  if (value.indexOf(".") != -1) {
    value = value.substring(0, value.indexOf(".") + 2) + "%";
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

			return "<span style='color:" + getColor(parseFloat(real)) + "; font-weight:bold;'>" + real + "</span>" + "<br>" + "<span style='color:" + getColor(parseFloat(calculated_grade)) + "; font-weight:bold;'>" + fake + "</span>";

		}
		//return "<span style='color:" + getColor(parseFloat(real)) + "; font-weight:bold;'>" + real + "</span>" + "<br>" + "<span style='color:" + getColor(parseFloat(calculated_grade)) + "; font-weight:bold;'>" + fake + "</span>";

	}

}

let colorFormatter = function(cell, formatterParams) {

}
