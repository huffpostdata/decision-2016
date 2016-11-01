#!/bin/sh

set -e -x

convert HILLARY-CLINTON_Head.png -trim -resize 100x100 ../../assets/images/splash/clinton-head.png
convert DONALD-TRUMP_Head.png -trim -resize 100x100 ../../assets/images/splash/trump-head.png
