// Copyright: Keith Stribley 2008 http://www.ThanLwinSoft.org/
// License: GNU Lesser General Public License, version 2.1 or later.
// http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

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
	var foreColor = new TlsColor(color);
    var canvas = doc.createElement("canvas");
    if (!canvas) return false;
	var textId = "";
	for (var i = 0; i < text.length; i++)
	{
		if (text.charCodeAt(i) < 256) textId+= "00";
		textId+= text.charCodeAt(i).toString(16);
	}
    var cId = "canvas" + this.font.data.name + ":" + fontSize + ":" + (foreColor).asHex() + ":" + textId;
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
            //canvas = G_vmlCanvasManager.initElement(canvas);
			// cloneNode doesn't seem to work properly with vml
            //canvas.innerHTML = sourceCanvas.innerHTML;

            // sizing is hard without a background rect, background rect is 
			var vmlSrcGroup = document.getElementById(cId + "group");
			var vmlFrame = document.createElement("g_vml_:vmlFrame");
			// offsetWidth/Height doesn't seem to help
			vmlFrame.style.width = sourceCanvas.style.width;
            vmlFrame.style.height = sourceCanvas.style.height;
            
            // the code below must draw a background rect otherwise the size
            // gets distorted for text that doesn't use the full height range
			vmlFrame.setAttribute("src","#" + cId + "group");
			vmlFrame.style.position = "absolute";
			canvas.appendChild(vmlFrame);
            return true;
        }
        var ctx = ((canvas.getContext)? canvas.getContext("2d") : undefined);
        if (ctx)
        {
            try
            {
                ctx.drawImage(sourceCanvas, 0, 0);
                return true;
            }
            catch (e) 
            { 
                TlsDebug().print(e);
                parent.removeChild(canvas);
            }
        }
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
    var isIe = false;
	if (!canvas.getContext && G_vmlCanvasManager)
	{
	    isIe = true;
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
        //if (!isIe) 
            canvas.style.backgroundColor = background;
        //else
        {
//            var backColor = new TlsColor(background);
//            if (foreColor.asRgb() == backColor.asRgb())
//            {
//                backColor = foreColor.inverse();
//            }
            
        }
    }
    if (isIe)
    {
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.fillRect(0,0,run.width, run.height);
    }
    try
    {
        if (color == undefined)
	    {
            ctx.fillStyle = "rgb(0,0,0)";
//		    ctx.fillStyle = oldColor;
	    }
        else
            ctx.fillStyle = foreColor.asRgb();
    }
    catch (e) { TlsDebug.print("Color exception" + color + " " + e); color = oldColor; }
	canvas.tlsTextRun = run;
	canvas.tlsFont = this;
	// don't enable the mouse handlers by default
    //canvas.onmousedown = function (evt) { this.tlsTextRun.onmousedown(evt); }
    //canvas.onmouseup = function (evt) { this.tlsTextRun.onmouseup(evt); }
    //canvas.onmouseover = function (evt) { this.tlsFont.drawTextRun(this.getContext("2d"), this.tlsTextRun); }
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
// ending the path here causes problems in ff
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
    if (f) this[f](args);
    //this.ctx.closePath();
}

