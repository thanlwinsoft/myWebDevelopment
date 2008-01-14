<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
xmlns="http://www.w3.org/1999/xhtml" xmlns:svg="http://www.w3.org/2000/svg"
>
<xsl:output method="text" indent="no"/>

<xsl:template match="svg:font">
<xsl:text>var svgFont_</xsl:text>
<xsl:value-of select="svg:font-face/@font-family"/>
<xsl:text> = {
unitsPerEm:</xsl:text><xsl:value-of select="svg:font-face/@units-per-em"/><xsl:text>,
ascent:</xsl:text><xsl:value-of select="svg:font-face/@ascent"/><xsl:text>,
descent:</xsl:text><xsl:value-of select="svg:font-face/@descent"/><xsl:text>,
glyphs:[
</xsl:text>
<xsl:apply-templates/>
<xsl:text>]};

</xsl:text>
<!--<xsl:text>glyphCount:</xsl:text><xsl:value-of select="count(svg:missing-glyph|svg:glyph)"/>-->
</xsl:template>

<xsl:template match="svg:font-face" />

<xsl:template match="svg:glyph|svg:missing-glyph">
<!--
<xsl:text>g</xsl:text>
<xsl:number level="single" count="svg:glyph"/>
-->
<xsl:text>{d:"</xsl:text>
<xsl:value-of select="@d"/>
<xsl:text>",n:"</xsl:text><xsl:value-of select="@glyph-name"/>
<xsl:text>",u:"</xsl:text>
    <xsl:choose>
    <xsl:when test="@unicode = '&#34;'">\u0022</xsl:when>
    <xsl:when test="@unicode = '&#92;'">\u005c</xsl:when>
    <xsl:otherwise><xsl:value-of select="@unicode"/></xsl:otherwise>
    </xsl:choose>
<xsl:text>",a:</xsl:text><xsl:value-of select="@horiz-adv-x"/>
<xsl:text>},
</xsl:text>
</xsl:template>

<!-- strip text to remove unneeded whitespace-->
<xsl:template match="text()">
</xsl:template>

</xsl:stylesheet>

