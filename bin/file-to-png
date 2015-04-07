#/bin/bash

echo "Processing file: " $1

baseFileName=`basename $1`
baseFileName=${baseFileName%????} #remove extension
echo "baseFileName: " $baseFileName

convert $1 -background white \
  -gravity center \
  -scale 720 -extent 1280x720 \
  PNG24:$2$baseFileName".png"

