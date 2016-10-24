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
URLS='https://www2.census.gov/geo/tiger/TIGER2016/CD/tl_2016_us_cd115.zip http://dds.cr.usgs.gov/pub/data/nationalatlas/statesp010g.shp_nt00938.tar.gz https://prd-tnm.s3.amazonaws.com/StagedProducts/Small-scale/data/Boundaries/nationp010g.shp_nt00936.tar.gz'

set -e -x

for url in $URLS; do
  filename=$(basename "$url")
  curl "$url" > "$DIR"/"$filename"
done

(cd "$DIR" && find . -name '*.tar.gz' -exec tar zxf {} \;)
