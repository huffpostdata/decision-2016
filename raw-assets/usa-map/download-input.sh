#!/bin/sh

DIR="$(dirname "$0")/input"
URLS='https://www2.census.gov/geo/tiger/TIGER2016/CD/tl_2016_us_cd115.zip https://www2.census.gov/geo/tiger/TIGER2016/STATE/tl_2016_us_state.zip'

set -e -x

for url in $URLS; do
  filename=$(basename "$url")
  curl "$url" > "$DIR"/"$filename"
  #(cd "$DIR" && unzip "$filename")
done
