Convert the ttf file into an SVG font e.g using:

grsvg --svg-font ~/.fonts/Padauk.ttf

(where ~/.fonts/Padauk.ttf is the full path to the font)

Convert the generated SVG font into a format more useful to javascript:

xsltproc svgFont2json.xsl Padauk.svg > Padauk.js

