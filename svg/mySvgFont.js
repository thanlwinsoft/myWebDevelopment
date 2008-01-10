var mySvgFont = {
    fontWarning:false,
    renderSvg: function(svg, fontName, text, size, color)
    {
        var fontData;
        var renderingData;
        try
        {
            fontData = eval('svgFont_' + fontName);
            renderingData = eval(fontName + "Rendered");
        }
        catch (e)
        {
            if (!mySvgFont.fontWarning) alert(fontName + " SVG not found");
            mySvgFont.fontWarning = true;
            return false;
        }
        var scaling = size / fontData.unitsPerEm;
        var scaledLineHeight = (fontData.ascent - fontData.descent) * scaling;
        
        var scaleG = (document.createElementNS)?document.createElementNS("http://www.w3.org/2000/svg", "g"):
			document.createElement("g");
        if (!scaleG) return false;
//        var title = document.createElementNS("http://www.w3.org/2000/svg","title");
//        if (title)
//        {
//            title.appendChild(document.createTextNode(text));
//            scaleG.appendChild(title);
//        }
        scaleG.setAttribute("transform", "translate(0," + (fontData.ascent * scaling) + 
            ") scale(" + scaling + ",-" + scaling + ")");
        if (color != undefined)
            scaleG.setAttribute("fill", color);
        var width = 0;
        var lineCount = 1;
        var uText = "u";
        var gData;
        var labelLengths = new Array(text.length);
        var prevMatch = false;
        for (var i = 0; i < text.length; i++)
        {
            var hex = text.charCodeAt(i).toString(16);
            while (hex.length < 4) hex = "0" + hex;
            uText += hex;
            labelLengths[i] = uText.length;
            try
            {
                gData = eval("renderingData." + uText);                
                prevMatch = gData;
                if (i == text.length - 1) // last char
                {
                    mySvgFont.appendGlyphPaths(scaleG, fontData, gData, width, 0);
                    width += gData[gData.length - 1];
                }
            }
            catch (e) 
            {
                //if (!mySvgFont.fontWarning) alert(uText + " not found.");
               // mySvgFont.fontWarning = true;
                if (prevMatch)
                {
                    mySvgFont.appendGlyphPaths(scaleG, fontData, prevMatch, width, 0);
                    width += prevMatch[prevMatch.length - 1];
                }
                else if (uText.length > 5)
                {
                    // previous didn't match, just output the character's normal glyph
                    var charGlyph = mySvgFont.findGlyph(uText.substr(0, 5));
                    mySvgFont.appendGlyphPaths(scaleG, fontData, charGlyph, width, 0);
                    width += charGlyph[charGlyph.length - 1];
                }
                uText = "u" + uText.substring(uText.length - 4);
                if (i == text.length - 1) // last char
                {
                    var charGlyph = mySvgFont.findGlyph(uText);
                    mySvgFont.appendGlyphPaths(scaleG, fontData, charGlyph, width, 0);
                    width += charGlyph[charGlyph.length - 1];
                }
                prefMatch = false;
            }
        }
        
        svg.appendChild(scaleG);
        svg.setAttribute("width", width * scaling);
        svg.setAttribute("height", scaledLineHeight * lineCount);
        
        return true;
    },
    findGlyph:function(uName)
    {
        for (var i = 0; i < fontData.glyphs.length; i++)
        {
            if (fontData[i].n == uName)
            {
                return [0,0,i,fontData[i].a];
            }
        }
        return [0,0,0,fontData[0].a];
    },
    appendGlyphPaths: function(scaleG, fontData, gData, dx, dy)
    {
        for (var i = 0; i < gData.length/3; i+= 3)
        {
            var path = (document.createElementNS)?document.createElementNS("http://www.w3.org/2000/svg","path"):document.createElement("path");
            if (path)
            {
                path.setAttribute("transform", "translate(" + (dx + gData[i]) + "," + (dy + gData[i+1]) + ")");
                path.setAttribute("d", fontData.glyphs[gData[i+2]].d);
                scaleG.appendChild(path);
            }
        }
    },
    appendSvgText: function(parent, fontName, size, text, color)
    {
        if (text.length == 0) return;
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
                //var importNS = document.createProcessingInstruction("import", ' namespace="svg" implementation="#AdobeSVG"');
                //head.appendChild(importNS);
            }
            catch (e) { alert(e);}
        }
        var svg = (document.createElementNS)? document.createElementNS("http://www.w3.org/2000/svg", "svg") : 
			document.createElement(svg);
        if (svg)
        {
            if (mySvgFont.renderSvg(svg, fontName, text, size, color))
            {
                /*
                var span = document.createElement("span");
                if (span)
                {
                    // add span so text can still be copied, but move it well out of site
                    span.appendChild(document.createTextNode(text));
                    span.style.position = "absolute";
                    span.style.zIndex = -1;
                    span.style.left = "-100%";
                    parent.appendChild(span);
                }*/
                parent.appendChild(svg);
            }
        }
    }
};

