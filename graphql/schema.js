const { gql } = require("apollo-server-express");

const schema = gql`
  # scrape_assignments function
  type classAssignment {
    name: String
    category: String
    date_assigned: String
    date_due: String
    feedback: String
    assignment_id: String
    special: String
    score: String
    max_score: String
  }

  # for storing the user's relevant aspen tokens
  type tokens {
    session_id: ID
    apache_token: ID
  }

  # scrape_class function
  type studentClass {
    name: String
    grade: Float
    categories: JSON
    assignments: [classAssignment]
    tokens: tokens
  }

  # single attendance entry
  recentAttendanceEntry: {
    date: String
    period: String
    code: String
    classname: String
    dismissed: String
    absent: String
    excused: String
    tardy: String
  }

  # single activity entry
  recentActivityEntry: {
    date: String
    classname: String
    score: String
    assignment: String
  }

  # scrape_recent function
  type recent {
    recentAttendanceArray: [recentAttendanceEntry]
    recentActivityArray: [recentActivityEntry]
    studentName: String
  }

  # scrape_student function
  type studentQuarter {
    classes: [studentClass]
    recent: recent
    username: String
    quarter: Int
  }

  # single schedule entry
  type scheduleEntry {
    id: String
    name: String
    teacher: String
    room: String
    aspenPeriod: String
  }

  # scrape_schedule function
  type schedule {
    black: [scheduleEntry]
    silver: [scheduleEntry]
  }

  # the correct architecture design would be to return  a file link and use the browser for downloading/rendering the file
  type pdfType {
    title: String
    content: String
  }

  # scrape_pdf_files function
  type pdfFiles {
    pdfs: [pdfType]
  }

  # would need to modify scrape.js because statistics is sometimes a string and sometimes an array. not good in general especially for graphql
  type assignmentDetails {
    statistics: 
  }

  # available queries
  type Query {
    getStudentQuarter(username: String!, password: String!, quarter: Int!): studentQuarter
    getSchedule(username: String!, password: String!): schedule
    getPdfFiles(username: String!, password: String!): pdfFiles
    getAssignmentDetails(session_id: ID!, apache_token: ID!, assignment_id: ID!): assignmentDetails
  }
`

export default schema;
