/**
 *
 * @param {Object[]} assignments
 * @param {Object} categories
 * @param  decimals
 * @param init_grade
 * @param {string} grade
 * @returns {string|{categoryScores: {}, categoryPercent: string, categoryGrades: {}, totalPercent: string, categoryMaxScores: {}}}
 */

function computeGrade(assignments, categories, decimals, init_grade, grade) {
    let categoryScores = {}, categoryMaxScores = {}, categoryGrades = {};
    for (let category in categories) {
        categoryScores[category] = 0;
        categoryMaxScores[category] = 0;
        categoryGrades[category] = 0;
    }

    let totalScore = 0, totalMaxScore = 0;
    if (Object.keys(categories).length === 0) {
        for (let assignment of assignments) {
            totalScore += parseFloat(assignment.score);
            totalMaxScore += parseFloat(assignment.max_score);
        }

        let totalPercent = totalScore / totalMaxScore;
        return (Math.round(totalPercent * 10000) / 100).toString();
    } else {
        for (let i = 0; i < assignments.length; i++) {
            if (!isNaN(assignments[i].score)) {
                totalScore += parseFloat(assignments[i].score);
                totalMaxScore += parseFloat(assignments[i].max_score);

                categoryScores[assignments[i].category] += parseFloat(assignments[i].score);
                categoryMaxScores[assignments[i].category] += parseFloat(assignments[i].max_score);
            }
        }

        let categoryPercent = 0, counterWeight = 1;

        for (let category in categories) {
            if (categoryMaxScores[category] === 0) {
                counterWeight -= parseFloat(categories[category]);
                categoryGrades[category] = "N/A";
            } else {
                categoryGrades[category] = (0.0 + categoryScores[category]) / categoryMaxScores[category];
                categoryPercent += (0.0 + categoryScores[category]) / categoryMaxScores[category] * parseFloat(categories[category]);
            }
        }

        categoryPercent /= counterWeight;

        let totalPercent = totalScore / totalMaxScore;
        let output = parseFloat(grade)/100 + categoryPercent - parseFloat(init_grade);

        return {
            categoryPercent: (Math.round(output * Math.pow(10, decimals + 2)) / Math.pow(10, decimals)).toString(),
            totalPercent: (Math.round(totalPercent * Math.pow(10, decimals + 2)) / Math.pow(10, decimals)).toString(),
            categoryScores,
            categoryMaxScores,
            categoryGrades,
        };
    }
}

/**
 *
 * @param assignments
 * @param categories
 * @param currentGrade
 * @returns {string|{categoryScores: {}, categoryGrades: {}, categoryPercent: number, type: string, categoryMaxScores: {}}}
 */
function determineGradeType(assignments, categories, currentGrade) {
    let categoryScores = {}, categoryMaxScores = {}, categoryGrades = {};
    for (let category in categories) {
        categoryScores[category] = 0;
        categoryMaxScores[category] = 0;
        categoryGrades[category] = 0;
    }

    let totalScore = 0, totalMaxScore = 0;
    if (Object.keys(categories).length === 0) {
        for (let j = 0; j < assignments.length; j++) {
            totalScore += parseFloat(assignments[j].score);
            totalMaxScore += parseFloat(assignments[j].max_score);
        }

        let totalPercent = totalScore / totalMaxScore;
        return "" + (Math.round(totalPercent * 10000) / 100);
    } else {
        for (let i = 0; i < assignments.length; i++) {
            if (!isNaN(assignments[i].score)) {
                totalScore += parseFloat(assignments[i].score);
                totalMaxScore += parseFloat(assignments[i].max_score);

                categoryScores[assignments[i].category] += parseFloat(assignments[i].score);
                categoryMaxScores[assignments[i].category] += parseFloat(assignments[i].max_score);
            }
        }

        let categoryPercent = 0, counterWeight = 1;
        for (let category in categories) {
            if (categoryMaxScores[category] === 0) {
                counterWeight -= parseFloat(categories[category]);
                categoryGrades[category] = "N/A";
            } else {
                categoryGrades[category] = (0.0 + categoryScores[category]) / categoryMaxScores[category];
                categoryPercent += ((0.0 + categoryScores[category]) / categoryMaxScores[category]) * parseFloat(categories[category]);
            }
        }

        categoryPercent /= counterWeight;
        let totalPercent = totalScore / totalMaxScore;
        categoryPercent = Math.round(categoryPercent * 10000) / 10000;
        totalPercent = Math.round(totalPercent * 10000) / 10000;

        let type;

        //if (Math.abs(categoryPercent * 100 - parseFloat(currentGrade)) <= Math.abs(totalPercent * 100 - parseFloat(currentGrade))) {
        //  type = 'categoryPercent';
        //} else {
        //  type = 'totalPercent';
        //}
        type = 'categoryPercent';

        return {
            type,
            categoryScores,
            categoryMaxScores,
            categoryGrades,
            categoryPercent,

        };
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

function computeGPA(classes) {
    let sum = 0; // Sum of classes' grades
    let count = 0; // Number of classes
    let fourSum = 0; // Sum of classes' grades on 4.0 scale
    let fiveSum = 0; // Sum of classes' grades on 5.0 scale
    for (let classInfo of classes) {
        if (!isNaN(parseFloat(classInfo.calculated_grade))) {
            if (parseFloat(classInfo.calculated_grade) > 100) {
                sum += 100;
            } else {
                sum += parseFloat(classInfo.calculated_grade);
            }
            count++;

            //--------GPA OUT OF 4.0
            let curG = getGPA(classInfo.calculated_grade);
            fourSum += curG;

            //----WEIGHTED GPA (OUT OF 5.0)-------
            fiveSum += curG;
            if (classInfo.name.includes("HN")) {
                fiveSum += .5;
            }
            if (classInfo.name.includes("AP")) {
                fiveSum += 1;
            }
        }
    }

    if (sum > 0 && count > 0) { // Not Null
        return {
            percent: Math.round(sum / count * 100) / 100,
            outOfFour: Math.round(fourSum / count * 100) / 100,
            outOfFive: Math.round(fiveSum / count * 100) / 100
        };
    }
    else {
        return {
            percent: 0,
            outOfFour: 0,
            outOfFive: 0
        };
    }
}


function computeGPAQuarter(overview, i) {
    let sum = 0; // Sum of classes' grades
    let count = 0; // Number of classes
    let fourSum = 0; // Sum of classes' grades on 4.0 scale
    let fiveSum = 0; // Sum of classes' grades on 5.0 scale
    for (let overviewClass of overview) {
        if (overviewClass["q" + i]) {
            if (parseFloat(overviewClass["q" + i]) > 100) {
                sum += 100;
            } else {
                sum += parseFloat(overviewClass["q" + i]);
            }
            count++;

            //--------GPA OUT OF 4.0
            let curG = getGPA(overviewClass["q" + i]);
            fourSum += curG;

            //----WEIGHTED GPA (OUT OF 5.0)-------
            fiveSum += curG;
            if (overviewClass.class.includes("HN")) {
                fiveSum += .5;
            }
            if (overviewClass.class.includes("AP")) {
                fiveSum += 1;
            }
        }
    }

    return {
        percent: Math.round(sum / count * 100) / 100,
        outOfFour: Math.round(fourSum / count * 100) / 100,
        outOfFive: Math.round(fiveSum / count * 100) / 100
    };
}

function cumGPA(overview) {
    let sumGPA = 0;
    let sumOutOfFour = 0;
    let sumOutOfFive = 0;

    let count = 0;
    for (let i = 1; i <= 4; i++) {

        if (!isNaN(computeGPAQuarter(overview, i).percent)) {
            sumGPA += computeGPAQuarter(overview, i).percent;
            sumOutOfFour += computeGPAQuarter(overview, i).outOfFour;
            sumOutOfFive += computeGPAQuarter(overview, i).outOfFive;

            count++;
        }

    }
    return {
        percent: Math.round(sumGPA / count * 100) / 100,
        outOfFour: Math.round(sumOutOfFour / count * 100) / 100,
        outOfFive: Math.round(sumOutOfFive / count * 100) / 100
    };
}

function doCalculations(assignments, categories) {
    let categoryScores = {}, categoryMaxScores = {}, categoryGrades = {};

    for (let category in categories) {
        categoryScores[category] = 0;
        categoryMaxScores[category] = 0;
        categoryGrades[category] = 0;
    }

    let totalScore = 0, totalMaxScore = 0;

    if (Object.keys(categories).length === 0) {
        for (let j = 0; j < assignments.length; j++) {
            totalScore += parseFloat(assignments[j].score);
            totalMaxScore += parseFloat(assignments[j].max_score);
        }
        let totalPercent = totalScore / totalMaxScore;
        return "" + (Math.round(totalPercent * 10000) / 100);
    } else {
        for (let i = 0; i < assignments.length; i++) {
            if (!isNaN(assignments[i].score)) {
                totalScore += parseFloat(assignments[i].score);
                totalMaxScore += parseFloat(assignments[i].max_score);

                categoryScores[assignments[i].category] += parseFloat(assignments[i].score);
                categoryMaxScores[assignments[i].category] += parseFloat(assignments[i].max_score);
            }
        }
        let categoryPercent = 0, counterWeight = 1;
        for (let category in categories) {
            if (categoryMaxScores[category] === 0) {
                counterWeight -= parseFloat(categories[category]);
                categoryGrades[category] = "N/A";
            } else {
                categoryGrades[category] = (0.0 + categoryScores[category]) / categoryMaxScores[category];
                categoryPercent += ((0.0 + categoryScores[category]) / categoryMaxScores[category]) * parseFloat(categories[category]);
            }
        }
        categoryPercent /= counterWeight;
        let totalPercent = totalScore / totalMaxScore;
        return {
            categoryScores,
            categoryMaxScores,
            categoryGrades,
            categoryPercent,
            totalPercent,
        };
    }
}

let getCategoryDisplay = function (gradeInfo, computingClassData) {
    let categoryDisplay = [];

    let categoriesArray = Object.keys(gradeInfo.categoryScores);
    let weightsArray = Object.values(computingClassData.categories).map(weight => weight * 100 + "%");
    let scoresArray = Object.values(gradeInfo.categoryScores).map(score => parseFloat(score) != 0 ? score : "Ungraded");
    let maxScoresArray = Object.values(gradeInfo.categoryMaxScores).map(maxScore => parseFloat(maxScore) != 0 ? maxScore : "Ungraded");
    let gradesArray = Object.values(gradeInfo.categoryGrades).map(grade => !isNaN(parseFloat(grade)) ? Math.round(grade * 1000) / 10 + "%" : "No Grade");

    for (let b = 0; b < categoriesArray.length; b++) {
        let categoryRow = {};
        categoryRow.category = categoriesArray[b];
        categoryRow.weight = weightsArray[b];
        categoryRow.score = scoresArray[b];
        categoryRow.maxScore = maxScoresArray[b];
        categoryRow.grade = gradesArray[b];
        categoryRow.color = getColor(gradesArray[b]);

        categoryDisplay.push(categoryRow);
    }

    return categoryDisplay;
}
