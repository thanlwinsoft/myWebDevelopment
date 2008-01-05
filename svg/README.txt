Download Apache Batik http://xmlgraphics.apache.org/batik/
Apply the patch to make the SVG font contain all glyphs sorted by glyph ID rather than code point:

cd batik-1.7 
patch -p1 < batikOutputAllFontGlyphsInGidOrder20080105.patch
# Build batik and output the font as svg e.g. if the font is Padauk.ttf
./build.sh ttf2svg ~/.fonts/Padauk.ttf -autorange -o Padauk.svg

If you get a java heapspace error, modify build.sh to call java -Xmx256m

Convert the generated SVG font into a format more useful to javascript:

xsltproc svgFont2json.xsl Padauk.svg > Padauk.js


