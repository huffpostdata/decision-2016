#!/bin/sh

DIR="$(dirname "$0")/input"

set -e -x

mkdir -p input
(cd "$DIR" && wget --continue \
  http://dds.cr.usgs.gov/pub/data/nationalatlas/statesp010g.shp_nt00938.tar.gz \
  https://www2.census.gov/geo/tiger/TIGER2016/CD/tl_2016_us_cd115.zip \
  https://www2.census.gov/geo/tiger/TIGER2016/COUNTY/tl_2016_us_county.zip \
  https://www2.census.gov/geo/tiger/TIGER2016/COUSUB/tl_2016_25_cousub.zip \
  https://www2.census.gov/geo/tiger/TIGER2016/COUSUB/tl_2016_09_cousub.zip \
  https://www2.census.gov/geo/tiger/TIGER2016/COUSUB/tl_2016_23_cousub.zip \
  https://www2.census.gov/geo/tiger/TIGER2016/COUSUB/tl_2016_33_cousub.zip \
  https://www2.census.gov/geo/tiger/TIGER2016/COUSUB/tl_2016_44_cousub.zip \
  https://www2.census.gov/geo/tiger/TIGER2016/COUSUB/tl_2016_50_cousub.zip \
  )

(cd "$DIR" && find . -name '*.zip' -exec unzip -o {} \;)
(cd "$DIR" && find . -name '*.tar.gz' -exec tar zxf {} --overwrite \;)
