#!/bin/sh

# Downloads and pre-processes the shapefiles we use to generate our SVG.
#
# Datasets:
# * Small-scale maps of the US: http://nationalmap.gov/small_scale/atlasftp.html?openChapters=chpbound#chpbound
#   This is the state-level map (unchanged) and the national map, which we'll
#   use to clip political-boundary district map.
# * TIGER 115th-Congress district map. These are political boundaries, so we'll
#   clip each to the national map.

DIR="$(dirname "$0")/input"
STATE_FIPS_CODES="09 23 25 33 44 50"

set -e -x

mkdir -p "$DIR"
for fips in $STATE_FIPS_CODES; do
  url="http://www2.census.gov/geo/tiger/TIGER2016/COUSUB/tl_2016_${fips}_cousub.zip"
  filename=$(basename "$url")
  curl "$url" > "$DIR"/"$filename"
done

(cd "$DIR" && find . -name '*.zip' -exec unzip -o {} \;)
