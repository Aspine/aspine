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

//in a function because when extraFunctions first runs, jquery isn't initialized
function initialize_jquery_prototype() {
  jQuery.prototype.replace_text = function(input) {
    this.contents().filter(function() {return (this.nodeType == 3);}).replaceWith(input)
  }
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

function GPAType() {
  let selectElem = $("#gpa_select");
  let selectedElem = $(".gpa_select-selected");
  let selection = $("#gpa_select option")[selectElem.prop("selectedIndex")].value;

  let quarterName = "";
  let quarterData;

  if (selection == 0) {
    quarterName = "Current Quarter";
    quarterData = currentTableData.terms.current;
  }
  else {
    quarterName = "Q" + selection;
    quarterData = currentTableData.terms["q" + selection];
  }

  if (selectedElem.html().includes("GPA")) {
    if (quarterData.GPA.outOfFour != quarterData.calcGPA.outOfFour) {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter Unweighted: " + currentTableData.terms.current.GPA.outOfFour.toFixed(2) +
        "<br> Calculated: " + currentTableData.terms.current.calcGPA.outOfFour.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " Unweighted: " + currentTableData.terms["q" + i].GPA.outOfFour.toFixed(2) +
          (currentTableData.terms["q" + i].calcGPA ? (
            "<br> Calculated: " + currentTableData.terms["q" + i].calcGPA.outOfFour.toFixed(2)
          ) : "")
        );
      }
      selectedElem.replace_text(
        quarterName + " Unweighted: " + quarterData.GPA.outOfFour.toFixed(2) +
        "<br> Calculated: " + quarterData.calcGPA.outOfFour.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative Unweighted: " + currentTableData.cumGPA.outOfFour.toFixed(2)
      );
    }
    else {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter Unweighted: " + currentTableData.terms.current.GPA.outOfFour.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " Unweighted: " + currentTableData.terms["q" + i].GPA.outOfFour.toFixed(2)
        );
      }
      selectedElem.replace_text(
        quarterName + " Unweighted: " + quarterData.GPA.outOfFour.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative Unweighted: " + currentTableData.cumGPA.outOfFour.toFixed(2)
      );
    }
  }
  else if (selectedElem.html().includes("Unweighted")) {
    if (quarterData.GPA.outOfFive != quarterData.calcGPA.outOfFive) {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter Weighted: " + currentTableData.terms.current.GPA.outOfFive.toFixed(2) +
        "<br> Calculated: " + currentTableData.terms.current.calcGPA.outOfFive.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " Weighted: " + currentTableData.terms["q" + i].GPA.outOfFive.toFixed(2) +
          (currentTableData.terms["q" + i].calcGPA ? (
            "<br> Calculated: " + currentTableData.terms["q" + i].calcGPA.outOfFive.toFixed(2)
          ) : "")
        );
      }
      selectedElem.replace_text(
        quarterName + " Weighted: " + quarterData.GPA.outOfFive.toFixed(2) +
        "<br> Calculated: " + quarterData.calcGPA.outOfFive.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative Weighted: " + currentTableData.cumGPA.outOfFive.toFixed(2)
      );
    }
    else {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter Weighted: " + currentTableData.terms.current.GPA.outOfFive.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " Weighted: " + currentTableData.terms["q" + i].GPA.outOfFive.toFixed(2)
        );
      }
      selectedElem.replace_text(
        quarterName + " Weighted: " + quarterData.GPA.outOfFive.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative Weighted: " + currentTableData.cumGPA.outOfFive.toFixed(2)
      );
    }
  }
  else if (selectedElem.html().includes("Weighted")) {
    if (quarterData.GPA.percent != quarterData.calcGPA.percent) {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter GPA: " + currentTableData.terms.current.GPA.percent.toFixed(2) +
        "<br> Calculated: " + currentTableData.terms.current.calcGPA.percent.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " GPA: " + currentTableData.terms["q" + i].GPA.percent.toFixed(2) +
          (currentTableData.terms["q" + i].calcGPA ? (
            "<br> Calculated: " + currentTableData.terms["q" + i].calcGPA.percent.toFixed(2)
          ) : "")
        );
      }
      selectedElem.replace_text(
        quarterName + " GPA: " + quarterData.GPA.percent.toFixed(2) +
        "<br> Calculated: " + quarterData.calcGPA.percent.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative GPA: " + currentTableData.cumGPA.percent.toFixed(2)
      );
    }
    else {
      $("#current, #current_gpa, #init_gpa").replace_text(
        "Current Quarter GPA: " + currentTableData.terms.current.GPA.percent.toFixed(2)
      );
      for (let i = 1; i <= 4; i++) {
        $(`#q${i}, #q${i}_gpa`).replace_text(
          "Q" + i + " GPA: " + currentTableData.terms["q" + i].GPA.percent.toFixed(2)
        );
      }
      selectedElem.replace_text(
        quarterName + " GPA: " + quarterData.GPA.percent.toFixed(2)
      );
      $("#cum, #cum_gpa").replace_text(
        "Cumulative GPA: " + currentTableData.cumGPA.percent.toFixed(2)
      );
    }
  }
}

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
  if (vip_username_list.includes(currentTableData.username)) {
    return "#1E8541";
  }

  if (parseFloat(gradeToBeColored) >= 89.5) {
    return "var(--green1)";
  } else if (parseFloat(gradeToBeColored) >= 79.5) {
    return "var(--blue)";
  } else if (parseFloat(gradeToBeColored) >= 69.5) {
    return "var(--orange)";
  } else if (parseFloat(gradeToBeColored) >= 59.5) {
    return "var(--orange1)";
  } else if (parseFloat(gradeToBeColored) >= 0) {
    return "var(--red)";
  } else {
    return "var(--black)";
  }
}

let lightColors = ["#3d995c", "#a3a3f5", "#eba947", "#ebb147", "#eb4747"];
function getLightColor(gradeToBeColored) {
  if (vip_username_list.includes(currentTableData.username)) {
    return "#1E8541";
  }

  if (parseFloat(gradeToBeColored) >= 89.5) {
    return lightColors[0];
  } else if (parseFloat(gradeToBeColored) >= 79.5) {
    return lightColors[1];
  } else if (parseFloat(gradeToBeColored) >= 69.5) {
    return lightColors[2];
  } else if (parseFloat(gradeToBeColored) >= 59.5) {
    return lightColors[3];
  } else if (parseFloat(gradeToBeColored) >= 0) {
    return lightColors[4];
  } else {
    return "black";
  }
}
