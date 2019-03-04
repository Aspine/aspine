//import $ from 'jquery';
//import 'fullcalendar';
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
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay,listWeek'
        },
        navLinks: true, // can click day/week names to navigate views
        editable: false,
        eventLimit: true, // allow "more" link when too many events
        googleCalendarApiKey: 'AIzaSyDtbQCoHa4lC4kW4g4YXTyb8f5ayJct2Ao',
    })

    // Populate list of calendars using calendar_list
    for(let i in calendar_list) {
        $('#calendar-list').append(
            `<input type="checkbox" id="calendar-list-${i}" checked><label for="calendar-list-${i}">${calendar_list[i].name}</label><br>`);
    }
    refresh_calendar();

    $('#calendar-list').change(refresh_calendar);

    $('#add-calendar').click(add_calendar());
});

// Add calendar by appending it to the db and selecting it
function add_calendar() {
    // ajax request to server to add calendar
}

// Use the checkboxes to find what calendars to display
function refresh_calendar(){
    $("#calendar").fullCalendar('removeEvents');
    for(let i in calendar_list) {
        //console.log($(`#calendar-list-${i}`).prop('checked'));
        if($(`#calendar-list-${i}`).prop('checked')) {
            $("#calendar").fullCalendar('addEventSource',
                {
                    googleCalendarId: calendar_list[i].id,
                    color: calendar_list[i].color
                });
            console.log("adding calendar");
        }
    }
}
