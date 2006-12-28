/*
Copyright 2006 ThanLwinSoft.org

You are free to use this on your website and modify it is
subject to the  Creative Commons license. 
However, please add a link to www.thanlwinsoft.org 
on every page that uses this script. For more info
and contact details see www.thanlwinsoft.org.

This copyright statement must not be removed.

Version:       0.1
Author:        Keith Stribley (KRS)
Contributors:  

Change History:
23-09-2006	KRS	Initial Version

Script to display source in a web page.
It assumes that divs similar to the following are present.

<div class="source" style="display:none;">
<h2>HTML Source</h2>
<pre id="source" >
</pre>
</div>
<div class="source"  style="display:none;">
<h2>CSS Source</h2>
<iframe id="css"></iframe>
</div>
<div class="source"  style="display:none;">
<h2>Javascript Source</h2>
<pre id="js">
</pre>
</div>

*/
function MySource()
{
/**
* retreives the source of the body element for the current document - this might have been dynamically changed..
* @param id of pre to display content
*/
this.viewSource = function(id)
{
	var source = "<html>" + document.getElementsByTagName("html")[0].innerHTML + 
		         "</html>";
	var tagStart = /</gi;
	var tagEnd = />/gi;
	var amp = /&/gi;
	//source = source.replace(tagStart, "&lt;");
	//source = source.replace(tagEnd, "&gt;");
	//source = source.replace(tagEnd, ">\n");
	//source = source.replace(amp,"&amp;");
	var sourcePre = document.getElementById(id);
	var sourceContents = document.createTextNode(source);
	if (sourcePre)
	{	
		sourcePre.appendChild(sourceContents);
		sourcePre.style.display = '';
		sourcePre.parentNode.style.display = '';
		document.location = "#" + id;
	}
};

/** view the css rules that are applied in the first style sheet 
* This probably only works in firefox and mozilla
* @param id of pre to display content
*/
this.viewCSS = function(id, stylesheetIndex)
{
	try
	{
		var stylesheet = document.styleSheets[stylesheetIndex];
		if (stylesheet)
		{
			var rules = stylesheet.cssRules;
			var source = "";
			var i = 0; 
			for (i = 0; i<rules.length; i++)
			{
				source += rules[i].cssText + "\n";
			}
			source.replace(/{/,"{\r\n");
			source.replace(/}/,"{\r\n");
			var sourcePre = document.getElementById(id);
			var sourceContents = document.createTextNode(source);
			if (sourcePre) 
			{
				sourcePre.appendChild(sourceContents);
				sourcePre.style.display = '';
				sourcePre.parentNode.style.display = '';
				document.location = "#" + id;
			}
		}
	}
	catch (e)
	{
	}
};

/**
* Can be used to display a CSS or JS file, but not an HTML file
* Unfortunately IE tries to open the program associated with CSS/JS, 
* so it isn't very useful except on firefox.
* @param id of iframe to display content
*/
this.viewJS = function(id, src)
{
	
	var sourcePre = document.getElementById(id);
	
	if (sourcePre) 
	{
		sourcePre.setAttribute('src',src);
		sourcePre.style.display = '';
		sourcePre.parentNode.style.display = '';
		document.location = "#" + id;
	}
};




	
	this.request = null;
	this.targetId = null;
	this.docText = null;
	
	/**
	* A very versatile method of getting a file and getting around the browsers attempt to open the file 
	* associated with the file type.
	* Note the actual file is displayed in the call back docReady not this method.
	* @param id of pre to insert source file contents
	* @param name of file to retreive
	*/
	this.getSourceFile = function(targetId, name)
	{
		mySource.request = xmlRequest.getRequestObject();
		mySource.targetId = targetId;
		
		mySource.request.open('get',name, true);
		mySource.request.onreadystatechange = mySource.docReady;
		mySource.request.send("");
		
	};
	/**
	* Call back when getSourceFile is loaded.
	*/
	this.docReady = function(event)
	{
		if (mySource.request.readyState == 4)
		{
			var docText = mySource.request.responseText;
			var element = document.getElementById(mySource.targetId);
			if (element)
			{
				element.style.display = '';
				element.parentNode.style.display = '';
				document.location = "#" + mySource.targetId;
				docText = docText.replace(/\n/gi,"\r\n");
				var textNode = document.createTextNode(docText);
				while (element.hasChildNodes())
					element.removeChild(element.lastChild);
				element.appendChild(textNode);
				/*
				var width;
				if (top.window.innerWidth)
				{
				      width = top.window.innerWidth;
					  element.style.width = (width - 50) + "px";
				}
				else
				{
				      width = parent.document.body.clientWidth;
					  element.style.width = (width - 50) + "px";
				}
				*/
			}
			//alert(mySource.request.responseText);
		}
		//alert(mySource.request.readyState);
	}
	
	return this;
}

var mySource = MySource();


