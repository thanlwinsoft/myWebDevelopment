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
        
        var scaleG = document.createElementNS("http://www.w3.org/2000/svg", "g");
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
        var uText = "";
        var gData;
        var labelLengths = new Array(text.length);
        for (var i = 0; i < text.length; i++)
        {
            uText += "u" + text.charCodeAt(i).toString(16);
            labelLengths[i] = uText.length;
        }
        try
        {
            gData = eval("renderingData." + uText);
            if (gData.length)
            {
                mySvgFont.appendGlyphPaths(scaleG, fontData, gData, width, 0);
                width += gData[gData.length - 1];
            }
        }
        catch (e) 
        {
            alert(uText + " not found.");
        }
        svg.appendChild(scaleG);
        svg.setAttribute("width", width * scaling);
        svg.setAttribute("height", scaledLineHeight * lineCount);
        
        return true;
    },
    appendGlyphPaths: function(scaleG, fontData, gData, dx, dy)
    {
        for (var i = 0; i < gData.length - 1; i++)
        {
            var path = document.createElementNS("http://www.w3.org/2000/svg","path");
            if (path)
            {
                path.setAttribute("transform", "translate(" + (dx + gData[i][0]) + "," + (dy + gData[i][1]) + ")");
                path.setAttribute("d", fontData.glyphs[gData[i][2]].d);
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
                // this fails in mozilla, but its only needed in IE
                var importNS = document.createProcessingInstruction("import", ' namespace="svg" implementation="#AdobeSVG"');
                head.appendChild();
            }
            catch (e) {}
        }
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        if (svg)
        {
            if (mySvgFont.renderSvg(svg, fontName, text, size, color))
            {
                var span = document.createElement("span");
                if (span)
                {
                    // add span so text can still be copied, but move it well out of site
                    span.appendChild(document.createTextNode(text));
                    span.style.position = "absolute";
                    span.style.zIndex = -1;
                    span.style.left = "-100%";
                    parent.appendChild(span);
                }
                parent.appendChild(svg);
            }
        }
    }
};

