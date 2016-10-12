#!/bin/sh

DIR="$(dirname "$0")"/../sample-data

# Test for variables
set -u
: $AP_TEST
: $AP_API_KEY
set +u

curl "https://api.ap.org/v2/elections/2016-11-08?format=json&level=fipscode&test=$AP_TEST&apiKey=$AP_API_KEY&officeID=P,S,H,G" > "$DIR"/fipscode.json
curl "https://api.ap.org/v2/elections/2016-11-08?format=json&level=district&test=$AP_TEST&apiKey=$AP_API_KEY&officeID=P,S,H,G" > "$DIR"/district.json
