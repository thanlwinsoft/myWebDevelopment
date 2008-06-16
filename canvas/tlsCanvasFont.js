var tlsAlertOnce  = true;
function TlsDebug()
{
    this.debug = document.getElementById("tlsDebug");
    this.indent = "";
    this.dumpLevel = 0;
    this.print = function(t)
    {
        if (this.debug) 
        {
            this.debug.appendChild(document.createTextNode(t));
            this.debug.appendChild(document.createElement("br"));
        }
        return this;
    }
    this.clear = function() { if (this.debug) this.debug.innerHTML = ""; return this; };
    this.dump = function(obj, levels) {
        var indent = this.indent;
        if (levels == undefined) levels = 1;
        this.dumpLevel++;
        var i = 0;
        for (var p in obj)
        {
            this.print(this.indent + p + ":" + obj[p]);
            if (typeof obj[p] == "object" && this.dumpLevel < levels) 
            {
                this.indent = indent + "\u00A0\u00A0";
                this.dump(obj[p], levels - 1);
                this.indent = indent;
            }
            if (++i > 100) 
            {
                this.print("Only printed first 100 properties."); break; 
            }
        }
        this.dumpLevel--;
        return this;
    };
    return this;
}

var tlsFontCache = new function () {
    this.registerFontData = function(name, data)
    {
        if (this[name]) this[name].data = data;
        else this[name] = new TlsFont(data);
    },
    this.registerRenderedData = function(name, data)
    {
        if (!this[name]) this[name] = new TlsFont(new Object());
        this[name].rendered = data;
    }
	this.hasFont = function(name)
	{
		if (this[name] && this[name].data.glyphs && this[name].rendered)
		{
			return true;
		}
		return false;
	}
    return this;
};

function TlsColor(color)
{
    this.origColor = color;
	this.red = this.green = this.blue = 0;
	this.alpha = 1;
    var i;
    try
    {
	    if (color.charAt(0) == '#')
	    {
		    if(color.length < 5)
		    {
			    this.red = parseInt(color.charAt(1), 16);
			    this.green = parseInt(color.charAt(2), 16);
			    this.blue = parseInt(color.charAt(3), 16);
		    }
		    else if (color.length == 7)
		    {
			    this.red = parseInt(color.substring(1,3), 16);
			    this.green = parseInt(color.substring(3,5), 16);
			    this.blue = parseInt(color.substring(5,7), 16);
		    }
	    }
	    else if ((i = color.indexOf("rgba(")) > -1)
	    {
		    var bracket = color.indexOf(")");
		    var values = color.substring(i + 5,bracket).split(",");
		    this.red = Number(values[0]);
            this.green = Number(values[1]);
            this.blue = Number(values[2]);
            this.alpha = Number(values[3]);
	    }
	    else if ((i = color.indexOf("rgb(")) > -1)
	    {
		    var bracket = color.indexOf(")");
		    var values = color.substring(i + 4,bracket).split(",");
		    this.red = Number(values[0]);
            this.green = Number(values[1]);
            this.blue = Number(values[2]);
	    }
	    else if (color == "white") { this.red = 255; this.green = 255; this.blue = 255;}
	    else if (color == "red") this.red = 255;
	    else if (color == "green") this.green = 255;
	    else if (color == "blue") this.blue = 255;
	    else if (color == "yellow") { this.red = 255; this.green = 255; }
	    else if (color == "magenta") {this.red = 255; this.blue = 255;}
	    else if (color == "cyan") {this.green = 255; this.blue = 255;}
        if (this.red == undefined) this.red = 0;
        if (this.green == undefined) this.green = 0;
        if (this.blue == undefined) this.blue = 0;
    }
    catch (e) { TlsDebug().print("TlsColor exception: " + e);}
    TlsDebug().print("orig:" + this.origColor + " now:" + this.asRgb());
    return this;
};

TlsColor.prototype.asRgb = function()
{
	if (this.alpha < 1)
		return "rgba(" + this.red +"," + this.green + "," + this.blue + "," + this.alpha + ")";
	return "rgb(" + this.red +"," + this.green + "," + this.blue + ")";
}

TlsColor.prototype.asHex = function()
{
	var hexColor = "";
	var hex = Number(this.red).toString(16);
	if (hex.length == 1) hex = "0" + hex;
	hexColor += hex;
	hex = Number(this.green).toString(16);
	if (hex.length == 1) hex = "0" + hex;
	hexColor += hex;
	hex = Number(this.blue).toString(16);
	if (hex.length == 1) hex = "0" + hex;
	hexColor += hex;
	return hexColor;
}

TlsColor.prototype.asHash = function()
{
	return "#" + this.asHex();
}

function TlsFont(fontData)
{
    this.data = fontData;
    this.rendered = undefined;// If you don't need rendered use new Object();
    this.defaultFontSize = 14;
    this.maxContext = 12;// max ligature length
    this.font = this;
    return this;
};


TlsFont.prototype.computedStyle = function(node)
    {
        if (typeof node.currentStyle != 'undefined')
            return node.currentStyle;
        return (window.getComputedStyle)? 
            window.getComputedStyle(node,null) : node.computedStyle;
    };


TlsFont.prototype.nodeFontSize = function(node)
    {
        var fontSize = this.defaultFontSize;
        var computedStyle = this.computedStyle(node);
        if (computedStyle)
        {
            var fontSizeText = String(computedStyle.fontSize);
            if (fontSizeText.indexOf("px") > -1) 
                fontSize = fontSizeText.substring(0, fontSizeText.indexOf("px"));
        }
        return fontSize;
    };

TlsFont.prototype.getGlyph = function(uChar)
    {
        for (var i = 0; i < this.data.glyphs.length; i++)
        {
            if (this.data.glyphs[i] && this.data.glyphs[i].u == uChar)
            {
                return [0,0,i,this.data.glyphs[i].a];
            }
        }
        return [0,0,0,this.data.glyphs[0].a];
    };

function TlsTextRun(tlsFont, fontSize, text)
{
    this.text = text;
    this.width = 0;
    this.height = 0;
    this.scaling = fontSize / tlsFont.font.data.unitsPerEm;
    this.lineHeight = (tlsFont.font.data.ascent - tlsFont.font.data.descent) * this.scaling;
	this.glyphLayout = new Array();
	this.glyphLayout.push(0);
	this.charToGlyph = new Array(text.length);
    this.mouseDown = undefined;
    this.selection = undefined;
    return this;
}

TlsTextRun.prototype.layoutText = function(tlsFont)
{
    var width = 0;
    var lineCount = 1;
    var uText = "u";
    var gData;
    for (var i = 0; i < this.text.length; i++)
    {
        uText = "u";
        var prevMatch = false;
        var lastMatchIndex = -1;    
        for (var j = i; (j < this.text.length) && (j < i + tlsFont.font.maxContext); j++)
        {
            var hex = this.text.charCodeAt(j).toString(16);
            while (hex.length < 4) hex = "0" + hex;
            uText += hex;
            try
            {
                // avoid entries for single code points unless they are
                // isolated, since these may have dotted circles for diacritics
                // which should only be displayed stand alone
                if (uText.length > 5 || this.text.length == 1)
                {
                    gData = tlsFont.font.rendered[uText];
                    if (gData != undefined)
                    {
                        prevMatch = gData;
                        lastMatchIndex = j;
                    }
                }
            }
            catch (e)
            {
                 TlsDebug().print("Error parsing " + this.text + " at " + i + " " + e);
            }
        }
        if (lastMatchIndex > -1) // last char
        {
            //tlsFont.drawGlyphs(canvasRef, tlsFont.font.data, prevMatch, width, 0);
            width += prevMatch[prevMatch.length - 1];
			this.addGlyphs(i,lastMatchIndex, prevMatch);
            i = lastMatchIndex;
        }
        else
        {
            // no contextual ligatures/reordering, just use the simple cmap lookup
            var charGlyph = tlsFont.getGlyph(this.text.substring(i,i+1));
            //tlsFont.drawGlyphs(canvasRef, tlsFont.font.data, charGlyph, width, 0);
            width += charGlyph[charGlyph.length - 1];
			this.addGlyphs(i,i, charGlyph);
        }
    }

    this.width = parseInt(width * this.scaling);
    this.height = parseInt(this.lineHeight * lineCount);
};

TlsTextRun.prototype.addGlyphs = function(startChar, endChar, glyphData)
{
	var i;
	var endPos = this.glyphLayout.pop();
	var glyphIndex = this.glyphLayout.length / 3;
	for (i = 0; i < glyphData.length; i++)
	{
		var value = (glyphData[i] == undefined)? 0 : glyphData[i];
		if (i % 3 == 0)
			this.glyphLayout.push(value + endPos);
		else
			this.glyphLayout.push(value);
	}
//	TlsDebug().print("addGlyphs" + startChar + "," + endChar + " " + this.glyphLayout + " at g " + glyphIndex + " " + glyphData);
	// update positions
	for (i = startChar; i <= endChar; i++)
		this.charToGlyph[i] = glyphIndex;
};

TlsTextRun.prototype.onmousedown = function(evt)
{
    this.selection = this.findCharPosition(evt);
    return true;
}

TlsTextRun.prototype.onmouseup = function(evt)
{
    var endRange = this.findCharPosition(evt);
    if (this.selection)
    {
        if (this.selection.first > endRange.first)
            this.selection.first = endRange.first;
        if (this.selection.last < endRange.last)
            this.selection.last = endRange.last;
    }
    else this.selection = endRange;
    TlsDebug().print(this.text.substring(this.selection.first, this.selection.last + 1));
    return true;
}

TlsTextRun.prototype.findCharPosition = function(evt)
{
    var theEvent = (window.event)? window.event : evt;
    var srcNode = (theEvent.srcElement)? theEvent.srcElement : theEvent.target;
    var targetPos = TlsNodePosition(srcNode);
    var dx = theEvent.clientX - targetPos.x;
    var dy = theEvent.clientY - targetPos.y;
    if (dx > targetPos.width)
        TlsDebug().print(dx + "," + dy).dump(targetPos);
    var scaledDx = dx / this.scaling;
    var gIndex = 0;
    for (; gIndex < this.glyphLayout.length; gIndex += 3)
    {
        if (this.glyphLayout[gIndex] > scaledDx)
        {
            gIndex /= 3;
            if (gIndex > 0) gIndex--;
            break;
        }
    }
    var startChar = 0;
    var endChar = 0;
    for (; startChar < this.charToGlyph.length; startChar++)
    {
        endChar = startChar;
        while (endChar+1 < this.charToGlyph.length &&
            this.charToGlyph[endChar + 1] == this.charToGlyph[startChar])
            endChar++;
        if (endChar + 1 < this.charToGlyph.length && 
            this.charToGlyph[endChar + 1] > gIndex)
            break;
    }
    if (endChar < startChar) endChar = startChar;
    TlsDebug().clear().print("glyph: " + gIndex + " char: " + startChar + "," + endChar + " at " + scaledDx + " " + this.text.substring(startChar, endChar+1));
    var range = new Object();
    range.first = startChar;
    range.last = endChar;
    range.glyph = gIndex;
    return range;
};

TlsFont.prototype.appendText = function(parent, fontName, size, text, color, background)
{
    TlsDebug().print("appendText not implemented: " + text);
};

TlsFont.prototype.drawGlyphs = function(canvasRef, fontData, gData, dx, dy)
{
// This is used for measuring text
//    TlsDebug().print("drawGlyphs " + canvasRef + " : " + gData + " at " + dx + "," + dy);
}

function TlsCanvasFont(tlsFont)
{
    this.font = tlsFont;
    this.canvasCount = 0;
	this.fill = true;
	this.stroke = false;
    return this;
}
TlsCanvasFont.prototype.getGlyph = function(uChar) { return this.font.getGlyph(uChar); }
TlsCanvasFont.prototype.nodeFontSize = function(node) { return this.font.nodeFontSize(node); }
TlsCanvasFont.prototype.computedStyle = function(node) { return this.font.computedStyle(node); }

/** Append a canvas node to the given parent - which may be a document fragment
* @param parent - node
* @param fontSize - size in pixels
* @param text - text to display
* @param color - text color
* @param background - optional background if it should be painted 
*/
TlsCanvasFont.prototype.appendText = function(parent, fontSize, text, color, background)
{
	var doc = document;
    var canvas = doc.createElement("canvas");
    if (!canvas) return false;
	var textId = "";
	for (var i = 0; i < text.length; i++)
	{
		if (text.charCodeAt(i) < 256) textId+= "00";
		textId+= text.charCodeAt(i).toString(16);
	}
    var cId = "canvas" + this.font.data.name + ":" + fontSize + ":" + (new TlsColor(color)).asHex() + ":" + textId;
    var sourceCanvas = document.getElementById(cId);
    // it should be faster to clone a previous rendering of the same text
    if (sourceCanvas)
    {
        canvas.setAttribute("width", sourceCanvas.getAttribute("width"));
        canvas.setAttribute("height", sourceCanvas.getAttribute("height"));
        parent.appendChild(canvas);
        if (!canvas.getContext && G_vmlCanvasManager)
        {
            canvas.style.width = sourceCanvas.style.width;
            canvas.style.height = sourceCanvas.style.height;
            canvas = G_vmlCanvasManager.initElement(canvas);
            canvas.innerHTML = sourceCanvas.innerHTML;
            return true;
        }
        var ctx = ((canvas.getContext)? canvas.getContext("2d") : undefined);
        if (ctx)
        {
            try
            {
                ctx.drawImage(sourceCanvas, 0, 0);
                return true;
            } catch (e) { TlsDebug().print(e); }
        }
        parent.removeChild(canvas);
    }
    var run = new TlsTextRun(this.font, fontSize, text);
    run.layoutText(this.font);// to measure text
    canvas.style.width = run.width;
    canvas.style.height = run.height;
    canvas.setAttribute("width",run.width);
    canvas.setAttribute("height", run.height);
    canvas.setAttribute("id", cId);
    this.canvasCount++;
    parent.appendChild(canvas);
    TlsDebug().print("size("+ run.width + "," + run.height + ")");
	if (!canvas.getContext && G_vmlCanvasManager)
	{
        TlsDebug().print("canvas size("+ canvas.clientWidth + "," + canvas.clientHeight + ")");
		canvas = G_vmlCanvasManager.initElement(canvas);
        // fix up span
//		canvas = doc.getElementById(cId);
	}
    var ctx = ((canvas.getContext)? canvas.getContext("2d") : undefined);
    // don't put anything inside the canvas node since excanvas will remove it
    // unless we don't have a context
    if (!ctx)
    {
        canvas.appendChild(document.createTextNode(text));
        return false;
    }
	var oldColor = ctx.fillStyle;

    if (background != undefined)
    {
        // set the background on the canvas itself so that we can reuse other canvas
        canvas.style.backgroundColor = background;
//        ctx.fillStyle = background;
//        ctx.fillRect(0,0,run.width, run.height);
    }

    try
    {
        if (color == undefined)
	    {
            ctx.fillStyle = "rgb(0,0,0)";
//		    ctx.fillStyle = oldColor;
	    }
        else
            ctx.fillStyle = color;
    }
    catch (e) { TlsDebug.print("Color exception" + color + " " + e); color = oldColor; }
	canvas.tlsTextRun = run;
    canvas.onmousedown = function (evt) { this.tlsTextRun.onmousedown(evt); }
    canvas.onmouseup = function (evt) { this.tlsTextRun.onmouseup(evt); }
    run = this.drawTextRun(ctx, run);
    return true;
};

TlsCanvasFont.prototype.drawText = function(ctx, fontSize, text)
{
	var run = new TlsTextRun(this.font, fontSize, text);
	run.layoutText(this.font);
	this.drawTextRun(ctx, run);
	return run;
}

TlsCanvasFont.prototype.drawTextRun = function(ctx, run)
{
    ctx.save();
    TlsDebug().print("ctx.scale(" + run.scaling + "," + run.scaling + ")");
    ctx.scale(run.scaling, -run.scaling);
    ctx.translate(0, -this.font.data.ascent);
    try
    {
        this.drawGlyphs(ctx, run.glyphLayout, 0, 0);
    }
    catch (e) { TlsDebug().print(e + " " + e.description); }
    ctx.restore();
    return run;
}

TlsCanvasFont.prototype.drawGlyphs = function(canvasRef, gData, dx, dy)
{
    //this.font.drawGlyphs(canvasRef, this.font.data, gData, dx, dy);
    for (var i = 0; i < gData.length - 1; i+= 3)
    {
        var gX = dx + ((gData[i] == undefined)? 0 : gData[i]);
        var gY = dy + ((gData[i+1] == undefined)? 0 : gData[i+1]);
        //TlsDebug().print("draw " + i + " " + gX + "," + gY + " " + this.font.data.glyphs[gData[i+2]].d);
        this.drawPath(canvasRef, gX, gY, this.font.data.glyphs[gData[i+2]].d);
    }
}

function TlsCanvasSvgPath(ctx, x, y)
{
    this.ctx = ctx;
    this.dx = x;
    this.dy = y;
    this.xStart = this.prevCx = this.x = 0;
    this.yStart = this.prevCy = this.y = 0;
    return this;
}

TlsCanvasFont.prototype.drawPath = function(ctx, x, y, svgPath)
{
    ctx.beginPath();
    var path = new TlsCanvasSvgPath(ctx, x, y);
    path.create(svgPath);
    if (this.fill) ctx.fill();
	if (this.stroke) { ctx.stroke();}
};

TlsCanvasSvgPath.prototype.M = function(args)
{
    this.x = Number(args.shift());
    this.y = Number(args.shift());
    this.ctx.moveTo(this.dx + this.x, this.dy +this.y);
    TlsDebug().print("ctx.moveTo (" + (this.dx + this.x) + "," + (this.dy + this.y) + ")");
    while (args.length > 0)
    {
        this.x = Number(args.shift());
        this.y = Number(args.shift());
        this.ctx.lineTo(this.dx + this.x, this.dy + this.y);
    }
    this.prevCx = this.x;
    this.prevCy = this.y;
};

TlsCanvasSvgPath.prototype.Z = function(args)
{
    this.prevCx = this.x = this.xStart;
    this.prevCy = this.y = this.yStart;
};

TlsCanvasSvgPath.prototype.L = function(args)
{
    while (args.length > 0)
    {
        this.x = Number(args.shift());
        this.y = Number(args.shift());
        this.ctx.lineTo(this.dx + this.x, this.dy + this.y);
    }
    this.prevCx = this.x;
    this.prevCy = this.y;
};

TlsCanvasSvgPath.prototype.H = function(args)
{
    while (args.length > 0)
    {
        this.x = Number(args.shift());
        this.ctx.lineTo(this.dx + this.x, this.dy + this.y);
        TlsDebug().print("ctx.lineTo(" + (this.dx + this.x) + "," + (this.dy + this.y) + ")");
    }
    this.prevCx = this.x;
    this.prevCy = this.y;
};

TlsCanvasSvgPath.prototype.V = function(args)
{
    while (args.length > 0)
    {
        this.y = Number(args.shift());
        this.ctx.lineTo(this.dx + this.x, this.dy + this.y);
        TlsDebug().print("ctx.lineTo(" + (this.dx + this.x) + "," + (this.dy + this.y) + ")");
    }
    this.prevCx = this.x;
    this.prevCy = this.y;
};

TlsCanvasSvgPath.prototype.Q = function(args)
{
    while (args.length > 0)
    {
        this.prevCx = Number(args.shift());
        this.prevCy = Number(args.shift());
        this.x = Number(args.shift());
        this.y = Number(args.shift());
        TlsDebug().print("ctx.quadraticCurveTo(" + (this.dx + this.prevCx) + "," 
            + (this.dy + this.prevCy) + "," + (this.dx + this.x) + "," + (this.dy + this.y) + ")");
        this.ctx.quadraticCurveTo(this.dx + this.prevCx, this.dy + this.prevCy, this.dx + this.x, this.dy + this.y);
    }
}

TlsCanvasSvgPath.prototype.T = function(args)
{
    while (args.length > 0)
    {
        var cX = this.x * 2 - this.prevCx;
        var cY= this.y * 2 - this.prevCy;
        this.x = Number(args.shift());
        this.y = Number(args.shift());
        this.prevCx = cX;
        this.prevCy = cY;
        this.ctx.quadraticCurveTo(this.dx + this.prevCx, this.dy + this.prevCy, this.dx + this.x, this.dy + this.y);
    }
}

// TODO A,C,S, relative versions

TlsCanvasSvgPath.prototype.create = function(data)
{
    //this.ctx.beginPath();
    var args = new Array();
    var f = 0;
    var num = "";
    for (var i = 0; i < data.length; i++)
    {
        switch (data.charAt(i))
        {
        case 'M':
            if (f) this[f](args);
            args = new Array(); args.push("");
            f = "M";
            break;
        case 'L':
            if (f) this[f](args);
            args = new Array(); args.push("");
            f = "L";
            break;
        case 'H':
            if (f) this[f](args);
            args = new Array(); args.push("");
            f = "H";
            break;
        case 'V':
            if (f) this[f](args);
            args = new Array(); args.push("");
            f = "V";
            break;
        case 'Q':
            if (f) this[f](args);
            args = new Array(); args.push("");
            f = "Q";
            break;
        case 'T':
            if (f) this[f](args);
            args = new Array(); args.push("");
            f = "T";
            break;
        case 'Z':
            if (f) this[f](args);
            args = new Array(); args.push("");
            f = "Z";
            break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
        case '-':
            var coord = args.pop();
            args.push("" + coord + data.charAt(i));
            break;
        default:
            args.push("");
        }
    }
    //this.ctx.closePath();
}

function TlsNodePosition(node)
{
    this.x = this.y = 0;
    this.x = node.offsetLeft;
    this.y = node.offsetTop;
    var parentElem = node.offsetParent;
    var hasOffsetParent = true;
    if (!parentElem)
    {
        parentElem = node.parent;
        hasOffsetParent = false;
    }
    while (parentElem)
    {                
        this.x += parentElem.offsetLeft;
        this.y += parentElem.offsetTop;
        if (hasOffsetParent)
            parentElem = parentElem.offsetParent;
        else
            parentElem = parentElem.parent;
    }
    this.width = node.offsetWidth;
    this.height = node.offsetHeight;
    return this;
};

