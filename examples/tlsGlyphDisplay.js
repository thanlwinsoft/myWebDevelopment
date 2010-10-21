// Copyright: Keith Stribley 2008 http://www.ThanLwinSoft.org/
// License: GNU Lesser General Public License, version 2.1 or later.
// http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

var tlsGlyphDisplays = new Array();

function TlsGlyphDisplay(fontName, canvasId)
{
  this.playing = false;
  this.increment = 1;
  this.canvasId = canvasId;
  if (!tlsFontCache[fontName])
  {
    alert("Font " + fontName + " not found");
  }
  else
  {
    this.fontName = fontName;
    this.myCanvasFont = new TlsCanvasFont(tlsFontCache[fontName]);
    this.gId = Math.round(this.myCanvasFont.font.data.glyphs.length * Math.random());//99;
  }
  tlsGlyphDisplays[fontName + canvasId] = this;
  return this;
}

TlsGlyphDisplay.prototype.displayGlyph = function ()
{
  if (this.gId >= this.myCanvasFont.font.data.glyphs.length)
  {
      this.gId = 0;
  }
  else if (this.gId < 0)
  {
      this.gId = this.myCanvasFont.font.data.glyphs.length - 1;
  }
  //var svgContainer = document.getElementById("svgContainer");

  var cv = document.getElementById(this.canvasId);
  var ctx = cv.getContext("2d");
  ctx.save();
  this.myCanvasFont.fill = false;
  this.myCanvasFont.stroke = true;

  // erase canvas
  //ctx.fillStyle="rgba(255,255,255,0.8)";
  // omit the zero for alpha in opera
  ctx.fillStyle="rgba(255,255,255,.8)";
  ctx.fillRect(0,0,400,200);
  // axes
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.strokeStyle = "rgb(0,255,0)";
  ctx.moveTo(100,0);
  ctx.lineTo(100,200);
  ctx.moveTo(0,150);
  ctx.lineTo(400,150);
  ctx.stroke();

  var em = this.myCanvasFont.font.data.unitsPerEm;
  var scaling = 100 / em;
  ctx.translate(100,150);
  ctx.scale(scaling, -scaling);

  // ascent, descent
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgb(255,0,0)";
  ctx.beginPath();
  ctx.moveTo(-em,this.myCanvasFont.font.data.ascent);
  ctx.lineTo(3*em,this.myCanvasFont.font.data.ascent);
  ctx.moveTo(-em,this.myCanvasFont.font.data.descent);
  ctx.lineTo(3*em,this.myCanvasFont.font.data.descent);
  ctx.stroke();

  ctx.fillStyle = "rgb(255,0,255)";
  ctx.strokeStyle = "rgb(0,0,255)";
  var lineScaling = scaling;
  if (typeof G_vmlCanvasManager != "undefined") lineScaling = 1;
  ctx.lineWidth = 2/lineScaling;

  var charGlyph = [0,0,this.gId,this.myCanvasFont.font.data.glyphs[this.gId].a];
  //myCanvasFont.getGlyph(text);
  var run = this.myCanvasFont.drawGlyphs(ctx,charGlyph, 0, 0);

  // advance
  ctx.lineWidth = 2/lineScaling;
  ctx.strokeStyle = "rgb(50,50,50)";
  ctx.beginPath();
  var advance = ((charGlyph.length>0)? charGlyph[charGlyph.length - 1]:0);
  ctx.moveTo(advance,1.5*em);
  ctx.lineTo(advance,-0.5*em);
  ctx.stroke();
  ctx.restore();

  // update info
  if (document.getElementById("glyphId"))
    document.getElementById("glyphId").innerHTML = this.gId;
  if (document.getElementById("glyphName"))
    document.getElementById("glyphName").innerHTML = this.myCanvasFont.font.data.glyphs[this.gId].n;
  if (document.getElementById("advance"))
    document.getElementById("advance").innerHTML = this.myCanvasFont.font.data.glyphs[this.gId].a;
  var text = this.myCanvasFont.font.data.glyphs[this.gId].u;
  var codes = "";
  var hexCodes = "";
  for (var i = 0; i < text.length; i++) { codes += text.charCodeAt(i) + " ";
    hexCodes += text.charCodeAt(i).toString(16) + " ";
  }
  if (document.getElementById("unicodeDec"))
    document.getElementById("unicodeDec").innerHTML = codes;
  if (document.getElementById("unicodeHex"))
    document.getElementById("unicodeHex").innerHTML = hexCodes.toUpperCase();

}

TlsGlyphDisplay.prototype.nextGlyph = function ()
{
  if (this.playing == false) return;
  try
  {
    this.displayGlyph();
    // increment glyph
    this.gId += this.increment;

    var displayId = this.fontName + this.canvasId;
    //setTimeout(function() {tlsGlyphDisplays[displayId].displayGlyph();},1000);
    if (this.playing)
      setTimeout("tlsGlyphDisplays['" + displayId + "'].nextGlyph();", 1000); 
  }
  catch (e)
  {
    alert(e);
  }
}

TlsGlyphDisplay.prototype.play = function ()
{
  if (!this.playing)
  {
    this.playing=true;
  }
  this.nextGlyph();
}

TlsGlyphDisplay.prototype.pause = function ()
{
  this.gId-=this.increment;
  var oldIncrement = this.increment;
  this.increment=0;
  this.displayGlyph();
  this.displayGlyph();
  this.playing=false;
  this.increment=oldIncrement;
}

TlsGlyphDisplay.prototype.reverse = function ()
{
  this.increment = ((this.increment==1)? -1:1);
  if (!this.playing) { this.playing=true; this.displayGlyph();}
}

TlsGlyphDisplay.prototype.setGlyphId = function(glyph)
{
  this.gId = glyph;
  this.displayGlyph();
  this.displayGlyph();
  var chooseGlyphDivId = this.fontName + this.canvasId + "_chooseGlyph";
  if (document.getElementById(chooseGlyphDivId))
    document.getElementById(chooseGlyphDivId).style.display = 'none';
}

TlsGlyphDisplay.prototype.chooseGlyph = function(siblingElement)
{
  var chooseGlyphDivId = this.fontName + this.canvasId + "_chooseGlyph";
  var chooseDiv = document.getElementById(chooseGlyphDivId);
  if (chooseDiv)
  {
    chooseDiv.style.display = "block";
  }
  else
  {
    chooseDiv = document.createElement("div");
    chooseDiv.style.position = "absolute";
    chooseDiv.style.height = "150px";
    chooseDiv.style.overflow = "auto";
    chooseDiv.style.display = 'block';
    chooseDiv.setAttribute('class',"playControl");
    chooseDiv.id = chooseGlyphDivId;
    chooseDiv.setAttribute('id', chooseGlyphDivId);
    var parentElement = siblingElement.parentNode;
    parentElement.appendChild(chooseDiv);
    var chooseList = document.createElement("ol");
    chooseDiv.appendChild(chooseList);
    for (var gId = 1; gId < this.myCanvasFont.font.data.glyphs.length; gId++)
    {
      var glyphLI = document.createElement("li");
      var nameNode = document.createTextNode(this.myCanvasFont.font.data.glyphs[gId].n);
      glyphLI.appendChild(nameNode);
      glyphLI.style.cursor = 'pointer';
      glyphLI.setAttribute('onclick',"tlsGlyphDisplays['" + this.fontName + this.canvasId + "'].setGlyphId(" + gId + "); return false;");
      // document.getElementById('" + chooseGlyphDivId + "').style.display='none';
      chooseList.appendChild(glyphLI);
    }
  }
}

TlsGlyphDisplay.prototype.handleEvent = function(event)
{
  if (event.type == 'load')
  {
    if (!this.playing)
      this.play();
  }
}

