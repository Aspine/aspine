#!/bin/bash
# Build script for a "lite" (purely client-side) version of Aspine

# Note: This script has only been tested with Bash in a GNU environment
# (on Linux); your mileage may vary on BSD, macOS, Cygwin/MSYS (Windows), etc.

rm -r dist-lite/
mkdir -p dist-lite/

cp -r public/* dist-lite/

mappings="$(
grep -A100 'new Map' serve.js \
| grep -A3 '^    \[' \
| grep -Ev '\[|\]' \
| sed 's/        '\''//' \
| sed 's/'\'',*//'
)"
# Find the line in serve.js containing 'new Map' and get the next 100 lines
# Limit the search to lines that contain '    [' and the next three lines
# Remove lines with brackets
# Remove leading whitespace and single quote character
# Remove trailing single quote character and comma (if any)

echo $mappings | \
while read -d ' ' endpoint
do
    read -d ' ' path

    mkdir -p "$(dirname dist-lite$endpoint)"
    # Create the parent directory
    cp ".$path" "dist-lite$endpoint"
    # Copy the node module to dist-lite
done
# https://stackoverflow.com/a/21256704

cp -r ./node_modules/@fortawesome/fontawesome-free/webfonts/ dist-lite/fonts/fontawesome/webfonts
# Copy Font Awesome files

rm dist-lite/login.html
# Remove login page

sed '/Logout/d' -i dist-lite/home.html
# Remove "Logout" button

sed -e '1h;2,$H;$!d;g' -e 's/\
\$\.ajax({\
\ \ \ \ url:\ "\/data.*then(responseCallback);/\
responseCallback({\
    classes: [],\
    recent: {\
        recentActivityArray: [],\
        recentAttendanceArray: []\
    },\
    overview: [],\
    username: "",\
    quarter: "0"\
});/' \
-i dist-lite/js/home.js

sed -e '1h;2,$H;$!d;g' -e 's/\
\$\.ajax({\
\ \ \ \ url:\ "schedule.json.*then(schedulesCallback);/\
schedulesCallback(\
);/' \
-i dist-lite/js/clock.js

sed -e '/schedulesCallback(/r dist-lite/schedule.json' \
-i dist-lite/js/clock.js

# Replace AJAX calls with initialization using blank data
# https://unix.stackexchange.com/a/235016
# https://unix.stackexchange.com/a/32912

version="$(grep version package.json | sed 's/.*: "//' | sed 's/",//')"
# Get version number from package.json

sed -i 's/await \$\.ajax("\/version")/"'$version'"/g' dist-lite/js/*
# Hard-code version number
