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
