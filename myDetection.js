/* 
Testing for Myanmar Unicode Support

Copyright 2005,2006 www.ThanLwinsoft.org
This work is licensed under a Creative Commons Attribution-ShareAlike 2.5 License.
http://creativecommons.org/licenses/by-sa/2.5/

You are free to modify this code to meet your requirements, as specified in the above 
license. Please include a link to www.thanlwinsoft.org on your website.

A simple detection algorithm based on the fact that a Myanmar Unicode enabled browser 
renders U+1000 U+1039 U+1000 with the 2 consonants stacked on top of each other. 
It should therefore have half the width of U+1000 U+1000.
A non-compliant browser will not interpret the 
U+1039 correctly and so renders it as 2 consonants of twice the width. 
If a Myanmar font is not installed, it will actually have 3 times the width.
Obviously, there are lots of possible variations for this test. 

Include these 2 strings in your page:
<span class="myUniTest" id="myWidth2">ကက</span>
<span class="myUniTest" id="myWidth1">က္က</span>

You can append the 2 test spans to any text in your page where it will not get in the way.
The style class makes it invisible by setting the color to be the same as the background. 
If you want to display a message showing the result of the check insert the following script somewhere
inside the document body AFTER the spans.
<script type="text/javascript">
myUnicode.checkWithMsg();
</script>

You may want to convert the Myanmar Unicode text to images if the browser does not support correct rendering. 
You must include a suitable js file with font image information and then add a suitable on load attribute to body.
<body id='body' onload="myUnicode.initParse('styles/');">
You will need to change styles/ to whatever is the path to the PadaukOT directory on your server.
This relies on the myUniTest spans being present in the document.

Currently the selection of font size to use for images is very crude and based only on 
h1,h2,h3,sup or sub tags. There is not support for styles or different background colors. 
If you need to improve the selection redefine myUnicode.chooseFontIndex(node), which returns 
the index of the font to use. These indices must correspond to the font indices used in the 
fontImages_PadaukOT or whichever font you define in myUnicode.fontData.
Currently, there is also not support for changing background color, but you could generate different colors for different indices.
Note: the myUniTest <span>s must be inside the body and before the myUnicode.check(); script, so they are available as the page loads. 
*/

// tweak these strings to meet your requirements

function myUnsupportedMsg(myIconPath)
{
    return "<div class='myUnicodeTestFailed'>" +
"<p class='myWarning'>Warning: This site uses the <a href='http://www.unicode.org' class='myFirefoxLink'>International Unicode Standard</a> to store and display Myanmar/Burmese text. " +
"Please upgrade to a browser with Myanmar Unicode support: " +
"<ol><li>Download a Graphite enabled Myanmar Unicode font such as " +
"<a href='http://www.thanlwinsoft.org/ThanLwinSoft/Downloads/#fonts' class='myFirefoxLink'>Padauk</a> and run the installer.</li>" +
"</ol></p>" +
// images for the Burmese translation, since we know the browser can't render it.
"<p class='myTextMsg'><img src='" + myIconPath + "myNoUnicode0.png' /><br />" +
"<a href='http://www.thanlwinsoft.org/ThanLwinSoft/Downloads/#fonts'><img src='" + myIconPath + "myNoUnicode1.png' /></a></p>" +
"<p><span class='myThanLwin'>This site uses <a href='http://www.thanlwinsoft.org' class='myFirefoxLink'>Myanmar Unicode technology from ThanLwinSoft.org</a></span></p></div>" ;
}

function mySupportedMsg(myIconPath)
{
    return "<p class='myGood'>Congratulations your browser is Myanmar Unicode enabled! <br />" +
"<span class='myText'>မိတ်ဆွေရဲ့ </span> web browser <span class='myText'>က မြန်မာ</span>" +
" Unicode <span class='myText'>ကို သုံးလို့ ရတဲ့အတွက် ဝမ်းမြောက်ပါတယ်။</span></p>";
}

var myCommon = {
    createElement : function(eName)
    {
        if (document.createElementNS)
            return document.createElementNS(
                "http://www.w3.org/1999/xhtml", eName);
        return document.createElement(eName);
    },
    getId : function (node)
    {
        if (node.id != undefined) return node.id;
        return note.getAttribute("id");
    }
};

function MyNodeParser(node) {
    this.node = node;
}

MyNodeParser.prototype.parse = function()
{
    var node = this.node;
    if (node == undefined || node.tagName == undefined || node.nodeType != 1) return;
        myUnicode.nodeCount++;
        var tag = node.tagName.toLowerCase();
        if (node.tagName.toLowerCase() == "input")
        {
                if (node.getAttribute("type").toLowerCase() == "text")
                {
                    myUnicode.addOverlay(node);
                }
                return; // don't mess with fields
        }
        else if (node.tagName.toLowerCase() == "textarea")
        {
             myUnicode.addOverlay(node);
             return; // don't mess with fields
        }
        else if (node.tagName.toLowerCase() == "option")
        {
             return; // don't mess with fields
        }
        else if (node.tagName.toLowerCase() == "svg")
        {
             return; // already processed
        }
        else if (node.tagName.toLowerCase() == "shape")
        {
             return; // already processed
        }
        else if (node.tagName.toLowerCase() == "canvas")
        {
             return; // already processed
        }
        else if (node.hasChildNodes())
        {
            
            var children = node.childNodes;
            var nodeCount = children.length;
            for (var i = 0; i < children.length; i++)
            {
                var child = children.item(i);
                if (child.nodeType == 3)//Node.TEXT_NODE
                {
                    myUnicode.parseText(child, new String(child.data));
                }
                else if (child.nodeType == 1)//Node.ELEMENT_NODE
                {
                    // nodes with ids can be parsed in batches to avoid 
                    // timeouts on long documents
                    if (myCommon.getId(child) != "myDebug")
                      myUnicode.queueNode(new MyNodeParser(child));
                }
                else if (child.nodeType == 8) {} // ignore comments
                else if (child.nodeType == 7) {} // ignore processing instructions
                else
                {
                    alert("node " + child + " type" + child.nodeType);
                }
                if (node.childNodes.length > nodeCount)
                {
                    children = node.childNodes;
                    // nodes were inserted
                    i += children.length - nodeCount;
                    nodeCount = children.length;
                }
                else if (node.childNodes.length < nodeCount)
                {
                    alert(nodeCount + " lost nodes " + node.childNodes.length);
                }
                else
                {
                    children = node.childNodes;
                }
            }
        }
}

/**
* Test the browser for Myanmar Unicode Support.
* Call this function from inside a script element inside the body of your web page.
* @return true if the browser has Myanmar Unicode support.
*/
function TlsMyUnicode()
{
    // config variables
    this.fontNames = "PadaukOT, Padauk, Myanmar3, Parabaik, 'MyMyanmar Unicode'";
    this.fontData  = "Padauk";// can be overridden
    this.imageFonts=new Object();
    this.svgFont = "Padauk";
    this.canvasFont = undefined;
    this.codeStart = 4096;// u1000 - inclusive
    this.codeEnd   = 4256;//u10A0 - exclusive
    this.imgPrefix = "";// prefix path to images
    this.imgSuffix = ".png";// image extension
    // index of font size to use in fontImage array e.g. if images exist for {10,12,14,16}pt
    this.defaultFont = 1;// index of default font
    this.h1Font = 2;
    this.h2Font = 2;
    this.h3Font = 1;
    this.h4Font = 1;
    this.thFont = 2;
    this.supFont = 1;// smallest index
    this.subFont = 1;
    // end user config variables
    this.isSupported = false;// flag determining support level - only valid after myUnicode.check();
    this.checkFinished = false;
    this.overlayCount = 0;
    this.currentNode = null;
    this.nodeCount = 0;
    this.isIe= false;
    this.isGecko= false;
    this.isOpera= false;
    this.retryCount= 0;
    this.queue = new Array();
    this.parseCount = 0;
    this.noticeNodeOffset = 8;
    this.conversionCount = 0;
    this.countThreshold = 5;
    this.debug = function() { return document.getElementById("myDebug");};
    return this;
}
    
    /** tests the width of the myWidth1/2 spans to see if Myanmar
    * Unicode support is available and displays a 
    * message to the user.
    */
TlsMyUnicode.prototype.checkWithMsg = function()
    {
        if (this.check())
        {
            var mySupported = mySupportedMsg(this.imgPrefix);
            if (mySupported.length > 0)
            {
                document.writeln(mySupported);
            }
        }
        else
        {
            var myUnsupported = myUnsupportedMsg(this.imgPrefix);
            if (myUnsupported.length > 0)
                document.writeln(myUnsupported);
        }
    };

    /** tests the width of the myWidth1/2 spans to see if Myanmar 
    * Unicode support is available 
    */
TlsMyUnicode.prototype.check = function ()
    {
        if (this.checkFinished == true) return this.isSupported;
        var widthTest = 0;
        var myW2 = document.getElementById('myWidth2');
        var myW1 = document.getElementById('myWidth1');
        if (!myW2 || !myW1)
        {
        var widthTest = document.createElement("p");
        document.body.appendChild(widthTest);

            myW2 = document.createElement("span");
            myW2.style.fontFamily = this.fontNames;
            myW2.setAttribute("id","myWidth2");
            widthTest.appendChild(myW2);
            myW2.innerHTML = "ကက";

            myW1 = document.createElement("span");
            myW1.style.fontFamily = this.fontNames;
            myW1.setAttribute("id","myWidth1");
            widthTest.appendChild(myW1);
            myW1.innerHTML = "က္ကြ";
        }
        var myW1Width = 0;
        var myW2Width = 0;
        this.checkFinished = true;
        if (myW1 && myW2)
        {
            myW1Width = myW1.offsetWidth;
            myW2Width = myW2.offsetWidth;
            // what does IE use for width?
            if (myW1Width == undefined) myW1Width = myW1.width;
            if (myW2Width == undefined) myW2Width = myW2.width;
            if (myW1Width == undefined && myW2Width == undefined || (myW2Width == 0 && myW1Width == 0))
            {
                this.isSupported = true;
                return true; // probably not visible, so we don't know
            }
        }
        else
        {
            this.isSupported = true;
            return true; // no test spans, so best not to convert to images
        }
    // debug line - you will probably not need this unless you have trouble
    //document.writeln('width1=' + myW1Width + ' width2=' + myW2Width + '<br/>');
    // the width of w2 may not always be exactly twice w1 depending on the font
    // and rounding errors. However it should be safe to say that w1's width should be 
    // much less than 3/4 of w2's width.
        if (myW1Width >= 0.75 * myW2Width || myW1Width == undefined)
        {
           //alert("w1 " + myW1Width + " w2 "+ myW2Width + " " );
        }
        else 
        {
            // comment out the next line to test non-Unicode support on supported browsers
            this.isSupported = true;
        } 
        myW1.removeChild(myW1.firstChild);
        myW2.removeChild(myW2.firstChild);
        if (widthTest != 0)
            document.body.removeChild(widthTest);
        return this.isSupported;
    };
    /** initialise the img location, check for unicode support and convert to 
    * images if needed 
    * This is designed to be called in the onload function of body.
    * @param imgPrefix path (relative or absolute) to the PadaukOT.js file.
    */
TlsMyUnicode.prototype.initParse = function(theImgPrefix)
    {
        var userAgent =navigator.userAgent.toLowerCase();
        this.isGecko = (userAgent.indexOf('gecko') != -1);
        this.isIe = (userAgent.indexOf("msie")!=-1);
        this.isOpera = (userAgent.indexOf("opera")!=-1);
        this.addScript(theImgPrefix + "myParser.js");
        this.addScript(theImgPrefix + "canvas/tlsFont.js");
        if (this.isIe)
            //this.addScript(theImgPrefix + "excanvas/excanvas.js");
            this.addScript(theImgPrefix + "canvas/tlsVmlFont.js");
        else
            this.addScript(theImgPrefix + "canvas/tlsCanvasFont.js");
        this.addScript(theImgPrefix + "svg/" + this.fontData + ".js");
        this.addScript(theImgPrefix + "svg/" + this.fontData + "Rendered.js");
        this.imgPrefix = theImgPrefix;
        if (this.checkFinished == false) this.check();
        this.parseDoc();
        this.retryCount = 0;
        if (this.isOpera) this.countThreshold = 0;
    };
TlsMyUnicode.prototype.addScript= function(src)
    {
        var head = document.getElementsByTagName("head")[0];
        var scripts = head.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; i++)
            if (scripts[i].getAttribute("src") == src) return;
        var script = document.createElement("script");
        script.setAttribute("type","text/javascript");
        script.setAttribute("src", src);
        head.appendChild(script);
    };
    /** normal entry point to start conversion from unicode to images */
TlsMyUnicode.prototype.parseDoc = function()
    {
        if (this.checkFinished && this.isSupported == false)
        {
            try
            {
                // wait for the script additions to take affect
                //if (mySvgFont.hasFontData(this.svgFont) == false)
                if (tlsFontCache.hasFont(this.fontData) == false)
                {
                    setTimeout("myUnicode.parseDoc()", 500);
                    this.retryCount++;
                    return;
                }
            }
            catch (notDefException)
            { 
                setTimeout("myUnicode.parseDoc()", 500);
                this.retryCount++;
                return;
            }

            //this.createNotice();
            this.nodeCount = 0;
            this.parseDocWorker();
        }
    };
    /** normal entry port to convert just part of a document from unicode to 
    * images 
    * @param node the node to parse
    */
TlsMyUnicode.prototype.parseNodeIfNeeded = function(node)
    {
        if (this.checkFinished && this.isSupported == false)
        {
            if ((typeof tlsFontCache != "undefined" && 
                tlsFontCache.hasFont(this.fontData) == true))
            {
                this.parseNode(node);
            }
        }
    };
    /** call back from parseDoc */
TlsMyUnicode.prototype.parseDocWorker = function ()
    {
        this.parseNode(document.getElementsByTagName("body").item(0));
    };
    /** createNotice at top (bottom if fixed is supported) while conversion is 
    * running */
TlsMyUnicode.prototype.createNotice = function ()
    {
        var notice = document.getElementById("myParseNotice");
        if (notice)
        {
            notice.style.display = "";
            return;
        }
        var frag = document.createDocumentFragment();
        if (document.createElementNS) notice = document.createElementNS("http://www.w3.org/1999/xhtml","div");
        else notice = document.createElement('div');
        notice.setAttribute("id",'myParseNotice');
        notice.setAttribute("title","Your browser doesn't support Myanmar Unicode or you don't have a suitable font. Please see www.thanlwinsoft.org.");
        // firefox supports position: fixed, so place it at the bottom of the screen
        notice.setAttribute("style","background-color: red; color: white; position: fixed; right: 0px; bottom: 0px; z-index: 5;");
        if (notice.style)
        {
        notice.style.backgroundColor = "red";
        notice.style.color = "white";
        if (notice.style.position != "fixed")
        {
            notice.style.position = "absolute";
            notice.style.right = "0px";
            notice.style.fontHeight = "12px";
            //notice.style.top = "0px";
            if( document.documentElement)
                notice.style.top = (document.documentElement.clientHeight - 40) + "px";
            else notice.style.top = "0px";
        }
        notice.style.zIndex = 5;
        notice.style.fontWeight = "bold";
        }
        var mySpan = document.createElement("span");
        var myMsg = document.createTextNode("ခဏစောင့်ပါ။");
        mySpan.appendChild(myMsg);
        var msg = document.createTextNode("...Converting Myanmar text to images");
        var body = document.getElementsByTagName("body")[0];
        frag.appendChild(notice);
        notice.appendChild(myMsg);
        this.parseText(myMsg, new String(myMsg.data));
        notice.appendChild(msg);
        var br;
        if (document.createElementNS) br = document.createElementNS("http://www.w3.org/1999/xhtml","br");
        else br = document.createElement("br");
        notice.appendChild(br);
        body.insertBefore(frag, body.firstChild);
    };
TlsMyUnicode.prototype.hideNotice = function ()
    {
        var notice = document.getElementById('myParseNotice');
        if (notice) 
        {
            notice.style.display = "none";
            for (var i = this.noticeNodeOffset; i < notice.childNodes.length; i++)
            {
                notice.removeChild(notice.childNodes[i]);
            }
        }
    };
    /** creates a div overlay ontop of a text input/textarea for displaying
    * images of the input contents 
    */
TlsMyUnicode.prototype.addOverlay = function (node)
    {
        if (myKeyboardMover != undefined)
        {
            myK.addOverlay(node);
        }
        //else alert("no myOverlay");
    };
TlsMyUnicode.prototype.parseNextNode = function()
    {
        if (this.queue.length > 0)
        {
            var nParser = this.queue[0];
            nParser.parse();
            this.parseCount++;
            this.queue.shift();
            if (this.conversionCount > this.countThreshold || this.parseCount > 100)
            {
                this.conversionCount = 0;
                this.parseCount = 0;
                setTimeout("myUnicode.parseNextNode()",1);
                this.createNotice();
                var notice = document.getElementById('myParseNotice');
                if (notice.childNodes.length > 80)
                    for (var i = notice.childNodes.length - 1; i > this.noticeNodeOffset; i--)
                        notice.removeChild(notice.childNodes[i]);
                notice.appendChild(document.createTextNode("."));
            }
            else 
                this.parseNextNode();
        }
        else
        {
            this.conversionCount = 0;
            this.parseCount = 0;
            this.hideNotice();
        }
    };
    /** parse an element node and all its children */
TlsMyUnicode.prototype.parseNode = function (node)
    {
        this.queueNode(new MyNodeParser(node));
    };
    /** callback from MyNodeParser */
TlsMyUnicode.prototype.queueNode = function (nodeParser)
    {
        this.queue.push(nodeParser);
        if (this.queue.length == 1)
            this.parseNextNode();
    };

    /** tests whether the code point is in the range where images may be needed */
TlsMyUnicode.prototype.inRange = function(code)
    {
        if (code == 0x25cc) return true; // hack for dotted circle
        if ((code >= this.codeStart) &&
            (code < this.codeEnd))
            return true;
        return false;
    };
    /** parses a text node and converts it to images if required */
TlsMyUnicode.prototype.parseText = function(node, text)
    {
        if (text == undefined) return;

        var docFrag = undefined;
        var lastMatchEnd = -1;
        var codeString = "u";
        var lastOutput = 0;
        var width = 0;
        var height = 0;
        var fontSize = 0;
        var maxCharLen = 12;
        var sizeIndex = 0;
        for (var i = 0; i < text.length; i++)
        {
            var code = text.charCodeAt(i);
            
            if (this.inRange(text.charCodeAt(i)))
            {
                if (typeof docFrag == "undefined")
                {
                    docFrag = document.createDocumentFragment();
                    var prefix = document.createTextNode(text.substring(0,i));
                    docFrag.appendChild(prefix);
                    this.conversionCount++;
                    // these don't change between strings, so set them once
                    if (typeof tlsFontCache != "undefined" && tlsFontCache.hasFont(this.fontData))
                    {
                        if (!this.canvasFont)
                        {
                            TlsDebug().print("Loaded font: " + this.fontData);
                            if (this.isIe)
                                this.canvasFont = new TlsVmlFont(tlsFontCache[this.fontData]);
                            else
                                this.canvasFont = new TlsCanvasFont(tlsFontCache[this.fontData]);
                        }
                    }
                }
                    var j;
                    for (j = i + 1; j < i + text.length; j++)
                    {
                        code = text.charCodeAt(j);
                        if (this.inRange(code) == false) break;
                        if (typeof myParser != 'undefined' && myParser.canBreakAfter(text, j - 1))
                        {
                            break;
                        }
                    }
                    try
                    {
                        var textColor = document.fgColor;
                        var backColor = document.bgColor;

                        if (typeof this.canvasFont != "undefined")
                        {
                            var computedStyle = this.canvasFont.computedStyle(node.parentNode);
                            //TlsDebug().dump(computedStyle,2);
                            if (computedStyle && computedStyle.color)
                            {
                                textColor = computedStyle.color;
                                if (this.isIe) 
                                {
                                    if (computedStyle.backgroundColor)
                                        backColor = computedStyle.backgroundColor;
                                    else
                                        backColor = "#fff";
                                }
                            }
                            else if (node.parentNode.style.color.specified)
                                textColor = node.parentNode.style.color;

                            var fontSize = this.canvasFont.nodeFontSize(node.parentNode);
                            if (this.canvasFont.appendText(docFrag, fontSize, text.substring(i,j), textColor, undefined))//(this.isIe)?backColor:undefined
                            {
                                i = j - 1;
                            }
                            else return;// something failed, best not to replace anything
                        }
                    }
                    catch (e) 
                    { 
                        if (typeof TlsDebug != "undefined")
                            TlsDebug().print("Exception:" + e + 
                                ((e.description)? e.description + e.line : "")); 
                    }

            }
            else if (docFrag != undefined)
            {
                var normalText = document.createTextNode(text.substring(i,i+1));
                docFrag.appendChild(normalText);
            }
        }
        // replace with new text
        if (docFrag != undefined)
        {
            var parent = node.parentNode;
			if (this.isIe && parent.getAttribute("href"))
			{
				for (var j = 0; j < docFrag.childNodes.length; j++)
				{
					if (docFrag.childNodes[j].nodeType != 1) continue;
					for (var k = 0; k < docFrag.childNodes[j].childNodes.length; k++)
					{
						var sNode = docFrag.childNodes[j].childNodes[k];
						if (sNode.nodeType != 1) continue;
						if (sNode.tagName.toLowerCase().indexOf("shape") > -1)
							sNode.setAttribute("href", parent.getAttribute("href"));
					}
				}
			}
            if (parent) parent.replaceChild(docFrag, node);
        }
    };

    /** Choose which image size to use for the given node type 
    * This could be modified to look at the specified style, or class on the
    * node, but currently, this is ignored.
    */
TlsMyUnicode.prototype.chooseFontIndex = function(node)
    {
        var index = this.defaultFont;
    if (! node.tagName) return index;
        var elementName = node.tagName.toLowerCase();
        while (elementName == "a" || elementName == "span" || 
               elementName == "b" || elementName == "i" || elementName == "emph")
        {
            node = node.parentNode;
            elementName = node.tagName.toLowerCase();
        }
        if (elementName == "h1") index = this.h1Font;
        else if (elementName == "h2") index = this.h2Font;
        else if (elementName == "h3") index = this.h3Font;
        else if (elementName == "h4") index = this.h4Font;
        else if (elementName == "sup") index = this.supFont;
        else if (elementName == "sub") index = this.subFont;
        else if (elementName == "th") index = this.thFont;
        //else if (elementName == "dt") index = this.thFont;
        return index;
    }

var myUnicode = new TlsMyUnicode();

