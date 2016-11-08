#!/bin/sh
#
# Replays an AP test
#
# Usage:
# 1. Put a whole bunch of "-post" files from the test into a new directory: for
#    instance, "../data-14782/"
# 2. `cd` to the root of `decision-2016`
# 3. `./script/replay.sh <directory-from-step-1>

DIR="$1"
count=0

for timestamp in `ls "$DIR"/reportingUnit.json-*-post | cut -b "${#DIR}-99999" | cut -d- -f2`; do
  count=$((count++))
  if [ $(($count % 20)) = 0 ]; then # speed things up by skipping every 8
    echo "Timestamp $timestamp"
    cp "$DIR"/"reportingUnit.json-${timestamp}-post" "data/reportingUnit.json"
    cp "$DIR"/"district.json-${timestamp}-post" "data/district.json"
    cp "$DIR"/"changelog.tsv-${timestamp}-post" "data/changelog.tsv"
    sleep 5
  fi
done
