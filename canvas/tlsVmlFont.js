// This code uses several ideas from http://excanvas.sourceforge.net/
// but is tailored specifically for vml in the hope it will improve performance

if (tlsUserAgent.isIe && !tlsUserAgent.isOpera)
{
    document.attachEvent("onreadystatechange", function () {
        if (document.readyState == "complete") 
        {
            // create xmlns
            if (!document.namespaces["vml"])
            {
              document.namespaces.add("vml", "urn:schemas-microsoft-com:vml");
            }
        }
    });
}

function TlsVmlFont(tlsFont)
{
    this.font = tlsFont;
	this.fill = true;
	this.stroke = false;
	this.strokeColor = "#000000";
	this.fillColor = "#000000";
    return this;
}
TlsVmlFont.prototype.getGlyph = function(uChar) { return this.font.getGlyph(uChar); }
TlsVmlFont.prototype.nodeFontSize = function(node) { return this.font.nodeFontSize(node); }
TlsVmlFont.prototype.computedStyle = function(node) { return this.font.computedStyle(node); }

/** Append a canvas node to the given parent - which may be a document fragment
* @param parent - node
* @param fontSize - size in pixels
* @param text - text to display
* @param color - text color
* @param background - optional background if it should be painted 
*/
TlsVmlFont.prototype.appendText = function(parent, fontSize, text, color, background)
{
	var doc = document;
	var foreColor = new TlsColor(color);
	var textId = "";
	for (var i = 0; i < text.length; i++)
	{
		if (text.charCodeAt(i) < 256) textId+= "00";
		textId+= text.charCodeAt(i).toString(16);
	}
    var run = new TlsTextRun(this.font, fontSize, text);
    run.layoutText(this.font);// to measure text

    //var placeHolder = parent.appendChild(document.createElement("span"));
    //placeHolder.style.display = "inline-block";
    //placeHolder.style.width = run.width + "px";
    //placeHolder.style.height = run.height + "px";
    var canvas = parent.appendChild(document.createElement("span"));
    //canvas.style.position = "absolute";
	canvas.style.display = "inline-block";
	canvas.style.position = "static";
	canvas.style.textAlign = "left";
	canvas.style.verticalAlign = "text-top";
    canvas.style.width = run.width + "px";
    canvas.style.height = run.height + "px";
    if (background != undefined)
        canvas.style.backgroundColor = background;
    canvas.tlsTextRun = run;
	canvas.tlsFont = this;
	this.strokeColor = foreColor.asHash();
	this.fillColor = foreColor.asHash();
    // don't enable the mouse handlers by default
    //canvas.onmousedown = function (evt) { this.tlsTextRun.onmousedown(evt); }
    //canvas.onmouseup = function (evt) { this.tlsTextRun.onmouseup(evt); }
    //canvas.onmouseover = function (evt) { this.tlsFont.drawTextRun(this.getContext("2d"), this.tlsTextRun); }
    run = this.drawTextRun(canvas, run);
    return true;
};

TlsVmlFont.prototype.drawText = function(ctx, fontSize, text)
{
	var run = new TlsTextRun(this.font, fontSize, text);
	run.layoutText(this.font);
	this.drawTextRun(ctx, run);
	return run;
}

TlsVmlFont.prototype.init = function()
{
    for (var i = 0; i < this.font.data.glyphs.length; i++)
    {
        this.initGlyph(i);
    }
}

TlsVmlFont.prototype.initGlyph = function(gid, scaling)
{
    var glyphVmlShapes = document.getElementById(this.font.data.name + "_vmlGlyphs");
    if (!glyphVmlShapes)
    {
        glyphVmlShapes = document.createElement("div");
        glyphVmlShapes.style.display = "none";
        glyphVmlShapes.setAttribute("id", this.font.data.name + "_vmlGlyphs");
        document.body.appendChild(glyphVmlShapes);
    }
    var shapeType = document.createElement("vml:shapeType");
    shapeType.setAttribute("id",this.font.data.name + "_g" + gid);
    shapeType.setAttribute("coordOrigin","0 0");
    shapeType.setAttribute("coordSize",this.font.data.unitsPerEm + " " + this.font.data.unitsPerEm);
    var glyphPath = new TlsVmlSvgPath(0,-this.font.data.ascent);
	glyphPath.scaleX = scaling;
	glyphPath.scaleY = -scaling;
    glyphPath.create(this.font.data.glyphs[gid].d);
    shapeType.setAttribute("path",glyphPath.path);
    shapeType.setAttribute("strokeWeight","1pt");
    glyphVmlShapes.appendChild(shapeType);
    return shapeType;
}

TlsVmlFont.prototype.drawTextRun = function(ctx, run)
{
    TlsDebug().print("ctx.scale(" + run.scaling + "," + run.scaling + ")");
    try
    {
        this.drawGlyphs(ctx, run.glyphLayout, 0, 0);
    }
    catch (e) { TlsDebug().print(e + " " + e.description); }
    return run;
}

TlsVmlFont.prototype.drawGlyphs = function(canvasRef, gData, dx, dy)
{
    for (var i = 0; i < gData.length - 1; i+= 3)
    {
        var gX = dx + ((gData[i] == undefined)? 0 : gData[i]);
        var gY = dy + ((gData[i+1] == undefined)? 0 : gData[i+1]);
        //TlsDebug().print("draw " + i + " " + gX + "," + gY + " " + this.font.data.glyphs[gData[i+2]].d);
        var gid = this.font.data.name + "_g" + gData[i+2];
        var glyphPath = document.getElementById(gid);
        if (!glyphPath) glyphPath = this.initGlyph(gData[i+2], 1.0);
        var vmlPath = document.createElement("vml:shape");
        vmlPath.style.position = "absolute";
        //vmlPath.style.left = (gX * canvasRef.tlsTextRun.scaling) + "px";
        //vmlPath.style.top = (gY * canvasRef.tlsTextRun.scaling) + "px";
        vmlPath.style.width = this.font.data.unitsPerEm * canvasRef.tlsTextRun.scaling + "px";
        vmlPath.style.height = this.font.data.unitsPerEm * canvasRef.tlsTextRun.scaling + "px";
		vmlPath.setAttribute("type","#" + gid);
        vmlPath.setAttribute("coordOrigin",-gX + " " + -gY);
		vmlPath.setAttribute("coordSize",this.font.data.unitsPerEm + " " + this.font.data.unitsPerEm);
        if (this.stroke)
            vmlPath.setAttribute("strokeColor", this.strokeColor);
        vmlPath.setAttribute("stroked", this.stroke);
        if (this.fill)
            vmlPath.setAttribute("fillColor", this.fillColor);
        vmlPath.setAttribute("filled", this.fill);
		if (i == 0)
			vmlPath.setAttribute("alt", canvasRef.tlsTextRun.text);
        canvasRef.appendChild(vmlPath);
    }
}

function TlsVmlSvgPath(x, y)
{
    this.path = "";
    this.dx = x;
    this.dy = y;
	this.scaleX = 1.0;
	this.scaleY = -1.0;
    this.xStart = this.prevCx = this.x = 0.0;
    this.yStart = this.prevCy = this.y = 0.0;
    return this;
}

TlsVmlSvgPath.prototype.transformX = function(x)
{
	return Math.round((x + this.dx)*this.scaleX-.5);
}

TlsVmlSvgPath.prototype.transformY = function(y)
{
	return Math.round((y + this.dy)*this.scaleY-.5);
}

TlsVmlSvgPath.prototype.M = function(args)
{
    this.x = Number(args.shift());
    this.y = Number(args.shift());
    this.path += "m " + this.transformX(this.x) + "," + this.transformY(this.y) + " ";
    TlsDebug().print("ctx.moveTo (" + (this.dx + this.x) + "," + (this.dy + this.y) + ")");
    while (args.length > 0)
    {
        this.x = Number(args.shift());
        this.y = Number(args.shift());
        this.path += "l " + this.transformX(this.x) + "," + this.transformY(this.y) + " ";
    }
    this.prevCx = this.x;
    this.prevCy = this.y;
};

TlsVmlSvgPath.prototype.Z = function(args)
{
    //this.path += " e";
    this.prevCx = this.x = this.xStart;
    this.prevCy = this.y = this.yStart;
};

TlsVmlSvgPath.prototype.L = function(args)
{
    while (args.length > 0)
    {
        this.x = Number(args.shift());
        this.y = Number(args.shift());
        this.path += "l " + this.transformX(this.x) + "," + this.transformY(this.y) + " ";
    } + " "
    this.prevCx = this.x;
    this.prevCy = this.y;
};

TlsVmlSvgPath.prototype.H = function(args)
{
    while (args.length > 0)
    {
        this.x = Number(args.shift());
        this.path += "l " + this.transformX(this.x) + "," + this.transformY(this.y) + " ";
        TlsDebug().print("ctx.lineTo(" + (this.dx + this.x) + "," + (this.dy + this.y) + ")");
    }
    this.prevCx = this.x;
    this.prevCy = this.y;
};

TlsVmlSvgPath.prototype.V = function(args)
{
    while (args.length > 0)
    {
        this.y = Number(args.shift());
        this.path += "l " + this.transformX(this.x) + "," + this.transformY(this.y) + " ";
        TlsDebug().print("ctx.lineTo(" + (this.dx + this.x) + "," + (this.dy + this.y) + ")");
    }
    this.prevCx = this.x;
    this.prevCy = this.y;
};

TlsVmlSvgPath.prototype.Q = function(args)
{
    while (args.length > 0)
    {
        this.prevCx = Number(args.shift());
        this.prevCy = Number(args.shift());
        var newX = Number(args.shift());
        var newY = Number(args.shift());
        TlsDebug().print("ctx.quadraticCurveTo(" + (this.dx + this.prevCx) + "," 
            + (this.dy + this.prevCy) + "," + (this.dx + this.x) + "," + (this.dy + this.y) + ")");
        this.quadToCubic(this.prevCx, this.prevCy, newX, newY);
		this.x = newX;
		this.y = newY;
    }
}

TlsVmlSvgPath.prototype.T = function(args)
{
    while (args.length > 0)
    {
        var cX = this.x * 2 - this.prevCx;
        var cY= this.y * 2 - this.prevCy;
        var newX = Number(args.shift());
        var newY = Number(args.shift());
        this.prevCx = cX;
        this.prevCy = cY;
        this.quadToCubic(this.prevCx, this.prevCy, newX, newY);
		this.x = newX;
		this.y = newY;
    }
}

TlsVmlSvgPath.prototype.quadToCubic = function(aCPx, aCPy, aX, aY)
{
    // the following is lifted almost directly from
    // http://developer.mozilla.org/en/docs/Canvas_tutorial:Drawing_shapes
    var cp1x = this.x + 2.0 / 3.0 * (aCPx - this.x);
    var cp1y = this.y + 2.0 / 3.0 * (aCPy - this.y);
    var cp2x = cp1x + (aX - this.x) / 3.0;
    var cp2y = cp1y + (aY - this.y) / 3.0;
    this.path += "c " + this.transformX(cp1x) + "," + this.transformY(cp1y) + "," + 
        this.transformX(cp2x) + "," + this.transformY(cp2y) + "," + 
        this.transformX(aX) + "," + this.transformY(aY) + " ";
}

// TODO A,C,S, relative versions

TlsVmlSvgPath.prototype.create = function(data)
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
    if (f) this[f](args);
	this.path +=" e";
    //this.ctx.closePath();
}

