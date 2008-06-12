
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
		if (this[name] && this[name].data.glyphs && this[name].rendered.length)
		{
			return true;
		}
		return false;
	}
    return this;
};



function TlsFont(fontData)
{
    this.data = fontData;
    this.rendered = new Object();
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
        var computedStyle = this.computedStyle(node);
        if (computedStyle)
        {
            var fontSizeText = String(computedStyle.fontSize);
            if (fontSizeText.indexOf("px") > -1) 
                fontSize = fontSizeText.substring(0, fontSizeText.indexOf("px"));
            if (fontSize > 0) return fontSize;
        }
        return mySvgFont.defaultFontSize;
    };

TlsFont.prototype.findGlyph = function(uChar)
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
    return this;
}

TlsTextRun.prototype.drawText = function(tlsFont, canvasRef)
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
            tlsFont.drawGlyphs(canvasRef, tlsFont.font.data, prevMatch, width, 0);
            width += prevMatch[prevMatch.length - 1];
            i = lastMatchIndex;
        }
        else
        {
            // no contextual ligatures/reordering, just use the simple cmap lookup
            var charGlyph = tlsFont.findGlyph(this.text.substring(i,i+1));
            tlsFont.drawGlyphs(canvasRef, tlsFont.font.data, charGlyph, width, 0);
            width += charGlyph[charGlyph.length - 1];
        }
    }

    this.width = parseInt(width * this.scaling);
    this.height = parseInt(this.lineHeight * lineCount);
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
    return this;
}
TlsCanvasFont.prototype.findGlyph = function(uChar) { return this.font.findGlyph(uChar); }
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
    run.drawText(this.font, 0);// dummy to measure text
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
		G_vmlCanvasManager.initElement(canvas);
		canvas = doc.getElementById(cId);
		if (canvas.ownerDocument.namespaces["g_vml_"]) alert("g_vml_  found");
        canvas.tlsFont = this;
        canvas.tlsFontSize = fontSize;
        canvas.tlsText = text;
        canvas.tlsColor = color;
		/*
        setTimeout(function(){
			var canvas = document.getElementById(cId);
			canvas.tlsFont.drawTextOnCanvas(canvas.getContext("2d"), canvas.tlsFontSize, canvas.tlsText);
			}, 10);
		return;*/
	}
    var ctx = canvas.getContext("2d");
    if (!ctx) return false;
    if (background != undefined)
    {
        ctx.fillStyle = background;
        ctx.fillRect(0,0,run.width, run.height);
    }
    if (color == undefined)
	{
//        ctx.fillStyle = "rgb(0,0,0)";
	}
    else
        ctx.fillStyle = color;
    run = this.drawTextOnCanvas(ctx, fontSize, text);
//    TlsDebug().print("("+ run.width + "," + run.height + ")");
    return true;
};

TlsCanvasFont.prototype.drawTextOnCanvas = function(ctx, fontSize, text)
{
    ctx.save();
    var run = new TlsTextRun(this, fontSize, text);
    TlsDebug().print("ctx.scale(" + run.scaling + "," + run.scaling + ")");
    ctx.scale(run.scaling, -run.scaling);
    ctx.translate(0, -this.font.data.ascent);
    try
    {
        run.drawText(this, ctx);
    }
    catch (e) { TlsDebug().print(e); }
    ctx.restore();
    return run;
}

TlsCanvasFont.prototype.drawGlyphs = function(canvasRef, fontData, gData, dx, dy)
{
    //this.font.drawGlyphs(canvasRef, fontData, gData, dx, dy);
    for (var i = 0; i < gData.length - 1; i+= 3)
    {
        var gX = dx + ((gData[i] == undefined)? 0 : gData[i]);
        var gY = dy + ((gData[i+1] == undefined)? 0 : gData[i+1]);
        //TlsDebug().print("draw " + i + " " + gX + "," + gY + " " + fontData.glyphs[gData[i+2]].d);
        this.drawPath(canvasRef, gX, gY, fontData.glyphs[gData[i+2]].d);
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
    var path = new TlsCanvasSvgPath(ctx, x, y);
    path.create(svgPath);
    ctx.fill();
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
    this.ctx.beginPath();
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
    this.ctx.closePath();
}

