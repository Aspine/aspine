#!/bin/bash
# Build script for a "lite" (purely client-side) version of Aspine

# Note: This script has only been tested with Bash in a GNU environment
# (on Linux); your mileage may vary on BSD, macOS, Cygwin/MSYS (Windows), etc.

rm -rf dist-lite/
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

cp -r ./node_modules/@fortawesome/fontawesome-free/webfonts/ \
dist-lite/fonts/fontawesome/webfonts
# Copy Font Awesome files

rm dist-lite/login.html
# Remove login page

perl -0777 -pi -e 's[<!--#ifdef lite>\n((.|\n)*?)\n<#endif-->][\1]g' \
dist-lite/home.html

perl -0777 -pi -e 's[<!--#ifndef lite-->\n((.|\n)*?)\n<!--#endif-->][]g' \
dist-lite/home.html

perl -0777 -pi -e 's[//#ifdef lite\n/\*\n((.|\n)*?)\n\*/\n//#endif][\1]g' \
dist-lite/js/*.js

perl -0777 -pi -e 's[//#ifndef lite\n((.|\n)*?)\n//#endif][]g' \
dist-lite/js/*.js

# Preprocess HTML and JS files to make lite-specific changes as needed
# https://stackoverflow.com/a/1103177
# https://stackoverflow.com/a/5869735

sed -i -e '/#include dist-lite\/schedule.json/r dist-lite/schedule.json' \
dist-lite/js/clock.js
# Include contents of schedule.json
# https://unix.stackexchange.com/a/32912

version="$(git describe)"
sed -i 's/\/\/#include $version/"'$version'"/g' dist-lite/js/*
# Hard-code version number
