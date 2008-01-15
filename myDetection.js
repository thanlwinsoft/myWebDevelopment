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
var myIconPath = "";
var mySupported = "<p class='myGood'>Congratulations your browser is Myanmar Unicode enabled! <br />" +
"<span class='myText'>မိတ်ဆွေရဲ့ </span> web browser <span class='myText'>က မြန်မာ</span>" +
" Unicode <span class='myText'>ကို သုံးလို့ ရတဲ့အတွက် ဝမ်းမြောက်ပါတယ်။</span></p>";
var myUnsupported = "<div class='myUnicodeTestFailed'>" +
"<p class='myWarning'>Warning: This site uses the <a href='http://www.unicode.org' class='myFirefoxLink'>International Unicode Standard</a> to store and display Myanmar/Burmese text. " +
"Please upgrade to a browser with Myanmar Unicode support: " +
"<ol><li>Download a Graphite enabled Myanmar Unicode font such as " +
"<a href='http://www.thanlwinsoft.org/ThanLwinSoft/Downloads/#fonts' class='myFirefoxLink'>Padauk</a> and run the installer.</li>" +
"<li>Install <a href='http://sila.mozdev.org/grFirefox.html' class='myFirefoxLink'>Graphite enabled Firefox</a> (Normal Mozilla Firefox may not work correctly).</li></ol></p>" +
// images for the Burmese translation, since we know the browser can't render it.
"<p class='myTextMsg'><img src='" + myIconPath + "myNoUnicode0.png' /><br />" +
"<a href='http://www.thanlwinsoft.org/ThanLwinSoft/Downloads/#fonts'><img src='" + myIconPath + "myNoUnicode1.png' /></a><br />" +
"<a href='http://sila.mozdev.org/grFirefox.html'><img src='" + myIconPath +"myNoUnicode2.png' /></a></p>" +
"<p><span class='myThanLwin'>This site uses <a href='http://www.thanlwinsoft.org' class='myFirefoxLink'>Myanmar Unicode technology from ThanLwinSoft.org</a></span></p></div>" ;

/**
* Test the browser for Myanmar Unicode Support.
* Call this function from inside a script element inside the body of your web page.
* @return true if the browser has Myanmar Unicode support.
*/
var myUnicode = {
    // config variables
    fontData  : "PadaukOT",// can be overridden
    svgFont : "Padauk",
    codeStart : 4096,// u1000 - inclusive
    codeEnd   : 4256,//u10A0 - exclusive
    imgPrefix : "",// prefix path to images
    imgSuffix : ".png",// image extension
    // index of font size to use in fontImage array e.g. if images exist for {10,12,14,16}pt
    defaultFont : 1,// index of default font
    h1Font : 2,
    h2Font : 2,
    h3Font : 1,
    h4Font : 1,
    thFont : 2,
    supFont : 1,// smallest index
    subFont : 1,
	// end user config variables
	isSupported : false,// flag determining support level - only valid after myUnicode.check();
    checkFinished : false,
	overlayCount : 0,
	currentNode : null,
    nodeCount : 0,
    threadStart : 0,
    threadEnd : 0,
    isIe: false,
    isGecko: false,
	/** tests the width of the myWidth1/2 spans to see if Myanmar
    * Unicode support is available and displays a 
	* message to the user.
	*/
	checkWithMsg : function()
	{
	    if (myUnicode.check())
	    {
	        if (mySupported.length > 0)
	        {
	            document.writeln(mySupported);
	        }
	    }
	    else
	    {
	        if (myUnsupported.length > 0)
	            document.writeln(myUnsupported);
	    }
	},

	/** tests the width of the myWidth1/2 spans to see if Myanmar 
    * Unicode support is available 
    */
	check : function ()
	{
	    
	    var myW2 = document.getElementById('myWidth2');
        if (!myW2)
        {
            myW2 = document.createElement("p");
            myW2.setAttribute('class','myUniTest');
            myW2.setAttribute("id","myWidth2");
            document.body.appendChild(myW2);
            myW2.innerHTML = "ကက";
        }
	    var myW1 = document.getElementById('myWidth1');
        if (!myW1)
        {
            myW1 = document.createElement("p");
            myW1.setAttribute('class','myUniTest');
            myW1.setAttribute("id","myWidth1");
            document.body.appendChild(myW1);
            myW1.innerHTML = "က္က";
        }
	    var myW1Width = 0;
	    var myW2Width = 0;
        if (myUnicode.checkFinished == true) return myUnicode.isSupported;
        myUnicode.checkFinished = true;
	    if (myW1 && myW2)
	    {
	        myW1Width = myW1.offsetWidth;
	        myW2Width = myW2.offsetWidth;
	        // what does IE use for width?
	        if (myW1Width == undefined) myW1Width = myW1.width;
	        if (myW2Width == undefined) myW2Width = myW2.width;
			if (myW1Width == undefined && myW2Width == undefined || (myW2Width == 0 && myW1Width == 0))
			{
				myUnicode.isSupported = true;
				return true; // probably not visible, so we don't know
			}
	    }
	    else
	    {
			myUnicode.isSupported = true;
			return true; // no test spans, so best not to convert to images
	    }
	// debug line - you will probably not need this unless you have trouble
	//document.writeln('width1=' + myW1Width + ' width2=' + myW2Width + '<br/>');
	// the width of w2 may not always be exactly twice w1 depending on the font
	// and rounding errors. However it should be safe to say that w1's width should be 
	// much less than 3/4 of w2's width.
	    if (myW1Width >= 0.75 * myW2Width || myW1Width == undefined)
	    {

	    }
	    else 
	    {
			// comment out the next line to test non-Unicode support on supported browsers
	        myUnicode.isSupported = true;
	    } 
	    myW1.removeChild(myW1.firstChild);
	    myW2.removeChild(myW2.firstChild);
	    return myUnicode.isSupported;
	},
	/** initialise the img location, check for unicode support and convert to 
    * images if needed 
    * This is designed to be called in the onload function of body.
    * @param imgPrefix path (relative or absolute) to the PadaukOT.js file.
    */
    initParse : function(theImgPrefix)
    {
        var userAgent =navigator.userAgent.toLowerCase();
        myUnicode.isGecko = (userAgent.indexOf('gecko') != -1);
        myUnicode.isIe = (userAgent.indexOf("msie")!=-1);
        if (!myUnicode.isIe)
        {
            myUnicode.addScript(theImgPrefix + "svg/mySvgFont.js");
            myUnicode.addScript(theImgPrefix + "svg/" + myUnicode.svgFont + ".js");
            myUnicode.addScript(theImgPrefix + "svg/" + myUnicode.svgFont + "Rendered.js");
        }
        myUnicode.imgPrefix = theImgPrefix;
        if (myUnicode.checkFinished == false) myUnicode.check();
        myUnicode.parseDoc();
    },
    addScript: function(src)
    {
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        script.setAttribute("type","text/javascript");
        script.setAttribute("src", src);
        head.appendChild(script);
    },
	/** normal entry port to start conversion from unicode to images */
    parseDoc : function()
    {
        if (myUnicode.checkFinished && myUnicode.isSupported == false)
        {
            myUnicode.createNotice();
            myUnicode.nodeCount = 0;
            myUnicode.threadStart++;
            setTimeout("myUnicode.parseDocWorker()", 5);
        }
    },
    /** normal entry port to convert just part of a document from unicode to 
    * images 
    * @param node the node to parse
    */
    parseNodeIfNeeded : function(node)
    {
        if (myUnicode.checkFinished && myUnicode.isSupported == false)
        {
            myUnicode.createNotice();
            myUnicode.threadStart++;
            myUnicode.parseNode(node);
            myUnicode.checkThreads();
        }
    },
    /** call back from parseDoc */
    parseDocWorker : function ()
    {
            myUnicode.parseNode(document.getElementsByTagName("body")[0]);
            myUnicode.checkThreads();
    },
    /** checks the number of threads waiting to run via setTimeout */
    checkThreads : function()
    {
        myUnicode.threadEnd++;
        if (myUnicode.threadEnd >= myUnicode.threadStart)
        {
            //alert("Threads finished" + myUnicode.threadEnd + "/" +myUnicode.threadStart);
            myUnicode.threadStart = 0;
            myUnicode.threadEnd = 0;
            myUnicode.hideNotice();
        }
        else
        {
            /** show that something is still hapenning */
            var notice = document.getElementById("myParseNotice");
            notice.appendChild(document.createTextNode("."));
        }
    },
    /** createNotice at top (bottom if fixed is supported) while conversion is 
    * running */
    createNotice : function ()
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
        notice.setAttribute("title","Your browser doesn't support Myanmar Unicode. See www.thanlwinsoft.org for more details.");
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
            notice.style.top = "0px";
        }
        notice.style.zIndex = 5;
        notice.style.fontWeight = "bold";
        }
        var msg = document.createTextNode("Please wait ... Converting Myanmar text to images");
        var body = document.getElementsByTagName("body")[0];
        frag.appendChild(notice);
        notice.appendChild(msg);
        var br;
        if (document.createElementNS) br = document.createElementNS("http://www.w3.org/1999/xhtml","br");
        else br = document.createElement("br");
        notice.appendChild(br);
        body.insertBefore(frag, body.firstChild);
    },
    hideNotice : function ()
    {
        var notice = document.getElementById('myParseNotice');
        if (notice) notice.style.display = "none";
        
        for (var i = 2; i < notice.childNodes.length; i++)
        {
            notice.removeChild(notice.childNodes[i]);
        }
    },
    /** creates a div overlay ontop of a text input/textarea for displaying images of the input contents */
    addOverlay : function (node)
    {
        if (myKeyboardMover != undefined)
        {
            if (node.previousSibling && node.previousSibling.nodeType == 1 &&
                node.previousSibling.getAttribute('id') && 
                new String(node.previousSibling.getAttribute('id')).indexOf("myOverlay") > -1)
            {
                //alert("overlay exists");
                return; // already exists
            }
            var inputDim = myKeyboardMover.initItemPos(node);
            var docFrag = document.createDocumentFragment();
            var overlay;
            if (document.createElementNS) overlay = document.createElementNS("http://www.w3.org/1999/xhtml","div");
            else overlay = document.createElement("div");
            myUnicode.overlayCount++;
            overlay.setAttribute("id", "myOverlay" + myUnicode.overlayCount);
			//overlay.setAttribute("onclick","myK.updateOverlay(document.getElementById('myOverlay" + 
			//		myUnicode.overlayCount + "').nextSibling)");
            var index = 0;
            var inputNodes = document.getElementsByTagName(node.nodeName.toLowerCase());
            while (inputNodes.item(index) != node && index < inputNodes.length) index++;
            overlay.onclick = function() {
                myK.updateOverlay(this.nextSibling);
                myK.switchInputByIndex(node.nodeName.toLowerCase(), index); node.focus();
            };
			if (overlay.style)// ie ignores style attributes set above
			{
				overlay.style.left = inputDim.x + "px";
				overlay.style.top = inputDim.y + "px";
				overlay.style.width = inputDim.width + "px";
				overlay.style.height = inputDim.height + "px";
				overlay.style.position = "absolute";
				
				if (node.backgroundColor)
					overlay.style.backgroundColor = node.backgroundColor;
				else
					overlay.style.backgroundColor = "white";
				overlay.style.borderStyle = "solid";
				overlay.style.borderWidth = "1px";
				
				overlay.style.overflow = "auto";
                overlay.id = "myOverlay" + myUnicode.overlayCount;
			}
			//overlay.style.display = "none";
            if (node.value)
            {
                var value = document.createTextNode(node.value);
                overlay.appendChild(value);
            }
            docFrag.appendChild(overlay);
            var parent = node.parentNode;
            parent.insertBefore(docFrag, node);
            myUnicode.parseText(node.previousSibling.firstChild, new String(node.value));
        }
        //else alert("no myOverlay");
    },
    
	/** parse an element node and all its children - may be called by directly or recursively */
    parseNode : function (node)
    {
        if (node == undefined || node.tagName == undefined || node.nodeType != 1) return;
        myUnicode.nodeCount++;
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
        else if (node.tagName.toLowerCase() == "svg")
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
                    // nodes with ids can be parsed in separate thread to avoid timeouts on long documents
                    // ie6 doesn't support hasAttribute
                    var childId;
                    if (child.hasAttribute)
                    {
                         if (child.hasAttribute("id")) childId = child.getAttribute("id");
                        else childId = "";
                    }
                    else
                    {
                        childId = child.id;
                    }
                    if (childId != undefined && childId.length > 0 && child.hasChildNodes() && child.childNodes.length > 2) 
                    {
                        myUnicode.threadStart++;
                        setTimeout("myUnicode.parseNode(document.getElementById('" + childId + "'));myUnicode.checkThreads();", 
                                        10 + myUnicode.threadStart * 100);
                    }
                    else myUnicode.parseNode(child);
                }
                else if (child.nodeType == 8) {} // ignore comments
                else if (child.nodeType == 7) {} // ignore processing instructions
                else
                {
                    alert("node " + child + " type" + child.nodeType);
                }
                children = node.childNodes;
                if (children.length > nodeCount)
                {
                    // nodes were inserted
                    i += children.length - nodeCount;
                    nodeCount = children.length;
                }
            }
        }
    },
	/** tests whether the code point is in the range where images may be needed */
    inRange : function(code)
    {
        if (code == 0x25cc) return true; // hack for dotted circle
        if ((code >= myUnicode.codeStart) &&
            (code < myUnicode.codeEnd))
            return true;
        return false;
    },
	/** parses a text node and converts it to images if required */
    parseText : function(node, text)
    {
        if (text == undefined) return;
        var docFrag;
        var lastMatchEnd = -1;
        var codeString = "u";
        var lastOutput = 0;
        var width = 0;
		var height = 0;
        var fontSize = 0;
        var maxCharLen = 0;
		var sizeIndex = 0;
        for (var i = 0; i < text.length; i++)
        {
            var code = text.charCodeAt(i);
            
            if (myUnicode.inRange(text.charCodeAt(i)))
            {
                if (docFrag == undefined)
                {
                    docFrag = document.createDocumentFragment();
                    var prefix = document.createTextNode(text.substring(0,i));
                    docFrag.appendChild(prefix);
					// these don't change between strings, so set them once
                    maxCharLen = eval("fontImages_" + myUnicode.fontData + ".maxCharLen");
					//var fontSizes = eval("fontImages_" + myUnicode.fontData + ".fontSize");
                    var fontHeights = eval("fontImages_" + myUnicode.fontData + ".fontHeight");
//                    var nodeSize = new Number(node.parentNode.offsetHeight);        
//                    for (sizeIndex = 0; sizeIndex < fontHeights.length; sizeIndex++)
//					{
//						if (fontHeights[sizeIndex] >= nodeSize)
//							break;
//					}
					sizeIndex = myUnicode.chooseFontIndex(node.parentNode);
                    if (sizeIndex >= fontHeights.length) 
						sizeIndex = fontHeights.length - 1;
                    height = fontHeights[sizeIndex];
                    fontSize = eval("fontImages_" + myUnicode.fontData + ".fontSize[" + sizeIndex + "];");
                    //var realFontSize = node.getRealFontsize();
					//alert("Fontsize: " + nodeSize + "/" + height + " " + node.parentNode.offsetHeight);
                }
                if (myUnicode.isIe) // convert to images
                {
                    codeString = "u";                
                    lastMatchEnd = -1;
                    for (var j = i; j < i + maxCharLen; j++)
                    {
                        code = text.charCodeAt(j);
                        if (myUnicode.inRange(code) == false) break;
                        if (code < 256) codeString += "00";
                        codeString += code.toString(16);
                        try
					    {
	                        var imageProp = eval("fontImages_" + myUnicode.fontData + "." + codeString);
	                        if (imageProp == undefined)
	                        {
	                        }
	                        else
	                        {
	                            lastMatchEnd = j;
	                            width = imageProp[sizeIndex];
	                        }
					    }
					    catch (e){}
                    }
                    // was there a match?
                    if (lastMatchEnd > -1) // yes
                    {
                        
                        codeString = codeString.substring(0, (lastMatchEnd - i + 1) * 4 + 1);
                        var img;
                        if (document.createElementNS) img =
                            document.createElementNS("http://www.w3.org/1999/xhtml","img");
                        else img = document.createElement("img");
                        img.setAttribute("src", myUnicode.imgPrefix + myUnicode.fontData + 
									    "_" + fontSize +
									    "/" +
                                         codeString.substring(1,codeString.length) +
                                         myUnicode.imgSuffix);
                        img.setAttribute("alt", text.substring(i,lastMatchEnd + 1));
                        img.setAttribute("title","");// stop IE using alt as title
                        img.setAttribute("class","myText2Image");
                        img.setAttribute("style","vertical-align: middle; width: " +
						    width + "px; height: " + height + "px;");
					    if (img.style) // ie ignores the above style attributes
					    {
						    img.style.height = height + "px";
						    img.style.width = width + "px";
						    img.style.verticalAlign = "middle";
                            img.style.borderLeftStyle = "none";
                            img.style.borderRightStyle = "none";
                            img.style.borderTopStyle = "none";
					    }
                        docFrag.appendChild(img);
                        // advance i
                        i = lastMatchEnd;
                        //alert(codeString);
                    }
                    else
                    {
                        // no, just output raw unicode, we can't do anything else
                        var unexpectedText = document.createTextNode(text.substring(i,i+1));
                        docFrag.appendChild(unexpectedText);
                    }
                }
                else // svg
                {
                    var j;
                    for (j = i + 1; j < i + text.length; j++)
                    {
                        code = text.charCodeAt(j);
                        if (myUnicode.inRange(code) == false) break;
                    }
                    var fontSize = mySvgFont.nodeFontSize(node.parentNode);
                    var textColor = document.fgColor;
                    var backColor = document.bgColor;
                    var computedStyle = mySvgFont.computedStyle(node.parentNode);
                    if (computedStyle) textColor = computedStyle.color;
                    mySvgFont.appendSvgText(docFrag, myUnicode.svgFont, fontSize, text.substring(i,j), textColor, backColor);
                    i = j - 1;
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
            parent.replaceChild(docFrag, node);
        }
    },
    
    /** Choose which image size to use for the given node type 
    * This could be modified to look at the specified style, or class on the
    * node, but currently, this is ignored.
    */
    chooseFontIndex : function(node)
    {
        var index = myUnicode.defaultFont;
        var elementName = node.tagName.toLowerCase();
        while (elementName == "a" || elementName == "span" || 
               elementName == "b" || elementName == "i" || elementName == "emph")
        {
            node = node.parentNode;
            elementName = node.tagName.toLowerCase();
        }
        if (elementName == "h1") index = myUnicode.h1Font;
        else if (elementName == "h2") index = myUnicode.h2Font;
        else if (elementName == "h3") index = myUnicode.h3Font;
        else if (elementName == "h4") index = myUnicode.h4Font;
        else if (elementName == "sup") index = myUnicode.supFont;
        else if (elementName == "sub") index = myUnicode.subFont;
        else if (elementName == "th") index = myUnicode.thFont;
        //else if (elementName == "dt") index = myUnicode.thFont;
        return index;
    }
};

