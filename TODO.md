# TODO

## Pages
- Home (not logged in)
- Login
  - Login form submit should be intercepted and used as ajax `/login` POST request
    - 200 (OK) -> proceed to dashboard
    - 4xx (Bad Request) -> give incorrect login message
    - Use bootstrap loading+disabled login button while waiting for request
- Dashboard
  - Grades
    - Initially waiting for academics page
    - Upon receipt of academics page data, shows grades for each class as ~4 class cards
    - Makes additional requests for each class
    - As each class data comes in, creates cards for those classes
    - Required data
      - Academics page
      - Class assignments pages
  - Recent Activity
  - Schedule
  - Calendar
  - Announcements


## Server-side routes
- `/index.html` (GET)
  - Dashboard formatted page with only announcements tab
  - Could also have any resources for all users
  - Creates and stores new session
- `/login` (POST) (username, password)
  - Makes one login
    - Login succeeds -> return 200
    - Login fails -> return 4xx
    - Adds login tokens to user's active token list
- `/dashboard.html` (GET)
  - Returns blank dashboard page
  - Page makes many data requests
- `/academics` (GET)


## General Idea

After successfully logging in, the chain of scrapers is released.
Various requests from the `dashboard.html` will `await` on the requests that were released.
The client first gets the `academics` which will await on that. Once it has received the data, it will then send a set of requests to `await` on the class requests.
