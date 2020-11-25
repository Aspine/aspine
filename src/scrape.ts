function scrape_student(username: string, password: string,
    quarter: 0 | 1 | 2 | 3 | 4) {
  return username;
}

// Code for testing purposes
if (require.main === module) {
  const [username, password, ..._] = process.argv.slice(2);
  console.log(scrape_student(username, password, 0));
}

module.exports = {
  scrape_student,
};
