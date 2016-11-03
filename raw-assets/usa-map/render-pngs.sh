#!/bin/sh
#
# Writes the "thumbnail" PNGs we use in our map switcher.
#
# Our thumbnails are high-resolution monochrome images -- pretty high resolution. That's
# accurate, scalable, and super-compressible.

DIR="$(dirname "$0")/../../assets/maps"

set -e -x

cat "$DIR"/president.svg \
  | perl -p -e 's/class="geography"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="10"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome -transparent white - \
  | pngquant 2 - > "$DIR"/president-cartogram-thumbnail.png

cat "$DIR"/president.svg \
  | perl -p -e 's/class="cartogram"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="10"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome -transparent white - \
  | pngquant 2 - > "$DIR"/president-geography-thumbnail.png

cat "$DIR"/senate.svg \
  | perl -p -e 's/class="geography"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="10"/g' \
  | perl -p -e 's/\<path class="mesh"/<path fill="black" stroke="white" stroke-width="2"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome -transparent white - \
  | pngquant 2 - > "$DIR"/senate-cartogram-thumbnail.png

cat "$DIR"/senate.svg \
  | perl -p -e 's/class="cartogram"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="10"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome -transparent white - \
  | pngquant 2 - > "$DIR"/senate-geography-thumbnail.png

cat "$DIR"/house.svg \
  | perl -p -e 's/class="geography"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="5"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome -transparent white - \
  | pngquant 2 - > "$DIR"/house-cartogram-thumbnail.png

cat "$DIR"/house.svg \
  | perl -p -e 's/class="cartogram"/opacity="0"/' \
  | perl -p -e 's/\<path class="[A-Z][A-Z].?.?"/<path fill="black" stroke="white" stroke-width="10"/g' \
  | perl -p -e 's/<text /<text opacity="0" /g' \
  | rsvg-convert -w 647 -h 400 -b white \
  | convert - -monochrome -transparent white - \
  | pngquant 2 - > "$DIR"/house-geography-thumbnail.png
