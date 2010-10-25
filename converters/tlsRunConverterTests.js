// This is designed to be run using rhino from the command line
load("../common/tlsDebug.js");
load("tlsMyanmarConverter.js");
load("conv.js"); // use genConvScript.sh to generate
new TlsMyanmarConverter('zawgyi-one', zawgyiData);
new TlsMyanmarConverter('wininnwa', wininnwaData);
new TlsMyanmarConverter('wwin_burmese1', wwin_burmeseData);

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

