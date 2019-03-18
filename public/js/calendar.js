$ = require('jquery');
require('fullcalendar');

// This list will be distributed to everyone (probably it's own json file, stored in a serverside db
let calendar_list = [
    {name: "aspine", color: 'red',  id: 'hvkmlf3u8blqksh7rtv86vfae0@group.calendar.google.com'},
    {name: "holidays", color: 'blue', id: 'en.usa#holiday@group.v.calendar.google.com'},
    {name: "cpsd", color: 'green', id: 'jc437n16ruh7ecbctl38ihmhb2k0bmfp@import.calendar.google.com'},
];

$(function() {
    // Initialize blank calendar
    $('#calendar').fullCalendar({
        customButtons: {
            add: {
                text: 'add',
                click: () => {
                    $('#calendar-add-modal').css("display", "block");
                }
            },
            settings: {
                text: "settings",
                click: () => {
                    $('#calendar-list-container').slideToggle();
                }
            }
        },
        header: {
            left: 'today',
            center: 'title',
            right: 'add settings'
        },
        footer: {
            left: 'prev,next',
            center: '',
            right: 'month,agendaWeek,agendaDay,listWeek'
        },
        navLinks: true, // can click day/week names to navigate views
        editable: false,
        eventLimit: true, // allow "more" link when too many events
        googleCalendarApiKey: 'AIzaSyDtbQCoHa4lC4kW4g4YXTyb8f5ayJct2Ao',
        eventClick: function(event) {
            if (event.url) {
                window.open(event.url);
                return false;
            }
        }
    })

    init_calendar();

    $('#calendar-list').change(refresh_calendar);

    $('#add-calendar').submit(add_calendar);
    
    $('#calendar-edit-toggle').click(() => {
        $('#calendar-list-container').slideToggle();
    });

    // Get the modal
    var modal = document.getElementById('calendar-add-modal');

    // Get the <span> element that closes the modal
    var span = document.getElementById("calendar-add-close");

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});

function init_calendar() {
    $.get("/get-calendars", function (data) {
        // Populate list of calendars using calendar_list
        calendar_list = data;
        $.get("/get-settings", function (settings) {
            if(typeof(settings.calendars) == "undefined") {
                settings.calendars = [];
            }
            if(typeof(settings) == "string") {
                settings = JSON.parse(settings);
            }
            $('#calendar-list').html("");
            for(let i in data) {
                if(settings.calendars.includes(calendar_list[i].name)) {
                    $('#calendar-list').append(
                        `<li><input type="checkbox" id="calendar-list-${i}" checked><label style="background-color:#${calendar_list[i].color}" for="calendar-list-${i}">${calendar_list[i].name}</label></li>`);
                } else {
                    $('#calendar-list').append(
                        `<li><input type="checkbox" id="calendar-list-${i}"><label style="background-color:#${calendar_list[i].color}" for="calendar-list-${i}">${calendar_list[i].name}</label></li>`);
                }
            }
            refresh_calendar();
        });
    });
}

// Add calendar by appending it to the db and selecting it
function add_calendar() {
    // ajax request to server to add calendar
    $.post("/add-calendar", $('#add-calendar').serialize(), function (data) {
        $('#calendar-add-modal').css("display", "none");
        $('#calendar-list').append(
            `<li><input type="checkbox" id="calendar-list-${calendar_list.length}" checked><label for="calendar-list-${calendar_list.length}">${$('#add-calendar input[name=name]').val()}</label></li>`);
        refresh_calendar();
        init_calendar();
    }).fail(() => {
        $('p#add-calendar-error').html(`Failed to add calendar: ${$('#add-calendar input[name=name]').val()}`);
    });
    return false; // Don't reload the page
}

// Use the checkboxes to find what calendars to display
function refresh_calendar(){
    $("#calendar").fullCalendar('removeEvents');
    for(let i in calendar_list) {
        if($(`#calendar-list-${i}`).prop('checked')) {
            $("#calendar").fullCalendar('addEventSource',
                {
                    googleCalendarId: calendar_list[i].id,
                    color: "#" + calendar_list[i].color
                });
        }
    }
    // save settings
    save_settings();
}

function save_settings() {
    // get calendar settings
    let settings = {calendars: []};
    $("#calendar-list input:checked").each((index, value) => {
        settings.calendars.push($(value).next().html());
    });
    
    // Save calendar settings
    $.post("/set-settings", settings, function (data) {
    });
}
