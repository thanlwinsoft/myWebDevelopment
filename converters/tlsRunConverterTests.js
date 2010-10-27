// Copyright: Keith Stribley 2010 http://www.ThanLwinSoft.org/
// License: GNU Lesser General Public License, version 2.1 or later.
// http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

// These tests are designed to be run using rhino from the command line
// rhino tlsRunConverterTests.js
load("../common/tlsDebug.js");
load("tlsMyanmarConverter.js");

if (typeof JSON == "undefined")
{
    var JSON = new Object();
    // this is a crude implementation, which does no validity checking, but ok for testing
    JSON.parse = function(data) { eval("var jsonData = " + data + ";"); return jsonData; }
}
new TlsMyanmarConverter(JSON.parse(readFile("zawgyi.json", "UTF-8")));
new TlsMyanmarConverter(JSON.parse(readFile("wininnwa.json", "UTF-8")));
new TlsMyanmarConverter(JSON.parse(readFile("wwin_burmese.json", "UTF-8")));

var wordList = readFile("my_HeadwordSyllables.txt", "UTF-8").split(new RegExp("\\n", "g"));

function runTest(conv)
{
    print(conv);
    if (!tlsMyanmarConverters[conv])
        print("Converter not found " + conv);
    else
    {
        var os = new java.io.FileOutputStream(conv + "_wordlist.txt");
        var osw = new java.io.OutputStreamWriter(os, "UTF-8");
        for (var i = 0; i < wordList.length; i++)
        {
            var word = wordList[i];
            var converted = tlsMyanmarConverters[conv].convertFromUnicode(word);
            var back = tlsMyanmarConverters[conv].convertToUnicode(converted);
            osw.write(converted);
            osw.write("\n");
            if (back != word)
                print(i + " " + word + " > " + converted + " > " + back + "\n");
        }
        osw.close();
    }
}
runTest("zawgyi-one");
runTest("wininnwa");
runTest("wwin_burmese1");

