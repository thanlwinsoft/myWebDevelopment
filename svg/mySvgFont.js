// Copyright: Keith Stribley 2008 http://www.ThanLwinSoft.org/
// License: GNU Lesser General Public License, version 2.1 or later.
// http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

function MySvgFonts() {
    this.fonts = new Array();
    this.rendered = new Array();
    return this;
}

MySvgFonts.prototype.setFont = function(name, data)
{
    this.fonts[name] = data;
}
MySvgFonts.prototype.setRendered = function(name, data)
{
    this.rendered[name] = data;
}
MySvgFonts.prototype.hasFont = function(name)
{
    if (typeof this.fonts[name] != "undefined" && 
        typeof this.rendered[name] != "undefined")
        return true;
    return false;
}
MySvgFonts.prototype.getFont = function(name)
{
    return this.fonts[name];
}
MySvgFonts.prototype.getRendered = function(name)
{
    return this.rendered[name];
}

var mySvgFont = {
    fontWarning:true,
    defaultFontSize:12,
    maxContext:10,
    loaded:false,
    fonts: new MySvgFonts(),
    hasFontData : function(fontName)
    {
        try
        {
            if (mySvgFont.loaded) return true;
            //fontData = eval('svgFont_' + fontName);
            //renderingData = eval(fontName + "Rendered");
            if (mySvgFont.fonts.hasFont(fontName))
            {
                mySvgFont.loaded = true;
                return true;
            }
        }
        catch (e)
        {
            if (mySvgFont.fontWarning) alert(fontName + " SVG not yet found");
            mySvgFont.fontWarning = false;
        }
        return false;
    },
    renderSvg: function(svg, fontName, text, size, color, background)
    {
        var fontData;
        var renderingData;
        try
        {
            fontData = mySvgFont.fonts.getFont(fontName);//eval('svgFont_' + fontName);
            renderingData = mySvgFont.fonts.getRendered(fontName);//eval(fontName + "Rendered");
        }
        catch (e)
        {
            if (mySvgFont.fontWarning) alert(fontName + " SVG not found");
            mySvgFont.fontWarning = false;
            return false;
        }
        var scaling = size / fontData.unitsPerEm;
        var scaledLineHeight = (fontData.ascent - fontData.descent) * scaling;
        
        var scaleG = (document.createElementNS)?
            document.createElementNS("http://www.w3.org/2000/svg", "g"):
            document.createElement("g");
        if (!scaleG) return false;
        var metadata = (document.createElementNS)?
          document.createElementNS("http://www.w3.org/2000/svg","metadata"):
            document.createElement("metadata");
        if (metadata && metadata.appendChild)
        {
            svg.appendChild(metadata);
            var titleText = document.createTextNode(text);
            if (titleText)
            {
                metadata.appendChild(titleText);
            }
        }
        scaleG.setAttribute("transform", "translate(0," + (fontData.ascent * scaling) + 
            ") scale(" + scaling + ",-" + scaling + ")");
        if (color != undefined)
            scaleG.setAttribute("fill", color);
        var width = 0;
        var lineCount = 1;
        var uText = "u";
        var gData;
        for (var i = 0; i < text.length; i++)
        {
            uText = "u";
            var prevMatch = false;
            var lastMatchIndex = -1;    
            for (var j = i; (j < text.length) && (j < i + mySvgFont.maxContext); j++)
            {
                var hex = text.charCodeAt(j).toString(16);
                while (hex.length < 4) hex = "0" + hex;
                uText += hex;
                try
                {
                    // avoid entries for single code points unless they are
                    // isolated, since these may have dotted circles for diacritics
                    // which should only be displayed stand alone
                    if (uText.length > 5 || text.length == 1)
                    {
                        gData = renderingData[uText];
                        if (gData != undefined)
                        {
//                            if (myUnicode.debug())
//                                myUnicode.debug().appendChild(document.createTextNode(uText));
                            prevMatch = gData;
                            lastMatchIndex = j;
                        }
                    }
                }
                catch (e)
                {
                     if (mySvgFont.fontWarning) alert("Error parsing " + text + " at " + i);
                        mySvgFont.fontWarning = false;
                }
            }
            if (lastMatchIndex > -1) // last char
            {
                mySvgFont.appendGlyphPaths(scaleG, fontData, prevMatch, width, 0);
                width += prevMatch[prevMatch.length - 1];
                i = lastMatchIndex;
            }
            else
            {
                // no contextual ligatures/reordering, just use the simple cmap lookup
                var charGlyph = mySvgFont.findGlyph(fontData, text.substring(i,i+1));
                mySvgFont.appendGlyphPaths(scaleG, fontData, charGlyph, width, 0);
                width += charGlyph[charGlyph.length - 1];
            }
        }

        var widthPx = width * scaling;
        var heightPx = scaledLineHeight * lineCount;
        // background
        if (background != undefined)
        {
            var rect = (document.createElementNS)?
              document.createElementNS("http://www.w3.org/2000/svg","rect"):
                document.createElement("rect");
            rect.setAttribute("x", 0);
            rect.setAttribute("y", 0);
            rect.setAttribute("width", widthPx);
            rect.setAttribute("height", heightPx);
            rect.setAttribute("fill", background);
            svg.appendChild(rect);
        }
        svg.appendChild(scaleG);
        svg.setAttribute("width", widthPx);
        svg.setAttribute("height", heightPx);

        return true;
    },
    findGlyph:function(fontData, uChar)
    {
        for (var i = 0; i < fontData.glyphs.length; i++)
        {
            if (fontData.glyphs[i] && fontData.glyphs[i].u == uChar)
            {
                return [0,0,i,fontData.glyphs[i].a];
            }
        }
        return [0,0,0,fontData.glyphs[0].a];
    },
    appendGlyphPaths: function(scaleG, fontData, gData, dx, dy)
    {
        for (var i = 0; i < gData.length - 1; i+= 3)
        {
            var path = (document.createElementNS)?
                document.createElementNS("http://www.w3.org/2000/svg","path"):
                document.createElement("path");
            if (path)
            {
                var gX = dx + ((gData[i] == undefined)? 0 : gData[i]);
                var gY = dy + ((gData[i+1] == undefined)? 0 : gData[i+1]);
                path.setAttribute("transform", "translate(" + gX + "," + gY + ")");
                path.setAttribute("d", fontData.glyphs[gData[i+2]].d);
                scaleG.appendChild(path);
            }
        }
    },
    appendSvgText: function(parent, fontName, size, text, color, background)
    {
        if (text.length == 0) return;
        if (!mySvgFont.hasFontData(fontName)) return;
        if (!document.getElementById("AdobeSVG"))
        {
            try
            {
                var asvObject = document.createElement("object");
                asvObject.setAttribute("id","AdobeSVG");
                asvObject.setAttribute("classid","clsid:78156a80-c6a1-4bbf-8e6a-3cd390eeb4e2");
                var head = document.getElementsByTagName("head").item(0);
                head.appendChild(asvObject);
                // this fails, so how can I do this?
                // var importNS = document.createProcessingInstruction("import", ' namespace="svg" implementation="#AdobeSVG"');
                // head.appendChild(importNS);
            }
            catch (e) { alert(e);}
        }
        var svg = (document.createElementNS)? 
            document.createElementNS("http://www.w3.org/2000/svg", "svg") : 
            document.createElement("svg");
        if (svg)
        {
            if (mySvgFont.renderSvg(svg, fontName, text, size, color, background))
            {
/*
                var span = document.createElement("span");
                if (span)
                {
                    // add span so text can still be copied, but move it well out of sight
                    //span.appendChild(document.createTextNode(text));
                    parent.appendChild(span);
                    span.appendChild(svg);
                }
                else */
                parent.appendChild(svg);
            }
        }
    },
    /** find computed style of node */
    computedStyle: function(node)
    {
        return (window.getComputedStyle)? 
            window.getComputedStyle(node,null) : node.computedStyle;
    },
    nodeFontSize: function(node)
    {
        var computedStyle = mySvgFont.computedStyle(node);
        if (computedStyle)
        {
            var fontSizeText = String(computedStyle.fontSize);
            if (fontSizeText.indexOf("px") > -1) 
                fontSize = fontSizeText.substring(0, fontSizeText.indexOf("px"));
            if (fontSize > 0) return fontSize;
        }
        return mySvgFont.defaultFontSize;
    }
};

