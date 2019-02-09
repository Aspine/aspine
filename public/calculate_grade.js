function computeGrade(categories, scores, maxScores, constCategories, constWeights) {
	console.log(categories);
	console.log(scores);
	console.log(maxScores);
	console.log(constCategories);
	console.log(constWeights);

	let categoryScores = [], categoryMaxScores = [], totalScore = 0, totalMaxScore = 0;

	if (constCategories.length === 0) {
		for (let j = 0; j < scores.length; j++) {
			totalScore += parseFloat(scores[j]);
			totalMaxScore += parseFloat(maxScores[j]);
		}

		let totalPercent = totalScore / totalMaxScore;

		return "" + (Math.round(totalPercent * 10000) / 100);
	} else {
		for (let i = 0; i < constCategories.length; i++) {
			categoryScores[i] = 0;
			categoryMaxScores[i] = 0;
		}

		for (let i = 0; i < constCategories.length; i++) {
			for (let j = 0; j < scores.length; j++) {
				if (constCategories[i] === categories[j]) {
					totalScore += parseFloat(scores[j]);
					totalMaxScore += parseFloat(maxScores[j]);

					categoryScores[i] += parseFloat(scores[j]);
					categoryMaxScores[i] += parseFloat(maxScores[j]);
				}
			}
		}
		
		
		let categoryPercent = 0, counterWeight = 1;

		for (let i = 0; i < constCategories.length; i++) {
			
			if (categoryMaxScores[i] === 0) {
				counterWeight -= parseFloat(getWeight(constCategories[i], constCategories, constWeights));
			} else {
				categoryPercent += ((0.0 + categoryScores[i]) / categoryMaxScores[i]) * parseFloat(getWeight(constCategories[i], constCategories, constWeights));
			}
		}

		categoryPercent /= counterWeight;

		let totalPercent = totalScore / totalMaxScore;
		//console.log(session.getItem("gradeType"));
		//if (session.getItem("gradeType") === "category") {
			return "" + Math.round(categoryPercent * Math.pow(10, 2 )) / Math.pow(10, 0);
		//} else {
		//	return "" +  Math.round(totalPercent * Math.pow(10, 2 + allDecimalPlaces[currentClassIndex])) / Math.pow(10, allDecimalPlaces[currentClassIndex]);
		//}
	}
	
}


function determineGradeType(categories, scores, maxScores, constCategories, constWeights) {
	let categoryScores = [], categoryMaxScores = [], totalScore = 0, totalMaxScore = 0;

	for (let i = 0; i < constCategories.length; i++) {
		categoryScores[i] = 0;
		categoryMaxScores[i] = 0;
	}
	for (let i = 0; i < constCategories.length; i++) {
		for (let j = 0; j < scores.length; j++) {
			if (constCategories[i] === categories[j]) {
				totalScore += parseFloat(scores[j]);
				totalMaxScore += parseFloat(maxScores[j]);

				categoryScores[i] += parseFloat(scores[j]);
				categoryMaxScores[i] += parseFloat(maxScores[j]);
			}
		}
	}

	
	let categoryPercent = 0, counterWeight = 1;

	for (let i = 0; i < constCategories.length; i++) {
		
		if (categoryMaxScores[i] === 0) {
			counterWeight -= parseFloat(getWeight(constCategories[i], constCategories, constWeights));

		} else {
			categoryPercent += ((0.0 + categoryScores[i]) / categoryMaxScores[i]) * parseFloat(getWeight(constCategories[i], constCategories, constWeights));
		}
	}

	categoryPercent /= counterWeight;

	let totalPercent = totalScore / totalMaxScore;
	console.log(Math.abs(categoryPercent - parseFloat(currentGrade)));
	console.log(Math.abs(totalPercent - parseFloat(currentGrade)));
	console.log(Math.abs(categoryPercent - parseFloat(currentGrade)) < Math.abs(totalPercent - parseFloat(currentGrade)));
	
	if (Math.abs(categoryPercent * 100 - parseFloat(currentGrade)) < Math.abs(totalPercent * 100 - parseFloat(currentGrade))) {
		console.log("set to category");
		//session.setItem("gradeType", "category");

	} else {
		console.log("set to total");
		//session.setItem("gradeType", "total");
	}
}

function getWeight(category, constCategories, constWeights) {
	for (let k = 0; k < constCategories.length; k++) {
		if (category === constCategories[k]) {
			return constWeights[k];
		}
	}
	return "Weight Not Found";
}


function getRGB(gradeToBeColored) {
	if (parseFloat(gradeToBeColored) >= 90) {
		return rgb[0];
	} else if (parseFloat(gradeToBeColored) >= 80) {
		return rgb[1];
	} else if (parseFloat(gradeToBeColored) >= 70) {
		return rgb[2];
	} else if (parseFloat(gradeToBeColored) >= 60) {
		return rgb[3];
	} else if (parseFloat(gradeToBeColored) >= 0) {
		return rgb[4];
	} else {
		return 'rgb(255,255,255)';
	}
}
