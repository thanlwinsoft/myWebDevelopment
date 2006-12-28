/*
Copyright 2005,2006 ThanLwinSoft.org

You are free to use this on your website and modify it 
subject to a Creative Commons license. 
However, please add a link to www.thanlwinsoft.org 
on every page that uses this script. For more info
and contact details see www.thanlwinsoft.org.

This copyright statement must not be removed.

Version:       0.1
Author:        Keith Stribley (KRS)
Contributors:  

Change History:
08-07-2005    KRS    Initial Version
24-07-2006    KRS    Modified for new Unicode Proposal
23-07-2006    KRS    Keyboard can now be dragged around browser window


*/
// you may need to override the myK.inputId value to match the id on your 
// input box. You can do this inside script tags after you have
// included this script.
// If you are using more than one input box, then set the onclick event
// of each input box to call myK.switchInput('inputId') where inputId must
// be different for each input box.

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
inputNode : -1,
consMode : 0,
numLevels : 14,
lang : 'my',
keyboardIcon : "Keyboard.png",
keyboardSrc : "Keyboard.xml",
lastTokenLength : 1, // used by myK.getCharOrder()
afterKey : 0,
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
* @param language prefix for keyboard e.g. 'my' or 'ksw'
*/
initKeyboard: function(path, lang)
{
    myK.pathStem = path;
    myK.registerKeyboard(lang);
},

/**
* Looks for the text held in the syllable array at the end of the 
* specified input element
* @param inputElement handle to input Element
* @internal
*/
findOldText: function(inputElement)
{
  var oldText = inputElement.value;
  // strip off current syllable
  var oldSyllable = myK.syllableToString();
  var oldIndex = -1;
  if (oldSyllable.length > 0) oldText.lastIndexOf(oldSyllable);
  if (oldIndex > -1 && (oldIndex + oldSyllable.length == oldText.length))
  {
    oldText = oldText.substring(0, oldIndex);
  }
  else // currentSyllable and input box are out of sync
  {
    oldText = myK.findEndSyllable(oldText, false);
  }
  //alert("oldText " + oldText + "(" + inputElement.value + ")" + oldIndex);
  return oldText;
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
  var inputElement = myK.inputNode; //document.getElementById(inputId);
  var oldText = myK.findOldText(inputElement);
  
  if (pos == 1)
  {
    if (myK.consMode == 0)
    {
      if (myK.currentSyllable[pos] != "" && myK.currentSyllable[pos] != "\u25cc")
      {
        oldText = oldText + myK.syllableToString();
        myK.resetSyllable();
      }
      else if (myK.currentSyllable[6] != "")
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
  else
  {
    
    // u1031
    if (pos == 6 && myK.currentSyllable[1] != "")
    {
      oldText = oldText + myK.syllableToString();
      myK.resetSyllable();
      myK.currentSyllable[pos] = characters;
    }
    else
    {
	  // sepcial case for contrations
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
  inputElement.value = oldText + myK.syllableToString();
  window.status = inputElement.value + " Syllable = " + myK.syllableToString() + 
    " " + myK.currentSyllable.length;
  // update overlay if there is one
  myK.updateOverlay(inputElement);
  if (myK.afterKey)
    myK.afterKey(myK.inputNode);
},

/**
* Deletes the last character typed by the user at the end of the
* string. This may actually consist of several unicode code
* points e.g. for medials.
*/
deleteChar: function()
{
  var inputElement = myK.inputNode;//document.getElementById(inputId);
  var oldText = myK.findOldText(inputElement);
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
    oldText = myK.findEndSyllable(oldText, !deleted);
  }
  inputElement.value = oldText + myK.syllableToString();
  // update overlay if there is one
  myK.updateOverlay(inputElement);
  if (myK.afterKey)
    myK.afterKey(myK.inputNode);
},

updateOverlay : function(inputElement)
{
  if (myUnicode != undefined && myUnicode.isSupported == false)
  {
    // see if there is an overlay that should have some text added
    if (inputElement.previousSibling && inputElement.previousSibling.getAttribute('id') && 
        new String(inputElement.previousSibling.getAttribute('id')).indexOf("myOverlay") > -1)
    {
        inputElement.previousSibling.innerHTML = inputElement.value;
        myUnicode.parseText(inputElement.previousSibling.firstChild, inputElement.value);
    }
  }
},

hideOverlay : function(inputElement)
{
  if (myUnicode != undefined && myUnicode.isSupported == false)
  {
    // see if there is an overlay that should have some text added
    var overlay = inputElement.previousSibling;
    if (overlay && overlay.getAttribute('id') && 
        new String(overlay.getAttribute('id')).indexOf("myOverlay") > -1)
    {
        overlay.style.display = "none";
    }
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
          for (var j = 0; j < ids.length; j++)
          {
            myK.disable(ids[j]);
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
    // now check the kiler doesn't belong to Kinzi if so the 
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
    // kinzi is handled later
    case '\u1004':
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
      order = 3;//myK.setOrderIfPrevious1039(theText, charIndex, 3);
      break;
    case '\u103d':
      order = 4;//myK.setOrderIfPrevious1039(theText, charIndex, 4);
      break;
    case '\u103e':
      order = 5;//myK.setOrderIfPrevious1039(theText, charIndex, 5);
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
//    case '\u200c':
//      order = myK.setOrderIfPrevious1039(theText, charIndex, 11);
//      break;
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
      text = text + '\u25cc';
    }
    else text = text + myK.currentSyllable[i];
  }
  // check for empty string
  if (text == "\u25cc") text = "";
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
* hides the element with the given id
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
                var newSrc;
                if (myK.consMode == 0)
                {
                    var lastSlash = oldSrc.lastIndexOf("/");
                    newSrc = oldSrc.substring(0,lastSlash + 1) + "25cc1039" +
                        oldSrc.substring(lastSlash + 1, oldSrc.length);
                    //newSrc = oldSrc.replace("/10","/25cc103910");
                }
                else
                {
                  newSrc = oldSrc.replace("/25cc1039","/");
                }
                children.item(j).setAttribute("src",newSrc);
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
      var u25cc = document.createTextNode('\u25cc\u1039' + text);
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
          var removed = text.replace("\u25cc\u1039", "");
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
  myK.disable(lang + '_keyboard');
  myK.hideOverlay(myK.inputNode);
},



/**
* toggles display of the keyboard on or off
*/
toggleLangKeyboard: function(lang)
{
  if (lang != myK.lang)
    myK.hideKeyboard(myK.lang);
  var keyboard = document.getElementById(lang + '_keyboard');
  if (keyboard.style.display == "none")
  {
    myK.lang = lang;
    keyboard.style.display = "";
    myKeyboardMover.keyboardId = lang + '_keyboard';
  }
  else
  {
    keyboard.style.display = "none";
    myK.hideOverlay(myK.inputNode);
  }
},

/** Change the active input box for the keyboard.
* Call this method in the onclick event of each input box
* that you want the keyboard to work with. If you want to
* show the keyboard at the same time, call this after toggleLangKeyboard
*/
switchInput: function(newId)
{
  myK.inputId = newId;
  myK.resetSyllable();
  var newInput = document.getElementById(newId);
  if (newInput)
  { 
    myK.inputNode = newInput;
    myK.findOldText(newInput);
    myKeyboardMover.inputId = newId;
    myKeyboardMover.inputNode = newInput;
    myKeyboardMover.moveBelowInput();
    if (myUnicode != undefined && myUnicode.isSupported == false)
    {
        // see if there is an overlay that should have some text added
        if (myK.inputNode.previousSibling && myK.inputNode.previousSibling.style)
        {
            var keyboard = document.getElementById(myK.lang + '_keyboard');
             myK.inputNode.previousSibling.style.display = keyboard.style.display;
            myK.updateOverlay(myK.inputNode);
        }
    }
  }
},

/** Change the active input box for the keyboard.
* Call this method in the onclick event of each input box
* that you want the keyboard to work with
*/
switchInputByIndex: function(tagName, index)
{
  myK.inputId = "";// not used
  myK.resetSyllable();
  var elements = document.getElementsByTagName(tagName);
  if (elements.length)
  {
    var newInput = elements[index];
    if (newInput)
    { 
        myK.inputNode = newInput;
        myK.findOldText(newInput);
        myKeyboardMover.inputId = "";
        myKeyboardMover.inputNode = newInput;
        myKeyboardMover.moveBelowInput();
        if (myUnicode != undefined && myUnicode.isSupported == false)
        {
            // see if there is an overlay that should have some text added
            if (myK.inputNode.previousSibling)
            {
                var keyboard = document.getElementById(myK.lang + '_keyboard');
                myK.inputNode.previousSibling.style.display = keyboard.style.display;
                myK.updateOverlay(myK.inputNode);
            }
        }
    }
  }
},

/** method to register keyboard listeners on every input and textarea in a page
* Call this in the onload method of a page
*/
registerKeyboard: function(lang)
{
    myK.findPathStem();
    var inputCount = 0;
    var textareaNodes = document.getElementsByTagName('textarea');
    myK.lang = lang;
    for (var i = 0; i < textareaNodes.length; i++)
    {
        myK.addOnEventLink(textareaNodes[i], 'textarea', i, lang);
        inputCount++;
    }
    var inputNodes = document.getElementsByTagName('input');
    for (var j = 0; j < inputNodes.length; j++)
    {
        if (inputNodes[j].getAttribute('type') == 'text')
        {
            myK.addOnEventLink(inputNodes[j], 'input', j, lang);
            inputCount++;
        }
    }
    if (inputCount > 0)
    {
        if (!(document.getElementById(lang + "_keyboard")))
        {
            myK.getSourceFile(myK.pathStem + lang + myK.keyboardSrc);
        }
    }
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

    requestA: 0,
    requestB: 0,
    requestC: 0,
/**
    * A very versatile method of getting a file and getting around the browsers attempt to open the file 
    * associated with the file type.
    * Note the actual file is displayed in the call back docReady not this method.
    * @param id of pre to insert source file contents
    * @param name of file to retreive
    */
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
    },

    addOnEventLink: function(node, type, index, lang)
    {
        var link = document.createElement('a');
        node.onclick = function() { myK.switchInputByIndex(type , index);};
        link.setAttribute('href',"javascript:{myK.toggleLangKeyboard('" + lang + 
            "');myK.switchInputByIndex('" + type + "'," + 
            index + ");}");
        var img = document.createElement('img');
        img.setAttribute('src', myK.pathStem + lang + myK.keyboardIcon);
        var name = "Myanmar";
        if (lang == 'ksw')
        {
            name = "Sgaw Karen";
        }
        img.setAttribute('alt', "[" + lang + "] ");
        img.setAttribute('title', "Show visual " + name + " keyboard");
        if (node.nextSibling)
        {
            var sibling = node.nextSibling;
            node.parentNode.insertBefore(link, sibling);
        }
        else
        {
            node.parentNode.appendChild(link);
        }
        link.appendChild(img);
    },

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
            appendKeyboard(myK.requestC.responseText);
        }
    },
    
    appendKeyboard: function(docText)
    {
        var div = document.createElement('div');
        var fixedLinks = docText.replace(/ThanLwinIcon.png/g,myK.pathStem + "ThanLwinIcon.png");
        if (div)
        {
            document.getElementsByTagName('body')[0].appendChild(div);
            div.innerHTML = fixedLinks;
            if (myUnicode != undefined && myUnicode.isSupported == false)
            {
                // switch to images if needed
                myUnicode.parseNode(div);
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
        // this doesn't seem to work, I guess the files aren't loaded fast enough before they are needed
        /*
        if (hasXmlRequest == false)
        {
            var reqElement = document.createElement('script');
            reqElement.setAttribute('src',myK.pathStem + "xmlRequest.js");
            reqElement.setAttribute('type',"text/javascript");
            var head = document.getElementsByTagName('head')[0];
            //head.insertBefore(reqElement, scripts[0]);
            head.appendChild(reqElement);
            var style = document.createElement('link');
            style.setAttribute("type","text/css");
            style.setAttribute("rel","stylesheet");
            style.setAttribute("href","myKeyboard.css");
            head.appendChild(style);
        }*/
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
    keyboardId: "my_keyboard",
    inputId: "textInput",
    inputNode: 0,
    
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
            alert(exception);
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
            }
        }
    },
    
    initInputPos:function()
    {
        if (myK.inputNode == -1)
        {
            myKeyboardMover.inputNode = document.getElementById(myKeyboardMover.inputId);
        }
        myKeyboardMover.input = myKeyboardMover.initItemPos(myKeyboardMover.inputNode);
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
        //alert("Moved from " + this.moveStartX + "," + this.moveStartY + " " + this.dialog.x + "," + this.dialog.y);
    },

    endMove:function(e)
    {
        document.body.onmousemove = null;
        document.body.onmouseup = null;
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
        
        var xPos = myKeyboardMover.dialog.x + deltaX;
        var yPos = myKeyboardMover.dialog.y + deltaY;
        if (xPos + myKeyboardMover.dialog.width > windowDim.x + windowDim.width)
        {
            xPos = windowDim.x + windowDim.width - myKeyboardMover.dialog.width;
        }
        if (xPos < 0) xPos = 0;
        if (yPos + myKeyboardMover.dialog.height > windowDim.y + windowDim.height &&
                    myKeyboardMover.dialog.height  > 0) 
        {
            yPos = windowDim.y + windowDim.height- myKeyboardMover.dialog.height;
        }
        if (yPos < windowDim.y) yPos = windowDim.y;
        if (yPos < 0) yPos = 0;
        if (xPos == undefined) xPos = 0;
        if (yPos == undefined) yPos = 0;
        keyboardDiv.style.left = xPos + "px";
        keyboardDiv.style.top = yPos + "px";
/*        window.status = " [" + myKeyboardMover.dialog.x + "," + myKeyboardMover.dialog.y + " " + 
            myKeyboardMover.dialog.width + "," + myKeyboardMover.dialog.height + "] " + 
            xPos + "," + yPos + " w" + windowDim.width + "h" + windowDim.height;*/
    },
    
    activeMove:function(e)
    {
        var event;
        if (window.event) event = window.event;
        else event = e;
        myKeyboardMover.moveTo(event.clientX, event.clientY);
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
            if (xPos + myKeyboardMover.dialog.width > windowDim.x + windowDim.width)
            {
                xPos = windowDim.x + windowDim.width - myKeyboardMover.dialog.width;
                if (myKeyboardMover.input.x - myKeyboardMover.dialog.width > 0)
                {
                  xPos = myKeyboardMover.input.x - myKeyboardMover.dialog.width;
                }
            }
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
