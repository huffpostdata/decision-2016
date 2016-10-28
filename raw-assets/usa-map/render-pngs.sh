#!/bin/sh

DIR="$(dirname "$0")/../../assets/maps"

set -e -x

cat "$DIR"/president.svg \
  | perl -p -e 's/class="geography"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="20"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome "$DIR"/president-cartogram-thumbnail.png

cat "$DIR"/president.svg \
  | perl -p -e 's/class="cartogram"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="20"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome "$DIR"/president-geography-thumbnail.png

cat "$DIR"/house.svg \
  | perl -p -e 's/class="geography"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="5"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome "$DIR"/house-cartogram-thumbnail.png

cat "$DIR"/house.svg \
  | perl -p -e 's/class="cartogram"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="20"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome "$DIR"/house-geography-thumbnail.png
