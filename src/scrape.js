/**
 * Serverside
 * Creates an object that can be used to scrape a student's data
 */

// --------------- Parameters ----------------
const THREADS = 10;
// -------------------------------------------

// --------------- Exports -------------------
module.exports = {
	Student: Student
};
// -------------------------------------------

// --------------- Constructor ---------------
function Student(username, password) {
  this.username = username;
  this.login = login;
  this.hello = hello;
}
// -------------------------------------------

/**
 * Creates 10 active login sessions
 */
function login() {
  this.sessions = [{}];
}

/**
 * 
 */
function 
