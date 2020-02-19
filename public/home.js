////////////////////Global Variables///////
let pdf_index = 0;
let termConverter = ['current', 'q1', 'q2', 'q3', 'q4'];
let pdfrendering = false;
      let statsModal = document.getElementById('stats_modal');
let term_dropdown_active = true;
let currentTerm = "current";

      // When the user clicks anywhere outside of the modal, close it
      window.addEventListener("click", function(event) {
        if (event.target == statsModal) {
          hideModal();
        }
  pdf_closeAllSelect();
  closeAllSelect();
      });

      $('#stats_plot').width($(window).width() * 7 / 11);
      window.addEventListener('resize', function() { 
  // console.log("Resizing");
  // if ($('#stats_plot').is(":visible")) { 

  //   Plotly.Plots.resize(document.getElementById('stats_plot')); 
  //   let update_size = {
  //     //width: 800,  // or any new width
  //     width: $('#stats_modal_content').width(),
  //     height: 120  // " "
  //   };

  //   Plotly.relayout('stats_plot', update_size);
  // }

  // if ($('#pdf-canvas').is(":visible") && !pdfrendering && typeof tableData.pdf_files !== 'undefined') { 
  //   generate_pdf(pdf_index);
  // }
});
      let hideModal = function() {
          document.getElementById('stats_modal').style.display = "none";
          noStats();
      }
      let noStats = function() {
          //document.getElementById("there_are_stats").style.display = "none";
          //document.getElementById("there_are_stats").style.display = "none";
  $("#there_are_stats").hide();
  $("#there_are_no_stats").show();
  document.getElementById("no_stats_caption").innerHTML = "No Statistics Data for this assignment";
          document.getElementById("stats_modal_caption").style.top = "7px";
          document.getElementById("stats_modal_content").style.height = "80px";
          //document.getElementById("stats_modal_content").style.margin = "300px auto";
          document.getElementById("stats_modal_content").style.top = "140px";
      }

      //let request = require('request');
      let tableData = {};
      let selected_class_i;
      //let classesReset = {};
let termsReset = {};

      let recentAttendance = new Tabulator("#recentAttendance", {

      //	height: 400,

          layout:"fitColumns",

          columns: [
              {title:"Date", field:"date", headerSort: false},
              {title:"Class", field:"classname", headerSort: false},
              {title:"Period", field:"period", headerSort: false},
              {title:"Event", field:"event", headerSort: false,},
              ],

      });
      let recentActivity = new Tabulator("#recentActivity", {

      //	height: 400,

          layout:"fitColumns",

          columns: [
              {title:"Date", field:"date", formatter: rowFormatter},
              {title:"Class", field:"classname", formatter: classFormatter},
              {title:"Assignment", field:"assignment", formatter: rowFormatter, headerSort: false},
              {title:"Score", field:"score", formatter: rowFormatter, headerSort: false},
              {title:"Max Score", field:"max_score", formatter: rowFormatter, headerSort: false},
              {title:"Percentage", field:"percentage", formatter: rowGradeFormatter},
              ],
  rowClick:function(e, row){ //trigger an alert message when the row is clicked
    // questionable
    $("#mostRecentDiv").hide();
    classesTable.selectRow(1);


      var elem = document.getElementById("default_open");
      var evt = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
      });
      // If cancelled, don't dispatch our event
      var canceled = !elem.dispatchEvent(evt);

    assignmentsTable.clearFilter();
              document.getElementById("categoriesTable").style.display = "block";
              document.getElementById("assignmentsTable").style.display = "block";
              selected_class = row.getData().classname;
              tabledata = classesTable.getData();
    classesTable.deselectRow();
    classesTable.selectRow(selected_class);
    //classesTable.getRows()
    //    .filter(row => row.getData().name == selected_class)
    //    .forEach(row => row.toggleSelect());



              for(let i in tabledata) {
                  if(tabledata[i].name == row.getData().classname) {
                      assignmentsTable.setData(tabledata[i].assignments);
                      categoriesTable.setData(tabledata[i].categoryDisplay);
                      return;
                  }
              }

    classesTable.selectRow(1);

          },


      });
      let categoriesTable = new Tabulator("#categoriesTable", {

      //	height: 400,

          selectable:1,
          layout:"fitColumns",
  layoutColumnsOnNewData:true,
          columns: [
              {title:"Category", field:"category", formatter: rowFormatter, headerSort: false},
              {title:"Weight", field:"weight", formatter:weightFormatter, headerSort: false},
              {title:"Score", field:"score", formatter: rowFormatter, headerSort: false},
              {title:"Max Score", field:"maxScore", formatter: rowFormatter, headerSort: false},
              {title:"Percentage", field:"grade", formatter: rowGradeFormatter, headerSort:false},
              //filler column to match the assignments table
              //{title: "", width:1, align:"center", headerSort: false}, 
              {title: "Hide", titleFormatter:hideCategoriesFormatter, headerClick: hideCategoriesTable, width:76, headerSort: false},
              ],
  rowClick:function(e, row){ //trigger an alert message when the row is clicked
    assignmentsTable.clearFilter();
    assignmentsTable.addFilter([
      {field: "category", type:"=", value: row.getData().category}
      ]);
          },


      });

      let mostRecentTable = new Tabulator("#mostRecentTable", {


      //	height: 400,

          layout:"fitColumns",

          columns: [
              //{title:"Date", field:"date", formatter: rowFormatter, headerSort: false},
              {title:"Date", field:"date", formatter: rowFormatter},
              {title:"Class", field:"classname", formatter: classFormatter},
              {title:"Assignment", field:"assignment", formatter: rowFormatter, headerSort: false},
              {title:"Score", field:"score", formatter: rowFormatter, headerSort: false},
              {title:"Max Score", field:"max_score", formatter: rowFormatter, headerSort: false},
              {title:"Percentage", field:"percentage", formatter: rowGradeFormatter},
              ],
  rowClick:function(e, row){ //trigger an alert message when the row is clicked

    $("#mostRecentDiv").hide();

    classesTable.selectRow(1);


      var elem = document.getElementById("default_open");
      var evt = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
      });
      // If cancelled, don't dispatch our event
      var canceled = !elem.dispatchEvent(evt);

    assignmentsTable.clearFilter();
              document.getElementById("categoriesTable").style.display = "block";
              document.getElementById("assignmentsTable").style.display = "block";
              selected_class = row.getData().classname;
              tabledata = classesTable.getData();
    classesTable.deselectRow();
    classesTable.selectRow(selected_class);
    //classesTable.getRows()
    //    .filter(row => row.getData().name == selected_class)
    //    .forEach(row => row.toggleSelect());



              for(let i in tabledata) {
                  if(tabledata[i].name == row.getData().classname) {
                      assignmentsTable.setData(tabledata[i].assignments);
                      categoriesTable.setData(tabledata[i].categoryDisplay);
                      return;
                  }
              }

    classesTable.selectRow(1);

          },

      });


      //create Tabulator on DOM element with id "assignmentsTable"
      let assignmentsTable = new Tabulator("#assignmentsTable", {
          height:600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
          //data:tabledata[0].assignments, //assign data to table
          layout:"fitColumns", //fit columns to width of table (optional)
          //rowFormatter:function(row) {
          //	row.getElement().style.backgroundColor = row.getData().color;
          //},
          dataEdited: editAssignment,
          columns:[ //Define Table Columns
              {title:"Assignment", field:"name", editor:"input", formatter: rowFormatter, headerSort:false},
              {title:"Category", field:"category", editor:"select",
                  editorParams:function(cell) {
                      let catCategories = [];

                      for (let k = 0; k < Object.keys(tableData.currentTermData.classes[selected_class_i].categories).length; k++) {
                          catCategories.push((Object.keys(tableData.currentTermData.classes[selected_class_i].categories)[k] + " (" + (Object.values(tableData.currentTermData.classes[selected_class_i].categories)[k] * 100)+ "%)"));
                      }
                      return {values: catCategories};
                  },
                  formatter: rowFormatter, headerSort:false,
              },
              {title:"Score", field:"score", editor:"number", editorParams:{min:0, max:100, step:1,}, formatter: rowFormatter, headerSort:false,},
              {title:"Max Score", field:"max_score", editor:"number", editorParams:{min:0, max:100, step:1,}, formatter: rowFormatter, headerSort:false,},
              {title:"Percentage", field: "percentage", formatter: rowGradeFormatter, headerSort:false,},
              {title: "Stats", titleFormatter: statInfoHeaderFormatter, formatter: statInfoFormatter, width:40, align:"center", cellClick: async function(e, cell){

              if (!isNaN(cell.getRow().getData().score)) {
                  noStats();
                  document.getElementById("no_stats_caption").innerHTML = "Loading Statistics...";
                  //document.getElementById("stats_modal_title").innerHTML = "";
                  document.getElementById('stats_modal').style.display = "inline-block";
      //$("#there_are_stats").hide();
      //$("#there_are_no_stats").show();
      //document.getElementById("stats_modal_caption").style.top = "7px";
      //document.getElementById("stats_modal_content").style.height = "80px";
      //document.getElementById("stats_modal_content").style.margin = "300px auto";
      //document.getElementById("stats_modal_content").style.top = "140px";

                  let session_id = tableData.currentTermData.classes[selected_class_i].tokens.session_id;
                  let apache_token = tableData.currentTermData.classes[selected_class_i].tokens.apache_token;
                  let assignment_id = cell.getRow().getData().assignment_id;
                  let assignment = cell.getRow().getData().name;
                  let score = cell.getRow().getData().score;
                  let max_score = cell.getRow().getData().max_score;
      let date_assigned = cell.getRow().getData().date_assigned;
      let date_due = cell.getRow().getData().date_due;
      let assignment_feedback = cell.getRow().getData().feedback;
      if (assignment_feedback == "") {
        assignment_feedback = "None";

        //"From this it follows that A is maximized when b = 0. b = 0 when $x = y$ which gives that A is maximized when the area takes the shape of a square. From this it follows that A is maximized when b = 0. b = 0 when $x = y$ which gives that A is maximized when the area takes the shape of a square.";
      }

                  
                  let stats = await window.getStats(session_id, apache_token, assignment_id);
                  //let stats = '["8","6","8","7.5"]';
                  //let stats = 'No Statistics Data for this assignment';

                  if (stats.indexOf("[") === 0) {
                      stats = stats.substring(1, stats.length - 1);

                      stats = stats.split(",");
                      stats = stats.map(x => parseFloat(x.substring(1, x.length)));
        // console.log("Raw Stats: " + stats);
                      let high = stats[0], low = stats[1], median = stats[2], mean = stats[3];
        let q1 = (low + median) / 2, q3 = (high + median) / 2;

        let graph_stats = [low, q1, median, q3, high];
        // console.log("Graph Stats: " + graph_stats);
        // console.log("Mean: " + mean)

                      var statsTrace = {
                        x: graph_stats,
                        type: 'box',
                          name: " ",
          marker:{
              //color: '#268A48'
              color: '#ff66ff'
            }
                      };

        
                      var data = [statsTrace];

                      let layout = {
                          title: " ",
                          width: $('#stats_modal_content').width(),
                          height: 120,

                          xaxis: {
                              title: " ",
                              zeroline: true,
                              range: [0, 15 * max_score / 14],
            tickfont: {
              family: 'Poppins-Bold, Arial, Helvetica, sans-serif',
              size: 12,
              color: '#000',
            },
                          },

                          yaxis: {
                              range: [-1.15, 0.7],
            tickfont: {
              family: 'Poppins-Bold, Arial, Helvetica, sans-serif',
              size: 12,
              color: '#000',
            },
                          },

                          margin: {
                              t: 20,
                              l: 20,
                              r: 20,
                              b: 20,
                          },
                          shapes: [
            //your score line
                              {
                                  type: 'line',
                                  x0:score  - (max_score / 1000),
                                  y0:-0.50,
                                  x1: score - (max_score / 1000),
                                  y1: 0.50,
                                  line: {
                                      color: getColor(score / max_score * 100),
                                      width: 3,
                                  },
                              },
            //mean line
                              {
                                  type: 'line',
                                  x0:mean - (max_score / 1000),
                                  y0:-0.5,
                                  x1: mean - (max_score / 1000),
                                  y1: 0.5,
                                  line: {
                                      color: getLightColor(mean / max_score * 100),
                                      width: 3,
                                  },
                              },

                          ],

          annotations: [
            {
              x: mean - (max_score / 68),
              y: -.65,
              xref: 'x',
              yref: 'y',
              text: 'Mean',
              showarrow: false,
              font: {
                family: 'Poppins-Bold, Arial, Helvetica, sans-serif',
                size: 12,
                                      color: getLightColor(mean / max_score * 100),
              },
            },
            {
              x: score - (max_score / 38),
              y: .65,
              xref: 'x',
              yref: 'y',
              text: 'Your Score',
              showarrow: false,
              font: {
                family: 'Poppins-Bold, Arial, Helvetica, sans-serif',
                size: 12,
                                      color: getColor(score / max_score * 100),
              },
            },
          ],
                      };
        for (let i = 5; i <= 10; i++) {
            let shape = {
              type: 'line',
              x0: max_score * i / 10,
              y0: -0.90,
              x1: max_score * i / 10,
              y1: -1.15,
              line: {
                color: getColor(i * 10),
                width: 2,
              },
            };
            layout.shapes.push(shape);
        }
      for (let i = 5; i <= 9; i++) {
            let annotation = {
              x: max_score * i / 10 + max_score / 20,
              y: -1.05,
              xref: 'x',
              yref: 'y',
              text: getLetterGrade(((i + 0.5) / 10) * 100),
              showarrow: false,
              font: {
                family: 'Poppins-Bold, Arial, Helvetica, sans-serif',
                size: 12,
                                      color: getColor(((i + 0.5) / 10) * 100),
              },
            }
            layout.annotations.push(annotation);
      }

                  


                      let TESTER = document.getElementById("stats_plot");

                      TESTER.style.display = "inline";

                      Plotly.newPlot(TESTER, data, layout, {displayModeBar: false, responsive: true, });

  
                      document.getElementById("stats_modal_title").innerHTML = "Assignment: " + assignment.substring(0, 30);
                      document.getElementById("stats_modal_caption").style.top = "48px";
      document.getElementById("stats_modal_caption").innerHTML = "Low: " + low + ", Median: " + median + ", High: " + high + "<br>" + "Mean: " + mean; 
        document.getElementById("stats_modal_info").innerHTML = "<br><br>" + "Date Assigned: " + date_assigned + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;" + "Date Due: " + date_due;
       $("#stats_modal_feedback").html("Assignment Feedback: " + assignment_feedback);

                      document.getElementById("stats_modal_content").style.height = "465px";

                      document.getElementById("stats_modal_content").style.margin = "15% auto";
        $("#there_are_stats").show();
        $("#there_are_no_stats").hide();
                  } else {
                      
                      noStats();
                      
                  }
              }

                  

              }, headerSort:false,},
              {title: "Add", titleFormatter:addAssignmentFormatter, headerClick: newAssignment, formatter:"buttonCross", width:40, align:"center", cellClick:function(e, cell){
                  cell.getRow().delete();
              }, headerSort:false,},
          ],
      });
      //create Tabulator on DOM element with id "scheduleTable"
      let scheduleTable = new Tabulator("#scheduleTable", {
          layout:"fitDataFill", //fit columns to width of table (optional)
          rowFormatter:function(row) {
              row.getElement().style.transition = "all 1s ease";
              row.getElement().style.backgroundColor = row.getData().color;
          },
          columns:[ //Define Table Columns
              {title:"Period", field:"period", width: 150, headerSort:false, formatter: "html"},
              {title:"Room", field:"room", width: 150, headerSort:false},
              {title:"Class", field:"class", headerSort:false, formatter: "html"},
          ],
      });
      let classesTable = new Tabulator("#classesTable", {
          //height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
          index: "name",
          selectable: 1,
          layout: "fitColumns", //fit columns to width of table (optional)
          columns: [ // Define Table Columns
              {title:"Class", field:"name", formatter: classesRowFormatter, headerSort:false},
              {title:"Grade", field:"grade", align:"left", formatter:gradeFormatter, headerSort:false},
            {title: "Hide", titleFormatter:refreshClassFormatter, headerClick: resetTableData, width:76, headerSort: false},
          ],
          rowClick: function(e, row) { // trigger an alert message when the row is clicked
              $("#mostRecentDiv").hide();
              assignmentsTable.clearFilter();
              document.getElementById("categoriesTable").style.display = "block";
              document.getElementById("assignmentsTable").style.display = "block";
              selected_class_i = row.getPosition();
    // console.log("set " + row.getPosition() + "as selected class");
              tabledata = classesTable.getData();
              for (let i in tabledata) {
                  if(tabledata[i].name == row.getData().name) {
                      assignmentsTable.setData(tabledata[i].assignments);
                      categoriesTable.setData(tabledata[i].categoryDisplay);
                      return;
                  }
              }
          },
      });
      
      // Callback for response from /data
      function responseCallback(response) {
      // console.log(response);
      if (response.recent.login_fail) {
        location.href='/logout';
      }

          if (response.classes.length == 0) {
              response.classes = [{
                  "name": "No Classes",
                  "grade": "No Grades",
                  "categories": {
                      "No Categories": "1.0"
                  },
                  "assignments": [{
                      "name": "No Assignments",
                      "category": "No Categories",
                      "assignment_id": "GCD000000Fx62l",
                      "special": "No Special",
                      "score": 10,
                      "max_score": 10,
                      "percentage": 100,
                      "color": "#6666FF"
                  }],
                  "edited": false,
                  "categoryDisplay": [{
                      "category": "No Categories",
                      "weight": "100%",
                      "score": 10,
                      "maxScore": 10,
                      "grade": "100%",
                      "color": "#6666FF"
                  }],
                  "type": "categoryPercent",
                  "calculated_grade": "100 A+",
                  "color": "#1E8541"
              }];
          }

  if (typeof tableData !== 'undefined') {
      tableData.recent = response.recent;
      tableData.overview = response.overview;
      tableData.username = response.username;


  } else {
      tableData = {};
      tableData.recent = response.recent;
      tableData.overview = response.overview;
      tableData.username = response.username;
  }

  $("#loader").hide();


               //parsing the data extracted by the scrappers, and getting tableData ready for presentation


      if (typeof tableData.terms == 'undefined') {
        tableData.terms = {
          current: {},
          q1: {},
          q2: {},
          q3: {},
          q4: {},
        };

      }

  if (typeof tableData.currentTermData == 'undefined') {
    tableData.currentTermData = {};
  }
      tableData.currentTermData = parseTableData(response.classes);
      

      tableData.terms[currentTerm] = parseTableData(response.classes);




          //populates the event for each row in the recentAttendance table
          for (let i = 0; i < tableData.recent.recentAttendanceArray.length; i++) {
              tableData.recent.recentAttendanceArray[i].event = "";
              if (tableData.recent.recentAttendanceArray[i].dismissed === "true") {
                  tableData.recent.recentAttendanceArray[i].event += "Dismissed ";
              }
              if (tableData.recent.recentAttendanceArray[i].excused === "true") {
                  tableData.recent.recentAttendanceArray[i].event += "Excused ";
              }
              if (tableData.recent.recentAttendanceArray[i].absent === "true") {
                  tableData.recent.recentAttendanceArray[i].event += "Absent ";
              }
              if (tableData.recent.recentAttendanceArray[i].tardy === "true") {
                  tableData.recent.recentAttendanceArray[i].event += "Tardy ";
              }
          }


          let activityArray = tableData.recent.recentActivityArray.slice();
          for (let i = 0; i < activityArray.length; i++) {
              try {
                  let assignmentName = activityArray[i].assignment;
                  let className = activityArray[i].classname;
                  let temp_classIndex = classIndex(className);

                  let assignmentIndex = tableData.currentTermData.classes[temp_classIndex].assignments.map(x => x.name).indexOf(assignmentName);

                  tableData.recent.recentActivityArray[i].assignmentName = assignmentName;
                  tableData.recent.recentActivityArray[i].className = className;
                  tableData.recent.recentActivityArray[i].temp_classIndex = temp_classIndex;
                  tableData.recent.recentActivityArray[i].assignmentIndex = assignmentIndex;

                  tableData.recent.recentActivityArray[i].max_score = tableData.currentTermData.classes[temp_classIndex].assignments[assignmentIndex].max_score;
                  tableData.recent.recentActivityArray[i].percentage = tableData.currentTermData.classes[temp_classIndex].assignments[assignmentIndex].percentage;
                  tableData.recent.recentActivityArray[i].color = tableData.currentTermData.classes[temp_classIndex].assignments[assignmentIndex].color;
                  } catch(err) {
                      console.log("Please report this error on the Aspine github issue pages. ID Number 101. Error: " + err);
      }

  }

  // Calculate GPA for current term
  tableData.terms.current.GPA = computeGPA(tableData.terms.current.classes);

  tableData.overview = response.overview;
  
document.getElementById("cumGPA").innerHTML = "<h3>Cumulative GPA:</h3>" + "<p>Percent: " + cumGPA(1) + "</p><p>Unweighted: " + cumGPA(2) + "</p><p>Weighted: " +  cumGPA(3) +"</p>";//SET CUM GPA FIELD TO PERCENT 
  
  // Calculate GPA for each quarter
  for (let i = 1; i <= 4; i++) {
    tableData.terms["q" + i].GPA = computeGPAQuarter(tableData.overview,i);
  }

          //Stuff to do now that tableData is initialized

          $("#mostRecentDiv").show();
          mostRecentTable.setData(tableData.recent.recentActivityArray.slice(0, 5));

    initialize_quarter_dropdown();
              termsReset[currentTerm] = JSON.parse(JSON.stringify(tableData.terms[currentTerm]));

              $(".select-selected").html("Current Quarter GPA Percent: " + tableData.currentTermData.GPA.percent);
    $("#current").html("Current Quarter GPA: " + tableData.currentTermData.GPA.percent);
    document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA: " + tableData.currentTermData.GPA.percent;
    document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA: " + tableData.currentTermData.GPA.percent;

    $(".select-items").children().each(function(i, elem) {
		if(i < 5) {//Don't try to get quarter data for the 5th element in the list because that's not a quarter...
	  if (i == 0) {
        $(this).html("Current Quarter GPA: " + tableData.terms["current"].GPA.percent);
        document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA: " + tableData.terms["current"].GPA.percent;
        document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA: " + tableData.terms["current"].GPA.percent;
      } else {
        if (!isNaN(tableData.terms["q" + i].GPA.percent)) {
          $(this).html("Q" + i + " GPA: " + tableData.terms["q" + i].GPA.percent);
          document.getElementById('gpa_select').options[i + 1].innerHTML ="Q" + i + " GPA: " + tableData.terms["q" + i].GPA.percent; 
        } else {
          $(this).html("Q" + i + " GPA: None");
          document.getElementById('gpa_select').options[i + 1].innerHTML ="Q" + i + " GPA: None"; 
        }
      }
  	}
    });
              // scheduleTable.setData(tableData.schedule.black);
              recentActivity.setData(tableData.recent.recentActivityArray);
              recentAttendance.setData(tableData.recent.recentAttendanceArray);

          classesTable.setData(response.classes); //set data of classes table to the tableData property of the response json object


          $.ajax({
              url: "/schedule",
              method: "POST",
              dataType: "json json",
              success: scheduleCallback
          });
      }
      
      
	  function cumGPA(type) {
		  let sumGPA = 0;
		  let sumOutOfFour = 0;
		  let sumOutOfFive = 0;
		  
		  let count = 0;
		  for(var i = 1; i <= 4; i ++) {
			  
			  if (!isNaN(computeGPAQuarter(tableData.overview,i).percent)) {
		  sumGPA += computeGPAQuarter(tableData.overview,i).percent;   
		  sumOutOfFour += computeGPAQuarter(tableData.overview,i).outOfFour;   
		  sumOutOfFive += computeGPAQuarter(tableData.overview,i).outOfFive;   
		  
		  count ++;
	  }
		  
	  }
	  if(type == 1) {
		  return (sumGPA/count).toFixed(2);
	  }
	  if(type == 2) {
		  return (sumOutOfFour/count).toFixed(2);
		  
	  }
	  if(type == 3) {
		  return (sumOutOfFive/count).toFixed(2);
		  
	  } 		 
	}
		 
	
	
	  
	  
      function GPAType() {
        let selectElem = $("#gpa_select");
        let selectedElem = $(".select-selected");
        let selection = $("#gpa_select option")[selectElem.prop("selectedIndex")].value;
        
        let quarterName = "";
        let quarterData;

        if (selection == 0) {
           quarterName = "Current Quarter";
           quarterData = tableData.terms.current;
        }
        else {
            quarterName = "Q" + selection;
            quarterData = tableData.terms["q" + selection];
        }
         
        if (selectedElem.html().includes("GPA")) {
			
			if (quarterData.GPA.outOfFour != quarterData.calcGPA.outOfFour) {
			
            selectedElem.html(quarterName + " Unweighted: " + quarterData.GPA.outOfFour + "\n Calculated: " +quarterData.calcGPA.outOfFour);
			
		}
		
		else {
			selectedElem.html(quarterName + " Unweighted: " + quarterData.GPA.outOfFour);
			
		}
			
			
        }
        else if (selectedElem.html().includes("Unweighted")) {
			
			if (quarterData.GPA.outOfFive != quarterData.calcGPA.outOfFive) {
			
            selectedElem.html(quarterName + " Weighted: " + quarterData.GPA.outOfFive + "\n Calculated: " + quarterData.calcGPA.outOfFive);
			}
			else {
				selectedElem.html(quarterName + " Weighted: " + quarterData.GPA.outOfFive);
				
			}
			
        }
        else if (selectedElem.html().includes("Weighted")) {
			
			if (quarterData.GPA.percent != quarterData.calcGPA.percent) {
            selectedElem.html(quarterName + " GPA: " +  quarterData.GPA.percent + "\n Calculated: " + quarterData.calcGPA.percent);
			}
			else {
				selectedElem.html(quarterName + " GPA: " +  quarterData.GPA.percent);
			}
			
        }
      }

function responseCallbackPartial(response) {
  $("#loader").hide();

      tableData.currentTermData = parseTableData(response.classes);
      
      let temp_term_data = parseTableData(response.classes);
      tableData.terms[currentTerm].classes = temp_term_data.classes;
      tableData.terms[currentTerm].GPA = temp_term_data.calcGPA;      
	  tableData.terms[currentTerm].calcGPA = parseTableData(response.classes).calcGPA;
	  

      if (currentTerm == 'current') {
        $(".select-selected").html("Current Quarter GPA: " + tableData.currentTermData.GPA.percent);
        $("#current").html("Current Quarter GPA: " + tableData.currentTermData.GPA.percent);
        document.getElementById('gpa_select').options[0].innerHTML = "Current Quarter GPA: " + tableData.currentTermData.GPA.percent;
        document.getElementById('gpa_select').options[1].innerHTML = "Current Quarter GPA: " + tableData.currentTermData.GPA.percent;
		
      } else {
        $(".select-selected").html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.currentTermData.GPA.percent);
        $("#q" + termConverter.indexOf(currentTerm)).html("Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.currentTermData.GPA.percent);
        document.getElementById('gpa_select').options[termConverter.indexOf(currentTerm) + 1].innerHTML ="Q" + termConverter.indexOf(currentTerm) + " GPA: " + tableData.currentTermData.GPA.percent; 
      }


      scheduleTable.setData(tableData.schedule.black);

      $("#classesTable").show();

      classesTable.setData(response.classes); //set data of classes table to the tableData property of the response json object
      classesTable.redraw();

      termsReset[currentTerm] = JSON.parse(JSON.stringify(tableData.terms[currentTerm]));

      term_dropdown_active = true;


      }


      // Callback for response from /schedule
      function scheduleCallback(response) {
          if (!tableData.schedule) tableData.schedule = response;

          document.getElementById("scheduleTable").style.rowBackgroundColor = "black";
          //the following lines are used to set up the schedule table correctly
          //let periods = ["Period 1",  "CM/OTI", "Period 2", "Period 3", "Period 4"];
          let periods = tableData.schedule.black.slice().map(x => x.aspenPeriod.substring(x.aspenPeriod.indexOf("-") + 1));
          let placeTimes = ["8:05 - 9:25", "9:29 - 9:44", "9:48 - 11:08", "11:12 - 1:06", "1:10 - 2:30"];
          let timesCounter = 0;
          let times = []

          
          for (let i = 0; i < periods.length; i++) {

              if (!isNaN(parseFloat(periods[i])) || periods[i] === "CM") {
                  times[i] = placeTimes[timesCounter];
                  timesCounter++;
              } else {
                  times[i] = "";
              }

          }

          periods = periods.filter(Boolean).map(x => "Period: " + x);


          let colors = ["#63C082", "#72C68E", "#82CC9B", "#91D2A7", "#A1D9B4", "#B1DFC0", "#C0E5CD", "#D0ECD9"];
  
  for (let i = 0; i < periods.length;  i++) {
     
                  if (tableData.schedule.black[i]) {
                      tableData.schedule.black[i].period = periods[i] ? periods[i] + "<br>" + times[i] : "Extra";
                      tableData.schedule.black[i].class = tableData.schedule.black[i].name + "<br>" + tableData.schedule.black[i].teacher;
                      tableData.schedule.black[i].color = colors[i] ? colors[i] : colors[colors.length - 1];
                  }
                  if (tableData.schedule.silver[i]) {
                      tableData.schedule.silver[i].period = periods[i] ? periods[i] + "<br>" + times[i] : "Extra";
                      tableData.schedule.silver[i].class = tableData.schedule.silver[i].name + "<br>" + tableData.schedule.silver[i].teacher;
                      tableData.schedule.silver[i].color = colors[colors.length - 1 - i] ? colors[colors.length - 1 - i] : colors[0];
                  }
  }

          scheduleTable.setData(tableData.schedule.black);

          redraw_clock();
      }

      function pdfCallback(response) {

  $("#loader").hide();
  // console.log(response);
          tableData.pdf_files = response;
          
          initialize_pdf_dropdown();
          $("#pdf_loading_text").hide();

          if (typeof tableData.pdf_files !== 'undefined') {
              generate_pdf(pdf_index);
          }
      }

      $.ajax({
          url: "/data",
          method: "POST",
  data: { quarter: 0 },
          dataType: "json json",
          success: responseCallback
      });

      function recent_toggle() {
          if (!document.getElementById("recent_toggle").checked) {
              //recentActivity.setData(tableData.recent.recentActivityArray);
              document.getElementById("recentActivity").style.display = "block";
              document.getElementById("recentAttendance").style.display = "none";
              document.getElementById("recent_title").innerHTML = "Assignments";
                  recentActivity.redraw();
          } else {
              //recentActivity.setData(tableData.recent.recentAttendanceArray);
              document.getElementById("recentActivity").style.display = "none";
              document.getElementById("recentAttendance").style.display = "block";
              document.getElementById("recent_title").innerHTML = "Attendance";
                  recentAttendance.redraw();
          }
      }
      function schedule_toggle() {
          if (document.getElementById("schedule_toggle").checked) {
              scheduleTable.setData(tableData.schedule.silver);
              document.getElementById("schedule_title").innerHTML = "Silver";
              redraw_clock();
          } else {
              scheduleTable.setData(tableData.schedule.black);
              document.getElementById("schedule_title").innerHTML = "Black";
              redraw_clock();
          }
      }
  function openTab(evt, tab_name) {
      // Declare all variables
      var i, tabcontent, tablinks;

      // Get all elements with class="tabcontent" and hide them
      tabcontent = document.getElementsByClassName("tabcontent");
      for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
      }

      // Get all elements with class="tablinks" and remove the class "active"
      tablinks = document.getElementsByClassName("tablinks");
      for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
      }

      // Show the current tab, and add an "active" class to the button that opened the tab
      document.getElementById(tab_name).style.display = "block";
      evt.currentTarget.className += " active";

      if(tab_name == "clock") {
          document.getElementById("small_clock").style.display = "none";
          document.getElementById("small_clock_period").style.display = "none";
      } else {
          document.getElementById("small_clock").style.display = "block";
          document.getElementById("small_clock_period").style.display = "block";
      }
      if (tab_name =="grades") {
                      //$("#mostRecentDiv").show();
          mostRecentTable.redraw();

      }

if (tab_name == "reports") {
          if (!tableData.pdf_files) {
    $("#loader").show();
              $.ajax({
                  url: "/pdf",
                  method: "POST",
                  dataType: "json json",
                  success: pdfCallback
              });
          }
          else if (typeof tableData.pdf_files !== 'undefined') {
              generate_pdf(pdf_index);
          }
      }
      if (tab_name == "schedule" && !tableData.schedule) {
          $.ajax({
              url: "/schedule",
              method: "POST",
              dataType: "json json",
              success: scheduleCallback
          });
      }

      classesTable.redraw();
      assignmentsTable.redraw();
      scheduleTable.redraw();
      categoriesTable.redraw();
      recentActivity.redraw();
      recentAttendance.redraw();
  }
  document.getElementById("default_open").click();
  
  
  
 
