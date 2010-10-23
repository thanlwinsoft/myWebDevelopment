// Copyright: Keith Stribley 2008 http://www.ThanLwinSoft.org/
// License: GNU Lesser General Public License, version 2.1 or later.
// http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

var tlsFontCache = new function ()
{
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
			    this.red = parseInt(color.charAt(1), 16) * 16;
			    this.green = parseInt(color.charAt(2), 16) * 16;
			    this.blue = parseInt(color.charAt(3), 16) * 16;
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

TlsColor.prototype.inverse = function()
{
    var inverted = new TlsColor("#000");
	if (this.alpha < 1)
		inverted.alpha = 1 - this.alpha;
	inverted.red = 255 - this.red;
	inverted.green = 255 - this.green;
	inverted.blue = 255 - this.blue;
	return inverted;
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
		else if (fontSizeText.indexOf("pt") > -1)// pt scaling at 96dpi/72
		    fontSize = 1.333 * Number(fontSizeText.substring(0, fontSizeText.indexOf("pt")));
		else if (fontSizeText.indexOf("em") > -1)
		    fontSize = fontSize * Number(fontSizeText.substring(0, fontSizeText.indexOf("em")));
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

