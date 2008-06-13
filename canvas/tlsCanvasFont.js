
function TlsDebug()
{
    this.debug = document.getElementById("tlsDebug");
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
	this.red = this.green = this.blue = 0;
	this.alpha = 255;
    var i;
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
			
			this.red = parseInt(color.substring(1,2), 16);
			this.green = parseInt(color.substring(3,4), 16);
			this.blue = parseInt(color.substring(5,6), 16);
		}
	}
	else if (i = color.indexOf("rgba(") > -1)
	{
		var bracket = color.indexOf(")");
		values = color.substring(i + 5,bracket).split(",");
		this.red = values[0]; this.green = values[1]; this.blue = values[2]; this.alpha = values[3];
	}
	else if (i = color.indexOf("rgb(") > -1)
	{
		var bracket = color.indexOf(")");
		values = color.substring(i + 4,bracket).split(",");
		this.red = values[0]; this.green = values[1]; this.blue = values[2]; 
	}
	else if (color == "white") { this.red = 255; this.green = 255; this.blue = 255;}
	else if (color == "red") this.red = 255;
	else if (color == "green") this.green = 255;
	else if (color == "blue") this.blue = 255;
	else if (color == "yellow") { this.red = 255; this.green = 255; }
	else if (color == "magenta") {this.red = 255; this.blue = 255;}
	else if (color == "cyan") {this.green = 255; this.blue = 255;}
	return this;
};

TlsColor.prototype.asRgb = function()
{
	if (this.alpha < 255)
		return "rgba(" + this.red +"," + this.green + "," + this.blue + "," + this.alpha + ")";
	return "rgb(" + this.red +"," + this.green + "," + this.blue + ")";
}

function TlsFont(fontData)
{
    this.data = fontData;
    this.rendered = undefined;// If you don't need rendered use new Object();
    this.defaultFontSize = 12;
    this.maxContext = 12;// max ligature length
    this.font = this;
    return this;
};


TlsFont.prototype.computedStyle = function(node)
    {
        return (window.getComputedStyle)? 
            window.getComputedStyle(node,null) : node.computedStyle;
    };


TlsFont.prototype.nodeFontSize = function(node)
    {
        var fontSize = mySvgFont.defaultFontSize;
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
},

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

TlsCanvasFont.prototype.appendText = function(parent, fontSize, text, color, background)
{
	var doc = document;
	/*
	if (!doc.namespaces["g_vml_"]) {
	  doc.namespaces.add("g_vml_", "urn:schemas-microsoft-com:vml");
	}*/
    var canvas = doc.createElement("canvas");
    if (!canvas) return false;
    var run = new TlsTextRun(this.font, fontSize, text);
    run.layoutText(this.font);// to measure text
    canvas.setAttribute("width",run.width);
    canvas.setAttribute("height", run.height);
	var cId = "canvas" + this.font.data.name + this.canvasCount;
    canvas.setAttribute("id", cId);
    this.canvasCount++;
    parent.appendChild(canvas);
	//canvas.appendChild(document.createTextNode(text));
    TlsDebug().print("size("+ run.width + "," + run.height + ")");
	if (!canvas.getContext && G_vmlCanvasManager)
	{
		canvas = G_vmlCanvasManager.initElement(canvas);
//		canvas = doc.getElementById(cId);
	}
    var ctx = canvas.getContext("2d");
    if (!ctx) return false;
	var oldColor = ctx.fillStyle;
    if (background != undefined)
    {
        ctx.fillStyle = background;
        ctx.fillRect(0,0,run.width, run.height);
    }
    if (color == undefined)
	{
//        ctx.fillStyle = "rgb(0,0,0)";
		ctx.fillStyle = oldColor;
	}
    else
        ctx.fillStyle = color;
	canvas.tlsTextRun = run;
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
	if (this.stroke) ctx.stroke();
    ctx.closePath();
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
    this.ctx.lineTo(this.dx + this.xStart, this.dy + this.yStart);
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

