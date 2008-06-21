/*
Copyright 2005,2006 ThanLwinSoft.org

You are free to use this on your website and modify it 
subject to a Creative Commons license. 
However, please add a link to www.thanlwinsoft.org 
on every page that uses this script. For more info
and contact details see www.thanlwinsoft.org.

This copyright statement must not be removed.

Version:       0.4
Author:        Keith Stribley (KRS)
Contributors:  

Change History:
08-07-2005    KRS    Initial Version
24-07-2006    KRS    Modified for new Unicode Proposal
23-07-2006    KRS    Keyboard can now be dragged around browser window
01-01-2008    KRS    Enable characters to be typed with normal keyboard

*/

/**
* The algorithm used here uses the syllable structure from Unicode 4
* Chapter 10.3 and the new Unicode Proposal that is in the Pipeline.
* The only difference is that medial ya and ra are combined
* since they never occur together in modern Burmese.
* 
*/

var myK =  {
pathStem : "", /* change to give the path of the  keyboard stylesheet and images */
inputId : 'textInput',
inputType : "",
inputIndex : "",
inputNode : undefined,
consMode : 0,
numLevels : 14,
lang : '',
langAvailable : [],
keyboardIcon : "Keyboard.png",
keyboardOffIcon : "KeyboardOff.png",
keyboardVisible : false,
keyboardSrc : "Keyboard.html",
selectionColor : "#c0c0ff",
lastTokenLength : 1, // used by myK.getCharOrder()
afterKey : 0,
fillerChar : "\u200B",
debug : function() { return document.getElementById("myDebug");},
debugText : function(text) { 
    if (myK.debug())
        myK.debug().appendChild(document.createTextNode(text));
},
currentSyllable : new Array("", "", "", "", "", "", "", "",
                            "", "", "", "", "", "", ""),
stackableCons : new Array('u1000', 'u1001', 'u1002', 'u1003', 
                        'u1005', 'u1006', 'u1007', 'u1008', 
                        'u100b', 'u100c', 'u100d', 'u100f',
                        'u1010', 'u1011', 'u1012', 'u1013', 'u1014',
                        'u1015', 'u1016', 'u1017', 'u1018', 'u1019',
                        'u101c', 'u101e', 'u1021'),
nonStackableCons : new Array('u1004', 'u1009', 'u100a', 'u100e', 
                            'u101a', 'u101b',
                            'u101d', 'u101f', 'u1020', 'u1027','u1061'),
// consonant nodes handled separately                            
positionNodes : new Array(['kinzi'], "", "", ['medYa', 'medRa'], 
                          ['medWa'], ['medHa'],
                          ['u1031'], ['u102d', 'u102e', 'u1032'], 
                          ['u102f', 'u1030'], 
                          ['u102c', 'u102b'], ['u1036'], ['killer'], 
                          ['u1037'], ['u1038'],[]),
/** 
* Initialise path to keyboard files and register keyboard
* @param path to files
* @param array of language prefixes for keyboards e.g. ['my','ksw']
*/
initKeyboard: function(path, lang)
{
    myK.pathStem = path;
    var langArray = lang;
    if (typeof lang == "string")
        langArray = new Array(lang);
    myK.registerKeyboard(langArray);
},

/**
* Looks for the text held in the syllable array at the end of the 
* specified input element
* @param inputElement handle to input Element
* @param cursor {selectionStart, selectionEnd}
* @internal
*/
findOldText: function(inputElement, cursor)
{
  var pos = inputElement.value.length;
  if (cursor != undefined) pos = cursor.selectionEnd;
  var oldText = inputElement.value.substring(0, pos);
  this.suffix = inputElement.value.substring(pos);
  // strip off current syllable
  var oldSyllable = myK.syllableToString();
  var oldIndex = -1;
  oldText = myK.findEndSyllable(oldText, false);

  //alert("oldText " + oldText + "(" + inputElement.value + ")" + oldIndex);
  this.prefix = oldText;
  return this;
},

/**
* types the character clicked upon and appends it to the syllable
* array. Usually disables all other characters representing
* the same position in the syllable to prevent invalid sequences
* unless the character (visually) represents the start of a syllable.
* @param charValue unicode code points representing character
* @param predefined position index within syllable
*/
typeChar: function(charValue, pos)
{
  var characters = charValue;
  var inputElement = myK.inputNode;
  var cursor = myK.getCursorPosition();
  var oldSelectedText = inputElement.value.substring(cursor.selectionStart, 
                                                     cursor.selectionEnd);
  var oldText = myK.findOldText(inputElement, cursor);
  if (oldSelectedText != myK.syllableToString())
  {
    // delete the selection, it must have been selected by the user, not us
    myK.resetSyllable();
    oldText.prefix = inputElement.value.substring(0, cursor.selectionStart);
    inputElement.value = oldText.prefix + oldText.suffix;
    cursor.selectionEnd = cursor.selectionStart;
    oldText = myK.findOldText(inputElement, cursor);
  }
  
  if (pos == 1)
  {
    if (myK.consMode == 0)
    {
      if (myK.currentSyllable[pos] != "" && 
          myK.currentSyllable[pos] != myK.fillerChar)
      {
        oldText.prefix = oldText.prefix + myK.syllableToString();
        myK.resetSyllable();
      }
      //else if (myK.currentSyllable[6] != "")
      {
        myK.enable('u1031');
      }
      myK.currentSyllable[pos] = charValue;
      //window.status = myK.currentSyllable[pos];
    }
    else
    {
      myK.currentSyllable[2] = "\u1039" + charValue;
      myK.toggleStack(myK.lang);
      myK.disable('stack');
      myK.disable('kinzi');
    }
  }
  else if (pos == 0)
  {
    myK.currentSyllable[pos] = charValue;
    myK.disable('stack');
    myK.disable('kinzi');
  }
  else if (pos == 2 && charValue.length == 1) // u1039
  {
    if (oldText.prefix.length > 0 &&
        myK.currentSyllable[1] != '' && myK.syllableToString().length == 1)
    {
        // stack the previous consonant
        var lowerCons = charValue + myK.currentSyllable[1];
        // move back one character and find the previous syllable
        cursor.selectionStart = --cursor.selectionEnd;
        oldText.prefix = myK.findEndSyllable(oldText.prefix, false);
        if (myK.currentSyllable[2] == '')
        {
            myK.currentSyllable[2] = lowerCons;
        }
        else // can't have multiple stacks
        {
            oldText.prefix += myK.syllableToString();
            myK.resetSyllable();
            myK.currentSyllable[1] = lowerCons.charAt(1);
        }
    }
  }
  else
  {
    
    // u1031
    if (pos == 6 && myK.currentSyllable[1] != "")
    {
      oldText.prefix = oldText.prefix + myK.syllableToString();
      myK.resetSyllable();
      myK.currentSyllable[pos] = characters;
    }
    else
    {
	  // special case for contrations
	  if (myK.currentSyllable[11] == "\u103a" && pos > 2 && pos < 9)
	  {
		myK.currentSyllable[2] = myK.currentSyllable[11];
		myK.currentSyllable[11] = "";
	  }
      myK.currentSyllable[pos] = characters;
      var ids = myK.positionNodes[pos];
      for (var j = 0; j < ids.length; j++)
      {
          myK.disable(ids[j]);
      }
    }
  }
  var newSyllable = myK.syllableToString();
  inputElement.value = oldText.prefix + newSyllable + oldText.suffix;
  // Move cursor to end of syllable
  var cursor = oldText.prefix.length + newSyllable.length;
  myK.setCursorPosition(cursor, cursor);
  window.status = inputElement.value + " Syllable = " + newSyllable + 
    " " + myK.currentSyllable.length;
  // update overlay if there is one
  myK.updateOverlay(myK.inputId, cursor, cursor);
  if (myK.afterKey)
    myK.afterKey(myK.inputNode);
},

/**
* Deletes the last character typed by the user at the end of the
* string. This may actually consist of several unicode code
* points e.g. for kinsi.
*/
deleteChar: function()
{
  var inputElement = myK.inputNode;//document.getElementById(inputId);
  var oldText = myK.findOldText(inputElement, myK.getCursorPosition());
  var deleted = false;
  var lastOfSyllable = false;
  for (var i = myK.currentSyllable.length - 1; i>=0; i--)
  {
    if (myK.currentSyllable[i] != "")
    {
      myK.currentSyllable[i] = "";
      var ids = myK.positionNodes[i];
      for (var j = 0; j < ids.length; j++)
      {
        myK.enable(ids[j]);
      }   
      deleted = true;
      if (i == 0 || i == 1 && myK.currentSyllable[0] == "")
      {
        lastOfSyllable = true;
      }
      break;
    }
  }
  if (!deleted || lastOfSyllable)
  {
    // need to update oldText and move to previous syllable
    oldText.prefix = myK.findEndSyllable(oldText.prefix, !deleted);
  }
  var newSyllable = myK.syllableToString();
  inputElement.value = oldText.prefix + newSyllable + oldText.suffix;
  var cursorA = oldText.prefix.length;
  var cursorB = cursorA + newSyllable.length;
  myK.setCursorPosition(cursorA, cursorB);
  // update overlay if there is one
  myK.updateOverlay(myK.inputId, cursorA, cursorB);
  if (myK.afterKey)
    myK.afterKey(myK.inputNode);
},

updateOverlay : function(inputId, cursorA, cursorB)
{
  if (myUnicode != undefined && myUnicode.isSupported == false)
  {
    var inputElement = document.getElementById(inputId);
    var text = inputElement.value.replace(/ /g,'\xA0');
    // see if there is an overlay that should have some text added
    var overlay = document.getElementById(inputId + "_innerDiv");
    var selObj = (window.getSelection)?window.getSelection():document.selection;
    if (selObj)
    {
        if (selObj.removeAllRanges) selObj.removeAllRanges();
		if (selObj.empty) selObj.empty();
    }
    if (overlay && overlay.style.display != "none")
    {
        if (cursorA == undefined) 
        {
            var cursor = myK.getCursorPosition();
            cursorA = cursor.selectionStart; 
            cursorB = cursor.selectionEnd;
        }
        overlay.innerHTML = text.substring(0, cursorA);
        var selection;
        if (cursorA == cursorB)
        {
            var img = document.createElement("img");
            img.setAttribute("src", myK.pathStem + "cursor.gif");
            img.setAttribute("alt","|");
            img.setAttribute("id",myK.inputId + "_cursor");
            overlay.appendChild(img);
            selection = img;
        }
        else
        {
            //var selectionSpan = document.createElement("span");
            var selectionText = document.createTextNode(text.substring(cursorA, cursorB));
            //selectionSpan.appendChild(selectionText);
            //selectionSpan.style.backgroundColor = myK.selectionColor;
            //overlay.appendChild(selectionSpan);
            overlay.appendChild(selectionText);
            //selection = selectionSpan;
            selection = selectionText;
        }
        var afterCursor = document.createTextNode(text.substring(cursorB));
        overlay.appendChild(afterCursor);
        myUnicode.parseNodeIfNeeded(overlay);
        var selObj = (window.getSelection)?window.getSelection():document.selection;
        if (window.getSelection && selObj)
        {
            var r = document.createRange();
            if (selection.nodeType == 1 && selection.tagName.toLowerCase() == "img")
            {
                r.setStart(selection, 0);
                r.setEnd(selection, selection.childNodes.length);
            }
            else
            {
                var i = 0;
                var charIndex = 0;
                for (i = 0; i < overlay.childNodes.length; i++)
                {
                    var nodeChars = myK.countCharacters(overlay.childNodes[i]);
                    if (charIndex + nodeChars > cursorA)
                        break;
                    charIndex+= nodeChars;
                }
                r.setStart(overlay, i);
                for (; i < overlay.childNodes.length; i++)
                {
                    var nodeChars = myK.countCharacters(overlay.childNodes[i]);
                    if (charIndex + nodeChars > cursorB)
                        break;
                    charIndex+= nodeChars;
                }
                r.setEnd(overlay, i);
            }
        }
		else if (document.selection)
		{
			if (selection.nodeType == 1 && selection.tagName.toLowerCase() == "img")
			{
				var r = document.selection.createRange();
				try
				{
					r.addElement(selection);
					r.select();
					myK.debugText("selected range " + cursorA);
				}
				catch (e) {}
			}
		}
    }
  }
},

hideOverlay : function(inputElement)
{
  if (myUnicode != undefined && myUnicode.isSupported == false)
  {
  }
},

/**
* @param oldText to find last syllable of
* @param forDelete boolean flag that says whether the first 
*        component of the last syllable should be deleted
* @return start of oldText which is not in the last syllable
* @internal
*/
findEndSyllable: function(oldText, forDelete)
{
  var deleted = true;
  if (forDelete) deleted = false;
  if (oldText.length > 0)
  {
    var charIndex = oldText.length - 1;
    myK.resetSyllable();
    var prevOrder = myK.numLevels;
    while (charIndex > -1)
    {
      var order = myK.getCharOrder(oldText, charIndex);
      charIndex -= myK.lastTokenLength;
      if ((prevOrder == 1 && order == 0) ||
          (prevOrder > 1))
      {
        // need to delete the first syllable we find
        if (deleted)
        {
		  // special case for contractions
		  if (order == 11 && prevOrder > 2 && prevOrder < 9)
		  {
			order = 2;
		  }
          myK.currentSyllable[order] = oldText.substr(charIndex + 1,
                                                myK.lastTokenLength);
          var ids = myK.positionNodes[order];
          if (order != 6) 
          {
            for (var j = 0; j < ids.length; j++)
            {
                myK.disable(ids[j]);
            }
          }
          if (order == 2 || order == 0) 
          {
            myK.disable('stack');
            if (myK.consMode == 1) toggleStack(''); 
          }
          prevOrder = order;
        }
        else
        {
          deleted = true; 
          prevOrder = order;
        }                                       
      }                
      else
      {
        charIndex += myK.lastTokenLength;
        break;
      }                       
      if (order == 0) break;                          
    }
  }
  //alert("findEndSyllable " + oldText.substring(0, charIndex + 1) + " " + myK.toUnicodes(myK.syllableToString()));
  return oldText.substring(0, charIndex + 1);
},

/**
* This assumes that the parsing is being done backwards
* checks to see if the previos character is akiller, if so
* the order is set to killOrder otherwise 1 is returned.
* @param theText test string from input box
* @param charIndex to test
* @param killOrder order if there is a killer before
* @return index of character
* @internal
*/
setOrderIfPrevious1039: function(theText, charIndex, killOrder)
{
  var order = 1;
  if (charIndex > 0)
  {
    var previous = theText.substring(charIndex - 1, charIndex);
    if (previous == '\u1039')
    {
      order = killOrder;
      myK.lastTokenLength = 2;
    }
    // now check the killer doesn't belong to Kinzi if so the 
    // order is still 1
    if (charIndex > 1)
    {
      previous = theText.substring(charIndex - 2, charIndex - 1);
      if (previous == '\u103A')
      {
        order = 1;
        myK.lastTokenLength = 1;
      }
    }
  }
  return order;
},

/**
* This assumes that the parsing is being done backwards
* @param theText test string from input box
* @param charIndex to test
* @return index of character
* @internal
*/
getCharOrder: function(theText, charIndex)
{
  var order = 1;
  var theChar = theText.substring(charIndex, charIndex + 1);
  myK.lastTokenLength = 1;
  switch (theChar)
  {
    case '\u1004':
        if (theText.length > charIndex + 2 && 
            theText.charAt(charIndex + 1) == "\u103A" &&
            theText.charAt(charIndex + 2) == "\u1039")
        {
            order = 0;
            break;
        }
    case '\u103f':
      order =1;
      break;
    // stackable consonants
    case '\u1000':
    case '\u1001':
    case '\u1002':
    case '\u1003':
    case '\u1005':
    case '\u1006':
    case '\u1007':
    case '\u1008':
    case '\u100b':
    case '\u100c':
    case '\u100d':
    case '\u100f':
    case '\u1010':
    case '\u1011':
    case '\u1012':
    case '\u1013':
    case '\u1014':
    case '\u1015':
    case '\u1016':
    case '\u1017':
    case '\u1018':
    case '\u1019':
    case '\u101c':
    case '\u101e':
    case '\u1021':
    case '\u101a':
    case '\u101b':
    case '\u101d':
    case '\u101f':
      order = myK.setOrderIfPrevious1039(theText, charIndex, 2);
      break;
    case '\u103b':
    case '\u103c':
      order = 3;
      break;
    case '\u103d':
      order = 4;
      break;
    case '\u103e':
      order = 5;
      break;
    case '\u1031':
      order = 6;
      break;
    case '\u102d':
    case '\u102e':
    case '\u1032':
      order = 7; 
      break;
    case '\u102f':
    case '\u1030':
      order = 8;
      break;
    case '\u102b':
    case '\u102c':
      order = 9;
      break;
    case '\u1036':
      order = 10;
      break;
    case '\u103a':
      order = 11;
      break;
    case '\u1037':
      order = 12;
      break;
    case '\u1038':
      order = 13;
      break;
    case '\u1039':
      order = 1;
      if (theText.length == 1)
      {
        order = 2;
      }
      // we expect this to only be seen if the previous character is Kinzi
      if (charIndex > 1)
      {
        var previous = theText.substring(charIndex - 2, charIndex);
        if (previous == '\u1004\u103A')
        {
          order = 0;
          myK.lastTokenLength = 3;
        }
      }
      break;
    default:
      order = 1;
  }
  return order;
},


/**
* Converts the stored syllable aray into a string
* @internal
*/
syllableToString: function()
{
  var text = "";
  for (var i = 0; i < myK.currentSyllable.length; i++)
  {
    if (i == 1 && myK.currentSyllable[i] == "")
    {
      text = text + myK.fillerChar;
    }
    else text = text + myK.currentSyllable[i];
  }
  // check for empty string
  if (text == myK.fillerChar) text = "";
  return text;
},

/**
* hides the element with the given id
* will silently fail if id does not exist
* @param id of element
*/
disable: function(id)
{
  var element = document.getElementById(myK.lang + "_" + id);
  if  (element)
    element.style.display = "none";
  element = document.getElementById(id);
  if  (element)
    element.style.display = "none";
},

/**
*
* shows the element with the given id
* will silently fail if id does not exist
* @param id of element
*/
enable: function(id)
{
  var element = document.getElementById(id);
  if  (element)
    element.style.display = "";
  element = document.getElementById(myK.lang + "_" + id);
  if  (element)
    element.style.display = "";
},

/**
*
* toggle display of the element with the given id
* will silently fail if id does not exist
* @param id of element
*/
toggle: function(id)
{
    var element = document.getElementById(id);
    if  (element) 
    {
        if (element.style.display == "")
            element.style.display = "none";
        else
            element.style.display = "";
    }
},
/**
* creates an empty syllable array
* @internal
*/
resetSyllable: function()
{
  myK.currentSyllable = new Array("", "", "", "", "", "", "", 
                        "", "", "", "", "", "", "", "");
  myK.enable('stack');
  myK.enable('kinzi');
  for (var i = 3; i < myK.numLevels; i++)
  {
    var ids = myK.positionNodes[i];
    for (var j = 0; j < ids.length; j++)
    {
      myK.enable(ids[j]);
    }
  }
},


/**
* toggles display of normal or stacked consonant links
*/
toggleStack: function(prefix)
{
  if (myUnicode != undefined && myUnicode.isSupported == false)
  {
    
    for (var i = 0; i < myK.stackableCons.length; i++)
    {
        var element = document.getElementById(prefix + "_" + myK.stackableCons[i]);
        if (element)
        { 
            var children = element.childNodes;
            for (var j = 0; j < children.length; j++)
            {
                if (children.item(j).nodeType != 1 /*Node.ELEMENT_NODE*/) continue;
                var oldSrc = children.item(j).getAttribute("src");
                if (oldSrc)
                {
                    var newSrc;
                    if (myK.consMode == 0)
                    {
                        var lastSlash = oldSrc.lastIndexOf("/");
                        newSrc = oldSrc.substring(0,lastSlash + 1) + "1039" +
                            oldSrc.substring(lastSlash + 1, oldSrc.length);
                        //newSrc = oldSrc.replace("/10","/103910");
                    }
                    else
                    {
                      newSrc = oldSrc.replace("/1039","/");
                    }
                    children.item(j).setAttribute("src",newSrc);
                }
                else if (children.item(j).nodeName == "svg")
                {
                    var svgChild = children.item(j);
                    // get the original text from the title svg/g/title/text
                    try
                    {
                        var text = svgChild.firstChild.firstChild.firstChild.textContent;
                        if (myK.consMode == 0)
                        {
                            text = "\u1039" + text;
                        }
                        else
                        {
                            if (text[0] == '\u1039') text = text.substring(1);
                        }
                        var fontSize = mySvgFont.nodeFontSize(element);
                        var textColor = mySvgFont.computedStyle(element).color;
                        var frag = document.createDocumentFragment();
                        mySvgFont.appendSvgText(frag, myUnicode.svgFont, fontSize, text, textColor);
                        element.insertBefore(frag, svgChild);
                        element.removeChild(svgChild);
                    }
                    catch (e) { if (mySvgFont.warning) alert(e); mySvgFont.warning = false; }
                }
            }
        }
    }
    if (myK.consMode == 0)
    {
        myK.consMode = 1;
    }
    else
    {
        myK.consMode = 0;
    }
    return;    
  }
  if (myK.consMode == 0)
  {
    myK.consMode = 1;
    for (var i = 0; i < myK.stackableCons.length; i++)
    {
      var element = document.getElementById(prefix + "_" + myK.stackableCons[i]);
      if (element)
    {
      var text = new String(element.firstChild.nodeValue);
      var u25cc = document.createTextNode('\u1039' + text);
      element.replaceChild(u25cc, element.firstChild);
    }
    }
    for (var i = 0; i < myK.nonStackableCons.length; i++)
    {
      var element = document.getElementById(prefix + "_" + myK.nonStackableCons[i]);
    if (element)
          element.style.display = "none";
    }
  }
  else
  {
    myK.consMode = 0;
    for (var i = 0; i < myK.stackableCons.length; i++)
    {
        var element = document.getElementById(prefix + "_" + myK.stackableCons[i]);
        if (element)
        {
          var text = new String(element.firstChild.nodeValue);
          var removed = text.replace("\u1039", "");
          var no25cc = document.createTextNode(removed);
          element.replaceChild(no25cc, element.firstChild);
        }
    }
    for (var i = 0; i < myK.nonStackableCons.length; i++)
    {
      var element = document.getElementById(prefix + "_" + myK.nonStackableCons[i]);
      if (element) element.style.display = "";
    }
  }
  
},
/**
* hides the keyboard
*/
hideKeyboard: function(lang)
{
    myK.toggleAlphabetWindow();
//  myK.hideOverlay(myK.inputNode);
},

/**
* toggles display of the keyboard on or off
*/
toggleLangKeyboard: function(lang, nodeId)
{
    var keyboard = document.getElementById(myK.lang + '_keyboard');
    if (lang != myK.lang)
    {
        var img = document.getElementById(nodeId + "_" + myK.lang);
        if (img) img.setAttribute('src',myK.pathStem + myK.lang + myK.keyboardOffIcon);
        img = document.getElementById(nodeId + "_" + lang);
        if (img) img.setAttribute('src',myK.pathStem + lang + myK.keyboardIcon);
        myK.lang = lang;
        if (keyboard) keyboard.style.display = "none";
    }
    else
    {
        var img = document.getElementById(nodeId + "_" + lang);
        if (img) img.setAttribute('src',myK.pathStem + lang + myK.keyboardOffIcon);
        myK.lang = '';
    }

    keyboard = document.getElementById(lang + '_keyboard');
    if (!keyboard)
    {
        var keyboardIframe = document.getElementById(lang + '_keyboardFrame');
        if (keyboardIframe)
        {
			var keyboardDoc = (keyboardIframe.contentDocument)? keyboardIframe.contentDocument : keyboardIframe.contentWindow.document;
			if (keyboardDoc != undefined)
			{
				myK.appendKeyboard(keyboardDoc.body.innerHTML);
				document.body.removeChild(keyboardIframe);
			}
            keyboard = document.getElementById(lang + '_keyboard');
        }
    }
    myKeyboardMover.keyboardId = lang + '_keyboard';
    if (myK.keyboardVisible && keyboard && keyboard.style.display == "none")
    {
        keyboard.style.display = "";
        myKeyboardMover.inputId = nodeId;
        myKeyboardMover.inputNode = myK.inputNode;
        myKeyboardMover.moveBelowInput();
    }
    else
    {
        if (keyboard) keyboard.style.display = "none";
    }
    myK.switchInput(nodeId);
    if (myK.inputNode && myK.inputNode.style.display != "none")
        myK.inputNode.focus();
},

/** Change the active input box for the keyboard.
* Call this method in the onclick event of each input box
* that you want the keyboard to work with. If you want to
* show the keyboard at the same time, call this after toggleLangKeyboard
*/
switchInput: function(newId)
{
	//if (myK.inputId == newId) return;
  var oldInput = document.getElementById(myK.inputId);
  if (oldInput)
  {
    var oldCursor = document.getElementById(myK.inputId + "_cursor");
    if (oldCursor) oldCursor.style.display = "none";
    
    var icon = document.getElementById(myK.inputId + "_keyboardDialog");
    if (icon)
        icon.setAttribute("src",myK.pathStem + "alphabetWindowOff.png");
    icon = document.getElementById(myK.inputId + "_" + myK.lang);
    if (icon)
        icon.setAttribute("src",myK.pathStem + myK.lang + myK.keyboardOffIcon);
  }
  myK.inputId = newId;
  myK.resetSyllable();
  var newInput = document.getElementById(newId);
  if (newInput)
  { 
    myK.inputNode = newInput;
    var cursor = myK.getCursorPosition();
    myK.findOldText(newInput, cursor);
    //alert(myK.getCursorPosition().selectionStart);
    myKeyboardMover.inputId = newId;
    myKeyboardMover.inputNode = newInput;
    myKeyboardMover.moveBelowInput();
    if (myUnicode != undefined && myUnicode.isSupported == false)
    {
        // see if there is an overlay that should have some text added
        var inputInnerDiv = document.getElementById(newId + "_innerDiv");
        if (inputInnerDiv)
        {
            myK.updateOverlay(myK.inputId, cursor.selectionStart, cursor.selectionEnd);
        }
    }
    var icon = document.getElementById(myK.inputId + "_keyboardDialog");
    if (icon)
        icon.setAttribute("src",myK.pathStem + "alphabetWindow" + 
            ((myK.keyboardVisible)? ".png":"Off.png") );
    icon = document.getElementById(myK.inputId + "_" + myK.lang);
    if (icon)
        icon.setAttribute("src",myK.pathStem + myK.lang + myK.keyboardIcon);
  }
},

/** method to register keyboard listeners on every input and textarea in a page
* Call this in the onload method of a page
* @param array of languages
*/
registerKeyboard: function(langArray)
{
    myK.findPathStem();
    var inputCount = 0;
    var textareaNodes = document.getElementsByTagName('textarea');
    for (var i = 0; i < textareaNodes.length; i++)
    {
        myK.wrapInput(textareaNodes[i], 'textarea', i, langArray);
        inputCount++;
    }
    var inputNodes = document.getElementsByTagName('input');
    for (var j = 0; j < inputNodes.length; j++)
    {
        if (inputNodes[j].getAttribute('type') == 'text')
        {
            myK.wrapInput(inputNodes[j], 'input', j, langArray);
            inputCount++;
        }
    }
    if (inputCount > 0)
    {
        for (var k = 0; k < langArray.length; k++)
        {
            if (!(document.getElementById(langArray[k] + "_keyboard")) &&
                !(document.getElementById(langArray[k] + "_keyboardFrame")))
            {
                //myK.getSourceFile(myK.pathStem + langArray[k] + myK.keyboardSrc);
                var iframe = document.createElement("iframe");
                iframe.style.display = "none";
                iframe.id = langArray[k] + "_keyboardFrame";
                iframe.src = myK.pathStem + langArray[k] + myK.keyboardSrc;
				// Offline, firefox won't load from a higher directory in an iframe, only the same dir (or lower?)
                //iframe.onload = "myK.appendKeyboard(this.contentDocument.body.innerHTML);";
                document.body.appendChild(iframe);
            }
        }
    }
    myK.langAvailable = langArray;
},

toUnicodes: function(text)
{
  var codes = "";
  for (var i = 0; i<text.length; i++)
  {
    var num = "\\u" + text.charCodeAt(i).toString(16);
    codes += num;
  }
  return codes;
},

//    requestA: 0,
//    requestB: 0,
//    requestC: 0,
/**
    * A very versatile method of getting a file and getting around the browsers
    * attempt to open the file associated with the file type.
    * Unfortunately, latest browers don't allow this to work for file: urls
    * even though the owner document is also a file: url
    * Note the actual file is displayed in the call back docReady not this method.
    * @param id of pre to insert source file contents
    * @param name of file to retreive
    *//*
    getSourceFile : function(name, func)
    {
        // TBD: handle multilple requests better - max 3 at present
        var returnFunc = myK.keyboardReadyA;
        var request = xmlRequest.getRequestObject();
        if (myK.requestA)
        {
            if (myK.requestB)
            {
                if (myK.requestC)
                {
                    alert("4 keyboard requests not supported");
                    return;
                }
                else
                {
                    myK.requestC = request;
                    returnFunc = myK.keyboardReadyC;
                }
            }
            else
            {
                myK.requestB = request;
                returnFunc = myK.keyboardReadyB;
            }
        }
        else
        {
            myK.requestA = request;
        }
        
        request.open('get',name, true);
        request.onreadystatechange = returnFunc;
        request.send("");
    },*/
    langIcon: function(type, index, lang)
    {
        return "myK." + type + index + lang + "Icon";
    },

    wrapInput: function(node, type, index, lang)
    {
        var nodeId = node.getAttribute("id");
        var inputFrag = 0;
        var inputOuterDiv = 0;
        var inputInnerDiv = 0;
        if (nodeId == undefined)
        {
            nodeId = "myKey_" + type + index;
            node.setAttribute("id", nodeId);
        }
        else
        {
            inputOuterDiv = document.getElementById(nodeId + "_outerDiv");
            inputInnerDiv = document.getElementById(nodeId + "_innerDiv");
        }
        if (inputOuterDiv == 0 || inputOuterDiv == undefined)
        {
            var parentNode = node.parentNode;
            var inputDim = myKeyboardMover.initItemPos(node);
            // default size if this was zero
            if (inputDim.height < 1) inputDim.height = 20;
            if (inputDim.width < 1) inputDim.width = 100;
            var iconsWidth = 16 * (lang.length + 1) + 2;
            inputDim.width += iconsWidth;
            
            inputFrag = document.createDocumentFragment();
            inputOuterDiv = document.createElement("div");
            inputInnerDiv = document.createElement("div");
            if (!inputFrag || !inputOuterDiv || !inputInnerDiv) return;
            inputOuterDiv.setAttribute("id",nodeId + "_outerDiv");
            inputInnerDiv.setAttribute("id",nodeId + "_innerDiv");
            
            // add lang icons
            var iconSpan = document.createElement("div");
            for (var i = 0; i < lang.length; i++)
            {
                var langIcon = document.createElement('img');
                langIcon.setAttribute('src', myK.pathStem + lang[i] + myK.keyboardOffIcon);
                langIcon.setAttribute('id', nodeId + "_" + lang[i]);
                langIcon.setAttribute('alt', "Enable Keyboard");
                langIcon.setAttribute('title', "Enable Keyboard");
                langIcon.myK_lang = lang[i];
                langIcon.myK_nodeId = nodeId;
                langIcon.onclick = function() {myK.toggleLangKeyboard(this.myK_lang,this.myK_nodeId);}
                //langIcon.style.cssFloat = "right";
                langIcon.style.cursor = "pointer";
                //inputOuterDiv.appendChild(langIcon);
                iconSpan.appendChild(langIcon);
            }
            var keyboardIcon = document.createElement('img');
            keyboardIcon.setAttribute('src', myK.pathStem + "alphabetWindowOff.png");
            keyboardIcon.setAttribute('id', nodeId + "_keyboardDialog");
            keyboardIcon.setAttribute('alt', "Show Keyboard");
            keyboardIcon.setAttribute('title', "Show Keyboard");
            keyboardIcon.onclick = function() {myK.toggleAlphabetWindow(this.myK_nodeId);};
            //keyboardIcon.style.cssFloat = "right";
            keyboardIcon.style.cursor = "pointer";
            iconSpan.appendChild(keyboardIcon);

            iconSpan.style.cssFloat = "right";
			iconSpan.style.styleFloat = "right";
            inputOuterDiv.appendChild(iconSpan);

            inputFrag.appendChild(inputOuterDiv);

            //inputOuterDiv.appendChild(node);
            inputOuterDiv.myK_nodeId = nodeId;
            inputOuterDiv.appendChild(inputInnerDiv);
            inputOuterDiv.setAttribute("class", "myKeyInput");
            inputOuterDiv.style.padding = "5px";
            inputOuterDiv.style.backgroundColor = "#aaf";
            inputOuterDiv.style.borderColor = "blue";
            inputOuterDiv.style.borderWidth = "1px"; 
            inputOuterDiv.style.borderStyle = "solid"; 
            inputOuterDiv.style.width = inputDim.width + "px";
            inputOuterDiv.style.height = inputDim.height + "px";
            inputOuterDiv.style.dispay = "inline-block";
            inputOuterDiv.onclick = function(){myK.switchInput(this.myK_nodeId);};
            inputInnerDiv.style.borderWidth = "1px";
            inputInnerDiv.style.borderColor = "black";
            inputInnerDiv.style.borderStyle = "solid";
            inputInnerDiv.style.backgroundColor = "white";
            inputInnerDiv.style.dispay = "inline-block";
            inputInnerDiv.style.overflow = "auto";
            inputInnerDiv.style.width = (inputDim.width - iconsWidth) + "px";
            inputInnerDiv.style.height = inputDim.height + "px";
            //alert("width " + inputDim.width + " " + inputDim.height);
            
            if (myUnicode && (myUnicode.checkFinished == false || myUnicode.isSupported))
                inputInnerDiv.style.display = "none";
            else
                node.style.display = "none";
            
            parentNode.insertBefore(inputFrag, node);
            parentNode.removeChild(node);
            node.myK_cursor = String(node.value).length;
            inputOuterDiv.insertBefore(node, inputInnerDiv);
            myK.updateOverlay(nodeId);
            myK.addOnKeyPressEvent(document);
           // if (myUnicode.isIe)
                document.onkeydown = function(e) {if (window.event) {
                                return myKeyMapper.controlKey(window.event); 
                            }
                            return true;
                    };
        }
    },
    addOnKeyPressEvent : function(node)
    {
        if (node.onkeypress != undefined && String(node.onkeypress).indexOf('myKeyMapper') == -1)
        {
            var oldOnKeyPress = node.onkeypress;
            node.onkeypress = function(e) { return (myKeyMapper.keyPress(e))? oldOnKeyPress(e) : false; };
            //     alert("onclick/onkeypress handler already exists on " + type + " " + 
            //        index + node.onkeypress);
        }
        else
        {
            node.onkeypress = function(event) { return myKeyMapper.keyPress(event); };
        }
    },
    toggleAlphabetWindow : function(inputId)
    {
        if (myK.lang == '' && myK.langAvailable.length > 0) 
        {
            myK.toggleLangKeyboard(myK.langAvailable[0], inputId);
        }
        var keyboard = document.getElementById(myK.lang + '_keyboard');
        if (keyboard)
        {
            myKeyboardMover.keyboardId = myK.lang + '_keyboard';
            var imgSrc = "";
            if (myK.keyboardVisible)
            {
                myK.keyboardVisible = false;
                keyboard.style.display = "none";
                imgSrc = myK.pathStem + "alphabetWindowOff.png";
            }
            else
            {
                myK.keyboardVisible = true; 
                keyboard.style.display = "";
                imgSrc = myK.pathStem + "alphabetWindow.png";
                myKeyboardMover.inputId = myK.inputId;
                myKeyboardMover.inputNode = myK.inputNode;
                myKeyboardMover.moveBelowInput();
            }
            var alphabetWindow = myK.inputId + "_keyboardDialog";
            var img = document.getElementById(alphabetWindow);
            if (img)
            {
                img.setAttribute("src", imgSrc);
            }
        }
    },
/*
    keyboardReadyA: function(e)
    {
        if (myK.requestA.readyState == 4)
        {
            myK.appendKeyboard(myK.requestA.responseText);
        }
    },
    keyboardReadyB: function(e)
    {
        if (myK.requestB.readyState == 4)
        {
            myK.appendKeyboard(myK.requestB.responseText);
        }
    },
    keyboardReadyC: function(e)
    {
        if (myK.requestC.readyState == 4)
        {
            myK.appendKeyboard(myK.requestC.responseText);
        }
    },
*/
    appendKeyboard: function(docText)
    {
//        alert(document.getElementsByTagName('title')[0].innerHTML);
        var div = document.createElement('div');
        var fixedLinks = docText.replace(/ThanLwinIcon.png/g,myK.pathStem + "ThanLwinIcon.png");
        if (div)
        {
            document.getElementsByTagName('body')[0].appendChild(div);
            div.innerHTML = fixedLinks;
            if (myUnicode != undefined && myUnicode.isSupported == false)
            {
                // switch to images if needed
                myUnicode.parseNodeIfNeeded(div);
            }
        }
    },
    // doesn't seem to be reliable
    findPathStem: function()
    {
        var scripts = document.getElementsByTagName('script');
        var hasXmlRequest = false;
        for (var i = 0; i < scripts.length; i++)
        {
            var src = scripts[i].getAttribute('src');
            if (src)
            {
                var fileIndex = src.indexOf('myKeyboard.js');
                if (fileIndex > -1)
                {
                    myK.pathStem = src.substring(0, fileIndex);
                }
                else if (src.indexOf("xmlRquest.js") > -1)
                {
                    hasXmlRequest = true;
                }
            }
        }
        if (hasXmlRequest == false)
        {// TODO
        }
    },
    countCharacters : function(node)
    {
        var len = 0;
        if (node.nodeType == 3) len = node.length;
        if (node.nodeType == 1)
        {
            if (node.tagName.toLowerCase() == "svg")
            {
                var metaNode = node.getElementsByTagName("metadata");
                if (metaNode.length > 0)
                {
                    metaNode = metaNode[0];
                    for (var i = 0; i < metaNode.childNodes.length; i++)
                        len += metaNode.childNodes[i].length;
                }
            }
            else if (node.tagName.toLowerCase() == "span" &&
                     node.style.filter != undefined)
            {
                len = node.getAttribute("title").length;
            }
            else
            {
                for (var i = 0; i < node.childNodes.length; i++)
                    len += myK.countCharacters(node.childNodes[i]);
            }
        }
        myK.debugText("count " + node + " =" + len + " ");
        return len;
    },
    getCursorPosition : function()
    {
        this.selectionStart = -1;
        this.selectionEnd = -1;
        var selObj = (window.getSelection)? window.getSelection() : document.selection;
        if (myUnicode && myUnicode.isSupported == false)
        {
            var innerDiv = document.getElementById(myK.inputId + "_innerDiv");
            if (selObj && selObj.rangeCount)
            {
                var r = selObj.getRangeAt(0);
                if (myK.debug()) myK.debug().innerHTML = "num ranges:" + selObj.rangeCount
                    + " " + r.startContainer + "," + r.startOffset + "/" + r.endContainer + 
                    "," + r.endOffset + " anc " + r.commonAncestorContainer;
                if (r.commonAncestorContainer == innerDiv ||
                    r.commonAncestorContainer.parentNode == innerDiv ||
                    r.commonAncestorContainer.parentNode.parentNode == innerDiv)
                {
                    this.selectionStart = this.selectionEnd = 0;
                    var startNode = r.startContainer;
                    var endNode = r.endContainer;
                    // find top level start node as a child of innerDiv
                    if (startNode != innerDiv)
                        while (startNode.parentNode != innerDiv) startNode = startNode.parentNode;
                    if (endNode != innerDiv)
                        while (endNode.parentNode != innerDiv) endNode = endNode.parentNode;
                    for (var i = 0; i < innerDiv.childNodes.length; i++)
                    {
                        if (r.startContainer == innerDiv)
                        {
                            if (i < r.startOffset) 
                                this.selectionStart += myK.countCharacters(innerDiv.childNodes[i]);
                            else break;
                        }
                        else
                        {
                            if (innerDiv.childNodes[i] == startNode)
                            {
                                if (startNode.nodeType == 3 && r.startContainer == startNode)
                                    this.selectionStart += r.startOffset;
                                // TODO handle nested levels below this
                                break;
                            }
                            this.selectionStart += myK.countCharacters(innerDiv.childNodes[i]);
                        }
                    }

                    for (var i = 0; i < innerDiv.childNodes.length; i++)
                    {
                        if (r.endContainer == innerDiv)
                        {
                            if (i < r.endOffset) 
                                this.selectionEnd += myK.countCharacters(innerDiv.childNodes[i]);
                            else break;
                        }
                        else
                        {
                            if (innerDiv.childNodes[i] == endNode)
                            {
                                if (endNode.nodeType == 3 && r.endContainer == endNode)
                                    this.selectionEnd += r.endOffset;
                                // TODO handle nested levels below this
                                break;
                            }
                            this.selectionEnd += myK.countCharacters(innerDiv.childNodes[i]);
                        }
                    }
                }
                if (myK.debug()) myK.debug().appendChild(document.createTextNode(this.selectionStart + " " + this.selectionEnd));
            }
			else if (selObj.type == "Text")
			{
				var textRange = document.selection.createRange();
				var selParent = textRange.parentElement();
				if (selParent == innerDiv)
				{
					
				}
			}
			else if (selObj.type == "Control")
			{
				var controlRange = document.selection.createRange();
				for (var i = 0; i < controlRange.length; i++)
				{
					var selItem = controlRange.item(i);
					
				}
			}
            if (this.selectionStart < 0)
            {
                if (myK.inputNode)
                    this.selectionStart = this.selectionEnd = myK.inputNode.myK_cursor;
                myK.debugText("No selection found, using old value" +this.selectionStart);
            }
        }
        else
        {

            if (document.selection && myK.inputNode.selectionStart == undefined)
            {
                if (myK.inputNode.style.display != "none") myK.inputNode.focus();
			    var orig = myK.inputNode.value;
                var range = document.selection.createRange();
			    var oldRange = range.text;
                if (range.parentElement() != myK.inputNode)
                {
					this.selectionStart = this.selectionEnd = 0;
                    return this;
                }
                var prefixRange = myK.inputNode.createTextRange();
			    try
			    {
				    range.text= "\u200C";// Assume this won't occur naturally
				    var pos = myK.inputNode.value.indexOf('\u200C');
				    myK.inputNode.value = orig;//restore original value
				    //prefixRange = prefixRange.setEndPoint("EndToStart", range);
				    //var suffixRange = inputObject.createTextRange();
				    //suffixRange = suffixRange.setEndPoint("StartToEnd", range);
				    this.selectionStart = pos;
				    this.selectionEnd = pos + oldRange.length;
				    // restore selectin
				    myK.setCursorPosition(pos, this.selectionEnd);
			    }
			    catch (e)
			    {
				    this.selectionEnd = this.selectionStart = myK.inputNode.value.length;
			    }
            }
            else
            {
                try
                {
                    this.selectionStart = myK.inputNode.selectionStart;
                    this.selectionEnd = myK.inputNode.selectionEnd;
                }
                catch (e)
                {
                    this.selectionStart = this.selectionEnd = myK.inputNode.myK_cursor;
                }
            }
        }

        if (myK.inputNode) myK.inputNode.myK_cursor = this.selectionEnd;
        myK.debugText("range:" + this.selectionStart + ':' + this.selectionEnd + "," + ((myK.inputNode)?myK.inputNode.myK_cursor:""));
        return this;
    },
    setCursorPosition : function(start, end)
    {
        if (!myK.inputNode) 
        {
            return;
        }
        if (document.selection)
        {
            if (myK.inputNode && myK.inputNode.style.display != "none")
            {
                myK.inputNode.focus();
                var range = myK.inputNode.createTextRange();
                range.move('character', start); 
                if (end > start)
                    range.moveEnd('character', end - start);
                range.select();
            }
        }
        else
        {
            if (myK.inputNode && myK.inputNode.focus) 
            {
                try
                {
                    myK.inputNode.focus();
                    myK.inputNode.setSelectionRange(start, end);
                } catch (e) {}
            }
        }
        // TODO implement using 
        // var range = document.createRange();
        //range.setStart(startNode, startOffset);
        //range.setEnd(endNode, endOffset);
        myK.inputNode.myK_cursor = start;
    },
    /** add overlay to an input box
	    * see also wrapInput 
	    */
    addOverlay : function(node)
    {
		var nodeId = (node.getAttribute("id"))? node.getAttribute("id") : node.id;
		if (myUnicode.checkFinished && myUnicode.isSupported == false)
		{
			var innerDiv = document.getElementById(nodeId + "_innerDiv");
			innerDiv.style.display = "";
			node.style.display = "none";
			myK.updateOverlay(nodeId);
		}
    }
};// end MyKeyboard


function myRectangle(x,y,width,height)
{
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
}

/** 
* Keyboard mover to handle dragging of keyboard window around browser window
* @singleton 
*/
var myKeyboardMover = {
    dialog : new myRectangle(0,0,0,0),
    input : new myRectangle(0,0,0,0),
    moveStartX : 0,
    moveStartY : 0,
    moveEndX : 0,
    moveEndY : 0,
    moveSrc: 0,
    keyboardId: "",
    inputId: "textInput",
    inputNode: 0,
    buffer: 20,// > scroll bar width
    keepInWindow : false,
    initItemPos:function(keyboardDiv)
    {
        var rectangle = new myRectangle(0,0,0,0);
        try
        {
            //var keyboardDiv = document.getElementById(id);
            if (keyboardDiv)
            {
                rectangle.x = keyboardDiv.offsetLeft;
                rectangle.y = keyboardDiv.offsetTop;
                var parentElem = keyboardDiv.offsetParent;
                var hasOffsetParent = true;
                if (!parentElem)
                {
                    parentElem = keyboardDiv.parent;
                    hasOffsetParent = false;
                }
                while (parentElem)
                {                
                    rectangle.x += parentElem.offsetLeft;
                    rectangle.y += parentElem.offsetTop;
                    if (hasOffsetParent)
                        parentElem = parentElem.offsetParent;
                    else
                        parentElem = parentElem.parent;
                }
                rectangle.width = keyboardDiv.offsetWidth;
                rectangle.height = keyboardDiv.offsetHeight;
            }
        }
        catch (exception)
        {
            alert("Exception:" + exception);
        }
        return rectangle;
    },
    
    initKeyboardPos:function()
    {
        
        var keyboard = document.getElementById(myKeyboardMover.keyboardId);
        var newSize = myKeyboardMover.initItemPos(keyboard);
        if (newSize.width > 0 && newSize.height > 0)
        {
            if (myKeyboardMover.dialog.width == 0 ||
                myKeyboardMover.dialog.height == 0)
            {
                myKeyboardMover.dialog = newSize;
            }
            else // updating width and height causes problems, so only update x,y
            {
                myKeyboardMover.dialog.x = newSize.x;
                myKeyboardMover.dialog.y = newSize.y;
				if (myKeyboardMover.dialog.width < newSize.width)
					myKeyboardMover.dialog.width = newSize.width;
				if (myKeyboardMover.dialog.height < newSize.height)
					myKeyboardMover.dialog.height = newSize.height;
            }
        }
    },
    
    initInputPos:function()
    {
        var inputElement = document.getElementById(myKeyboardMover.inputId + "_outerDiv");
        myKeyboardMover.input = myKeyboardMover.initItemPos(inputElement);
    },
    
    startMove:function(event)
    {
        var e;
        try
        {            
            if (window.event) 
            {
                e = window.event;
                // for IE
                myKeyboardMover.moveStartX = e.clientX;
                myKeyboardMover.moveStartY = e.clientY;
                myKeyboardMover.moveSrc = e.srcElement;
            }
            else // firefox
            {
                e = event;
                myKeyboardMover.moveStartX = e.clientX;
                myKeyboardMover.moveStartY = e.clientY;
                myKeyboardMover.moveSrc = e.target;
            }
            myKeyboardMover.initKeyboardPos();
        }
        catch (exception)
        {
            alert(exception);
        }
        document.body.onmousemove = myKeyboardMover.activeMove;
        document.body.onmouseup = myKeyboardMover.endMove;
        document.body.onclick = myKeyboardMover.endMove;
        if (myK.inputNode && myK.inputNode.style.display != "none") myK.inputNode.focus();
        //alert("Moved from " + this.moveStartX + "," + this.moveStartY + " " + this.dialog.x + "," + this.dialog.y);
    },

    endMove:function(e)
    {
        document.body.onmousemove = null;
        document.body.onmouseup = null;
        document.body.onclick = null;
        if (myK.inputNode && myK.inputNode.style.display != "none") myK.inputNode.focus();// restore focus & remove any unwanted selection
        //alert(myKeyboardMover.moveSrc + "Moved by " + myKeyboardMover.dialog.x + "," + myKeyboardMover.dialog.y + " " );
    },
    
    windowSize:function()
    {
        var width;
        var height;
        var winX;
        var winY;
        if (window.innerWidth)
        {
              width = window.innerWidth;
              height = window.innerHeight;
              winX = window.pageXOffset;
              winY = window.pageYOffset;
        }
        else
        {
            if( document.documentElement)
            {            
              if (document.documentElement.clientWidth || 
                  document.documentElement.clientHeight )
              {
                width = document.documentElement.clientWidth;
                height = document.documentElement.clientHeight;
                winX = document.documentElement.scrollLeft;
                winY = document.documentElement.scrollTop;
              }
            }
            else if (document.body)
            {
              width = document.body.clientWidth;
              height = document.body.clientHeight;
              if (document.body.scrollTop || document.body.scrollLeft)
              {
                winX = document.body.scrollLeft;
                winY = document.body.scrollTop;
              }
            }
            
        }
        return new myRectangle(winX, winY, width, height);
    },
    
    moveTo:function(x, y)
    {
        var windowDim = myKeyboardMover.windowSize();
        var deltaX = x - myKeyboardMover.moveStartX;
        var deltaY = y - myKeyboardMover.moveStartY;
        var keyboardDiv = document.getElementById(myKeyboardMover.keyboardId);
        if (!keyboardDiv) return;
        var xPos = myKeyboardMover.dialog.x + deltaX;
        var yPos = myKeyboardMover.dialog.y + deltaY;
        if (yPos < 0) yPos = 0;
        if (xPos + myKeyboardMover.dialog.width > windowDim.x + windowDim.width 
            - myKeyboardMover.buffer)
        {
            xPos = windowDim.x + windowDim.width - myKeyboardMover.dialog.width 
                - myKeyboardMover.buffer;
        }
        if (myKeyboardMover.keepInWindow)
        {
            if (xPos < 0) xPos = 0;
            if (yPos + myKeyboardMover.dialog.height > windowDim.y + windowDim.height &&
                        myKeyboardMover.dialog.height  > 0) 
            {
                yPos = windowDim.y + windowDim.height- myKeyboardMover.dialog.height;
            }
            if (yPos < windowDim.y) yPos = windowDim.y;
        }
        if (xPos == undefined) xPos = 0;
        if (yPos == undefined) yPos = 0;
        keyboardDiv.style.left = xPos + "px";
        keyboardDiv.style.top = yPos + "px";

        if (window.getSelection) window.getSelection().removeAllRanges();
		if (document.selection) document.selection.empty();
    },
    
    activeMove:function(e)
    {
        var evt;
        if (window.event) evt = window.event;
        else evt = e;
        myKeyboardMover.moveTo(evt.clientX, evt.clientY);
    },
    
    moveBelowInput:function()
    {
        myKeyboardMover.initKeyboardPos();
        myKeyboardMover.initInputPos();
        var windowDim = myKeyboardMover.windowSize();
        var keyboardDiv = document.getElementById(myKeyboardMover.keyboardId);
        if (keyboardDiv)
        {
            var xPos = myKeyboardMover.input.x + myKeyboardMover.input.width;
            var yPos = myKeyboardMover.input.y + myKeyboardMover.input.height;
            if (xPos + myKeyboardMover.dialog.width + 
                myKeyboardMover.buffer > windowDim.x + windowDim.width)
            {
                xPos = windowDim.x + windowDim.width
                    - myKeyboardMover.dialog.width - myKeyboardMover.buffer;
                if (myKeyboardMover.input.x - myKeyboardMover.dialog.width > 0)
                {
                  xPos = myKeyboardMover.input.x - myKeyboardMover.dialog.width;
                }
            }
            
            if (myKeyboardMover.keepInWindow)
            {
                if (xPos < 0) xPos = 0;
                
                if (yPos + myKeyboardMover.dialog.height > 
                    windowDim.y + windowDim.height &&
                    myKeyboardMover.dialog.height > 0)
                {
                  yPos = windowDim.y + windowDim.height - myKeyboardMover.dialog.height;
                  if (yPos < myKeyboardMover.input.y)
                  {
                    yPos = myKeyboardMover.input.y - myKeyboardMover.dialog.height;
                    //yPos = windowDim.y;
                  }
                }
            }
            if (yPos < 0) yPos = 0;
            if (xPos == undefined) xPos = 0;
            if (yPos == undefined) yPos = 0;
            keyboardDiv.style.left = xPos + "px";
            keyboardDiv.style.top = yPos + "px";
/*
            alert("Moved to " + xPos+ "," + yPos + " I:" + 
                              myKeyboardMover.input.x + "," + myKeyboardMover.input.y + " D:" +
                              myKeyboardMover.dialog.x + "," + myKeyboardMover.dialog.y + " " +
                  myKeyboardMover.dialog.width + "," + myKeyboardMover.dialog.height + 
                  " W:" + windowDim.x + "," + windowDim.y + " " +
                  windowDim.width + "," + windowDim.height);
*/
        }
    }
};

var myKeyMapper = {
    my_map : {
        _32:" ",_48:"၀",_49:"၁",_50:"၂",_51:"၃",_52:"၄",_53:"၅",_54:"၆",_55:"၇",_56:"၈",_57:"၉",
        _96:"\u1039",
        q:"ဆ",w:"တ",e:"န",r:"မ",t:"အ",y:"ပ",u:"က",i:"င",o:"သ",p:"စ",_91:"ဟ",_93:"‘",_92:"၏",
        a:"ေ",s:"ျ",d:"ိ",f:"်",g:"ါ",h:"့",j:"ြ",k:"ု",l:"ူ",_59:"း",_39:"ဒ",
        z:"ဖ",x:"ထ",c:"ခ",v:"လ",b:"ဘ",n:"ည",m:"ာ",_44:"ယ",_46:".",_47:"။"
    },
    my_mapShift : {
        _32:"\u200B",
                _33:"ဍ",_64:"ဎ",_35:"ဋ",_36:"ကျပ်",_53:"%",_94:"/",_38:"ရ",_42:"ဂ",//_57:"(",_48:")",
        Q:"ဩ",W:"ဝ",E:"ဿ",R:"ဣ",T:"ဤ",Y:"၌",U:"ဉ",I:"၍",O:"ဥ",P:"ဏ",_123:"ဧ",_125:"’",_124:"ဋ္ဌ",
        A:"ဗ",S:"ှ",D:"ီ",F:"င်္",G:"ွ",H:"ံ",J:"ဲ",K:"ု",L:"ူ",_58:"ါ်",_34:"ဓ",
        Z:"ဇ",X:"ဌ",C:"ဃ",V:"ဠ",B:"ဦ",N:"ဈ",M:"ဪ",_60:",",_62:"၎",_63:"၊"
    },
    
    // TODO Sgaw Karen
    ksw_map : {  
        //:"",:"",:"",:"",
    },
    ksw_mapShift : {
    },

    /** Add onclick handlers to the keys in the table layout 
    * Doing this dynamically reduces the risk of them getting out of sync.
    */
    setupLayoutKeys : function(tableElement, shift){
        var tds = tableElement.getElementsByTagName('td');
        if (tds.item(0).onclick != undefined) return;
        for (var i = 0; i < tds.length; i++)
        {
            if (tds.item(i).className == "special") continue;
            tds.item(i).onclick=function(td)
            {
                var tdChild = this.firstChild;
                while (tdChild && (tdChild.nodeType != 1 || tdChild.className != 'en'))
                {
                    tdChild = tdChild.nextSibling;
                }
                if (tdChild)
                {
                    var enText = (shift)? tdChild.innerHTML.toUpperCase() : tdChild.innerHTML;
                    var enCode = enText.charCodeAt(0);
                    var fakeEvent = { keyCode:enCode,ctrlKey:false,altKey:false,shiftKey:shift};
                    myKeyMapper.keyPress(fakeEvent);
                }
            };
            
        }
    },

    controlKey : function(evt)
    {
        if (evt.shiftKey == true || (myK.inputNode == undefined ||
			myK.inputNode.style.display != "none"))
        {
            return true;
        }
        var oldValue = String(myK.inputNode.value);
        var newText = "";
        var cursor = myK.getCursorPosition();
        // TODO handle clusters
        switch (evt.keyCode)
            {
            case 13:// enter
                newText = "\n";
                break;
            case 36:// home
                cursor.selectionEnd = cursor.selectionStart = 0;
                break;
            case 35:// end
                cursor.selectionStart = oldValue.length;
                cursor.selectionEnd = oldValue.length;
                break;
            case 37:// left arrow
                cursor.selectionStart = cursor.selectionStart - 1;
                cursor.selectionEnd = cursor.selectionStart;
                break;
            case 39:// right arrow
                cursor.selectionStart = cursor.selectionStart + 1;
                cursor.selectionEnd = cursor.selectionStart;
                break;
            case 46:// del
                cursor.selectionEnd = cursor.selectionEnd + 1;
                break;
            case 8:// backspace
                cursor.selectionStart = cursor.selectionStart - 1;
                break;
            default:
                return true;
            }
            if (cursor.selectionStart < 0)
                cursor.selectionStart = cursor.selectionEnd = 0;
            if (cursor.selectionStart > oldValue.length)
                cursor.selectionStart = cursor.selectionEnd = oldValue.length;
            myK.inputNode.myK_cursor = cursor.selectionStart;
            myK.inputNode.value = oldValue.substring(0, cursor.selectionStart)
                    + newText + oldValue.substring(cursor.selectionEnd);
            var newPos = cursor.selectionStart + newText.length;
            myK.inputNode.myK_cursor = newPos;
            myK.updateOverlay(myK.inputId, newPos, newPos);
            return false;
    },

    keyPress : function(e)
    {
        var evt = e || window.event;
        var key = evt.keyCode;
        // charCode should be defined for a keypress in Firefox, unless its a special key
        if (evt.charCode != undefined)
        {
            key = evt.charCode;
        }
        // ignore ctrl/alt combinations and control characters
        if (evt.ctrlKey || evt.altKey) 
        {
            setTimeout("myK.updateOverlay(myK.inputId);", 100);
            return true;
        }
        var theChar = String.fromCharCode(key);
        if (myK.lang != '' && key > 20)
        {
            var lookup = myK.lang + "_map" + 
                (evt.shiftKey ? "Shift." + theChar : "." + theChar.toLowerCase());
            if (key < 'A'.charCodeAt(0) || key > 'z'.charCodeAt(0) || 
                (key > 'Z'.charCodeAt(0) && key < 'a'.charCodeAt(0)))
            {
                lookup = myK.lang + "_map" + 
                    (evt.shiftKey ? "Shift._" : "._") + key;
            }
            try
            {
                var keyCodeMap = eval("myKeyMapper." + lookup);
                if (keyCodeMap != undefined)
                {
                    myK.typeChar(keyCodeMap, myK.getCharOrder(keyCodeMap, 0));
                    return false;
                }
            }
            catch (theException) 
            {
                // for debugging
                //alert(lookup);
            }
        }

        if (typeof myK.inputNode != "undefined")
        {
            // don't interpret events if the input is still visible
            if (myK.inputNode.style.display != "none")
            {
                return true;
            }

            var oldValue = String(myK.inputNode.value);
            var newText = "";
            if (key == 0)
            {
                return myKeyMapper.controlKey(evt);
            }
            else
            {
                newText = String.fromCharCode(key);
            }
            var cursor = myK.getCursorPosition();
            myK.inputNode.value = oldValue.substring(0, cursor.selectionStart)
                    + newText + oldValue.substring(cursor.selectionEnd);
            var newPos = cursor.selectionStart + newText.length;
            myK.inputNode.myK_cursor = newPos;
            myK.updateOverlay(myK.inputId, newPos, newPos);
            return false;
        }
        return true;
    }
};

