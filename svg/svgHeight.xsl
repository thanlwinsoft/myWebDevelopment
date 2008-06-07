<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
xmlns="http://www.w3.org/1999/xhtml" xmlns:svg="http://www.w3.org/2000/svg"
>
<xsl:output method="text"/>
<xsl:template match="/svg:svg">
<!--<xsl:message><xsl:value-of select="@height"/></xsl:message>-->
<xsl:value-of select="@height"/>
</xsl:template>
</xsl:stylesheet>

