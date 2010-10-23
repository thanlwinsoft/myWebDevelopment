
var tlsMyanmarConverters = new Object();

function TlsMyanmarConverter(sourceEncoding, data)
{
    this.debug = new TlsDebug();
    this.sourceEncoding = sourceEncoding;
    this.targetEncoding = 'unicode';
    this.data = data;
    // null is used as a place holder for the ((lig)|((cons)|(numbers)(stack)?)) groups
    this.unicodeSequence = new Array("kinzi",null,"lig",null,"cons","stack","asat","yapin","yayit",
        "wasway","hatoh","eVowel","uVowel","lVowel","anusvara","aVowel","lDot","asat","lDot","visarga");
    this.legacySequence = new Array("eVowel","yayit",null,"lig",null,"cons","stack","kinzi",
        "uVowel","anusvara","asat","stack","yapin","wasway","hatoh","wasway","yapin","kinzi",
        "uVowel","lVowel","anusvara","uVowel","lVowel","aVowel","lDot","asat","lDot","visarga","lDot");
    this.unicodePattern = this.buildRegExp(this.unicodeSequence, true);
    this.legacyPattern = this.buildRegExp(this.legacySequence, false);
    tlsMyanmarConverters[sourceEncoding] = this;
    return this;
}

TlsMyanmarConverter.prototype.buildRegExp = function(sequence, isUnicode)
{
    var pattern = "";
    if (!this.reverse) this.reverse = new Object();
    for (var i = 0; i < sequence.length; i++)
    {
        var alternates = new Array();
        if (sequence[i] == null) continue;
        if (this.reverse[sequence[i]] == null)
            this.reverse[sequence[i]] = new Object();
        for (var j in this.data[sequence[i]])
        {
            if (this.data[sequence[i]][j] && this.data[sequence[i]][j].length > 0)
            {                
                if (isUnicode)
                {   
                    // items with an underscore suffix are not put into the regexp
                    // but they are used to build the legacy to unicode map
                    var underscore = j.indexOf('_');
                    if (underscore == -1)
                    {
                        this.reverse[sequence[i]][this.data[sequence[i]][j]] = j;
                        alternates.push(j);
                    }
                    else
                    {
                        this.reverse[sequence[i]][this.data[sequence[i]][j]] = j.substring(0, underscore);
                    }
                }
                else
                {
                    alternates.push(this.data[sequence[i]][j]);
                }
            }
        }
        alternates = alternates.sort(this.sortLongestFirst);
        if (sequence[i] == "cons") pattern += "(";
        else if (sequence[i] == "lig") pattern += "(";
        pattern += "(";
        for (var k = 0; k < alternates.length; k++)
        {
            if (k == 0) pattern += alternates[k];
            else pattern += "|" + alternates[k];
        }
        pattern += ")";
        if (sequence[i] == "cons") {}
        else if (sequence[i] == "lig") { pattern += "|" }
        else if (sequence[i] == "stack" && sequence[i-1] == "cons") { pattern += "?))"; }
        else { pattern += "?"; }
    }
    if (isUnicode) this.debug.print("unicode pattern: " + pattern);
    else this.debug.print("legacy pattern: " + pattern);    
    return new RegExp(pattern, "g");
}

TlsMyanmarConverter.prototype.sortLongestFirst = function(a,b)
{
    if (a.length > b.length) return -1;
    else if (a.length < b.length) return 1;
    else if (a < b) return -1;
    else if (a > b) return 1;
    return 0;
}

TlsMyanmarConverter.prototype.convertToUnicode = function(inputText)
{
    var outputText = "";
    var pos = 0;
    this.legacyPattern.lastIndex = 0;
    var match = this.legacyPattern.exec(inputText);
    while (match)
    {
        outputText += inputText.substring(pos, match.index);
        pos = this.legacyPattern.lastIndex;
        this.debug.print("To Unicode Match: " + match);
        outputText += this.toUnicodeMapper(inputText, match);
        match = this.legacyPattern.exec(inputText);
    }
    if (pos < inputText.length) outputText += inputText.substring(pos, inputText.length);
    return outputText;
}

TlsMyanmarConverter.prototype.toUnicodeMapper = function(inputText, matchData)
{
    var syllable = new Object();
    for (var g = 1; g < matchData.length; g++)
    {
        var component = this.legacySequence[g-1];
        if (component == null || matchData[g] == null) continue;
        // TODO handle repeated components
        if (syllable[component])
            this.debug.print("Unicode Syllable:" + matchData[0] + " multiple values " + syllable[component] + " / " + this.reverse[component][matchData[g]]);
        syllable[component] = this.reverse[component][matchData[g]];
        if (! syllable[component])
            this.debug.print("Undefined " + component + " " + matchData[g]);
        // check a few sequences putting ligature components in right place
        if (syllable[component].length > 1)
        {
            if (component == "yapin")
            {
                if (syllable[component].charAt(1) == "ွ")
                {
                    syllable["wasway"] = "ွ";
                }
                if (syllable[component].charAt(1) == "ှ" || syllable[component].length > 2)
                {
                    syllable["hatoh"] = "ှ";
                }
                syllable[component] = syllable[component].substring(0, 1);
            }
            else if (component == "yayit")
            {
                if (syllable[component].charAt(1) == "ွ")
                    syllable["wasway"] = "ွ";
                else if (syllable[component].charAt(1) == "ု")
                    syllable["lVowel"] = "ု";
                syllable[component] = syllable[component].substring(0, 1);
            }
            else if (component == "hatoh")
            {
                syllable["lVowel"] = syllable[component].substring(1,2);
                syllable[component] = syllable[component].substring(0, 1);
            }
            else if (component == "uVowel")
            {
                syllable["anusvara"] = syllable[component].substring(1,2);
                syllable[component] = syllable[component].substring(0, 1);
            }
            else if (component == "aVowel")
            {
                syllable["asat"] = syllable[component].substring(1,2);
                syllable[component] = syllable[component].substring(0, 1);
            }
            else if (component == "kinzi")
            {   // kinzi is length 3 to start with
                if (syllable[component].charAt(3) == "ံ" || syllable[component].length > 4 &&
                   syllable[component].charAt(4) == "ံ")
                   syllable["anusvara"] = "ံ";
                if (syllable[component].charAt(3) == "ိ" || syllable[component].charAt(3) == "ီ")
                    syllable["uVowel"] = syllable[component].charAt(3);
                syllable[component] = syllable[component].substring(0, 3);
            }
            else if (component == "cons" || component == "stack" || component == "lig")
            {
                // should be safe to ignore, since the relative order is correct
            }
            else
            {
                this.debug.print("unhandled ligature: " + component + " " + syllable[component]);
            }
        }
    }
    // now some post processing
    if (syllable["asat"])
    {
        if (!syllable["eVowel"] && (syllable["yayit"] || syllable["yapin"] || syllable["wasway"] ||
           syllable["lVowel"]))
        {
            syllable["contraction"] = syllable["asat"];
            delete syllable["asat"];
        }
        if (syllable["cons"] == "ဥ")
        {
            syllable["cons"] = "ဉ";
        }
    }
    if (syllable["cons"] == "ဥ" && syllable["uVowel"] == "ီ")
    {
        syllable["cons"] = "ဦ";
        delete syllable["uVowel"];
    }
    else if (syllable["cons"] == "စ" && syllable["yapin"])
    {
        syllable["cons"] = "ဈ";
        delete syllable["yapin"];
    }
    else if (syllable["cons"] == "သ" && syllable["yayit"])
    {
        if (syllable["eVowel"] && syllable["aVowel"] && syllable["asat"])
        {
            syllable["cons"] = "ဪ";
            delete syllable["yayit"];
            delete syllable["eVowel"]; delete syllable["aVowel"]; delete syllable["asat"]
        }
        else
        {
            syllable["cons"] = "ဩ";
            delete syllable["yayit"];
        }
    }
    else if (syllable["number"] == "၀")
    {
        // convert zero to wa except in numbers
        if (matchData[0].length > 0 && (matchData.index == 0 ||
            inputData.charAt(matchData.index-1) < 0x1040 ||
            inputData.charAt(matchData.index-1) > 0x1049))
        {
            delete syllable["number"];
            syllable["cons"] == "ဝ";
        }
    }
    else if (syllable["number"] == "၄" && inputData.length >= matchData.index + matchData[0].length + 3)
    {
        // check for lagaun
        if (inputData.substr(matchData.index + matchData[0].length, 3) ==
          this.data["cons"]["င"] + this.data["asat"]["်"] + this.data["visarga"]["း"])
        {
            delete syllable["number"];
            syllable["cons"] == "၎";
        }
    }
    var outputOrder = new Array("kinzi","lig","cons","numbers","stack","contraction","yapin","yayit",
        "wasway","hatoh","eVowel","uVowel","lVowel","anusvara","aVowel","lDot","asat","visarga");
    var outputText = "";
    for (var i = 0; i < outputOrder.length; i++)
    {
        if (syllable[outputOrder[i]])
            outputText += syllable[outputOrder[i]];
    }
    return outputText;
}

TlsMyanmarConverter.prototype.convertFromUnicode = function(inputText)
{
    var outputText = "";
    var pos = 0;
    this.unicodePattern.lastIndex = 0;
    var match = this.unicodePattern.exec(inputText);
    while (match)
    {
        outputText += inputText.substring(pos, match.index);
        pos = this.unicodePattern.lastIndex;
        this.debug.print("From Unicode Match: " + match);
        outputText += this.fromUnicodeMapper(inputText, match);
        match = this.unicodePattern.exec(inputText);
    }
    if (pos < inputText.length) outputText += inputText.substring(pos, inputText.length);
    return outputText;
}

TlsMyanmarConverter.prototype.fromUnicodeMapper = function(inputText, matchData)
{
    var unicodeSyllable = new Object();
    var syllable = new Object();
    for (var g = 1; g < matchData.length; g++)
    {
        var component = this.unicodeSequence[g-1];
        if (component == null || matchData[g] == null) continue;
        // TODO handle repeated components
        if (syllable[component])
            this.debug.print("Legacy Syllable:" + matchData[0] + " " + component + 
                " multiple values " + 
                syllable[component] + " / " + this.data[component][matchData[g]]);
        unicodeSyllable[component] = matchData[g];
        syllable[component] = this.data[component][matchData[g]];
    }
    if (unicodeSyllable["kinzi"])
    {
        if (unicodeSyllable["uVowel"])
        {
            if (unicodeSyllable["anusvara"])
            {
                var key = unicodeSyllable["kinzi"] + unicodeSyllable["uVowel"] + unicodeSyllable["anusvara"]  + "_lig";
                if (this.data["kinzi"][key] && this.data["kinzi"][key].length)
                {
                    syllable["kinzi"] = this.data["kinzi"][key];
                    delete syllable["anusvara"];
                }
            }
            else
            {
                var key = unicodeSyllable["kinzi"] + unicodeSyllable["uVowel"]  + "_lig";
                if (this.data["kinzi"][key] && this.data["kinzi"][key].length)
                {
                    syllable["kinzi"] = this.data["kinzi"][key];
                    delete syllable["uVowel"];
                }
            }
        }
        if (unicodeSyllable["anusvara"])
        {
            var key = unicodeSyllable["kinzi"] + unicodeSyllable["anusvara"]  + "_lig";
            if (this.data["kinzi"][key] && this.data["kinzi"][key].length)
            {
                syllable["kinzi"] = this.data["kinzi"][key];
                delete syllable["anusvara"];
            }
        }
    }
    // check for code points which may not have a direct mapping
    if (unicodeSyllable["cons"] == "ဉ")
    {
        if (unicodeSyllable["asat"])
        {
            syllable["cons"] = this.data["cons"]["ဥ"];
        }
        else if (unicodeSyllable["hatoh"])
        {
            syllable["hatoh"] = this.data["hatoh"]["ှ_small"];
        }
        else if (unicodeSyllable["stack"])
        {
            syllable["cons"] = this.data["cons"]["ဉ_alt"];
        }
    }
    else if (unicodeSyllable["cons"] == "ဠ")
    {
        if (unicodeSyllable["hatoh"])
        {
            syllable["hatoh"] = this.data["hatoh"]["ှ_small"];
        }
    }
    else if (unicodeSyllable["cons"] == "ဈ" && this.data["cons"]["ဈ"].length == 0)
    {
        syllable["cons"] = this.data["cons"]["စ"];
        syllable["yapin"] = this.data["yapin"]["ျ"];
    }
    else if (unicodeSyllable["cons"] == "ဩ" && this.data["cons"]["ဩ"].length == 0)
    {
        syllable["cons"] = this.data["cons"]["သ"];
        syllable["yayit"] = this.data["yayit"]["ြ_wide"];
    }
    else if (unicodeSyllable["cons"] == "ဪ" && this.data["cons"]["ဪ"].length == 0)
    {
        syllable["cons"] = this.data["သ"];
        syllable["yayit"] = this.data["ြ_wide"];
        syllable["eVowel"] = this.data["ေ"];
        syllable["aVowel"] = this.data["ာ"];
        syllable["asat"] = this.data["်"];
    }
    else if (unicodeSyllable["cons"] == "၎င်း" && this.data["cons"]["၎င်း"].length == 0)
    {
        if (this.data["၎"].length)
            syllable["cons"] = this.data["cons"]["၎"] + this.data["cons"]["င"] +
                this.data["asat"]["်"] + this.data["visarga"]["း"];
        else
            syllable["cons"] = this.data["number"]["၄"] + this.data["cons"]["င"] +
                this.data["asat"]["်"] + this.data["visarga"]["း"];
    }
    else if (unicodeSyllable["cons"] == "န" || unicodeSyllable["cons"] == "ည")
    {
        if (unicodeSyllable["stack"] || unicodeSyllable["yapin"] || unicodeSyllable["wasway"] ||
            unicodeSyllable["hatoh"] || unicodeSyllable["lVowel"])
        {
            syllable["cons"] = this.data["cons"][unicodeSyllable["cons"] + "_alt"];
        }
        
    }
    else if (unicodeSyllable["cons"] == "ရ")
    {
        if (unicodeSyllable["yapin"] || unicodeSyllable["wasway"] || unicodeSyllable["lVowel"])
        {
            syllable["cons"] = this.data["cons"][unicodeSyllable["cons"] + "_alt"];
        }
        else if (unicodeSyllable["hatoh"] && this.data["cons"][unicodeSyllable["cons"] + "_tall"].length)
        {
            syllable["cons"] = this.data["cons"][unicodeSyllable["cons"] + "_tall"];
        }
    }
    // stack with narrow upper cons
    if ((unicodeSyllable["cons"] == "ခ" || unicodeSyllable["cons"] == "ဂ" ||
        unicodeSyllable["cons"] == "င" ||  unicodeSyllable["cons"] == "စ" ||
        unicodeSyllable["cons"] == "ဎ" || unicodeSyllable["cons"] == "ဒ" ||
        unicodeSyllable["cons"] == "ဓ" || unicodeSyllable["cons"] == "န" ||
        unicodeSyllable["cons"] == "ပ" || unicodeSyllable["cons"] == "ဖ" ||
        unicodeSyllable["cons"] == "ဗ" || unicodeSyllable["cons"] == "မ" ||
        unicodeSyllable["cons"] == "ဝ") &&
        unicodeSyllable["stack"] && this.data["stack"][unicodeSyllable["stack"]+"_narrow"] &&
        this.data["stack"][unicodeSyllable["stack"]+"_narrow"].length > 0)
    {
        syllable["stack"] = this.data["stack"][unicodeSyllable["stack"]+"_narrow"];
    }
    // yapin variants
    if (unicodeSyllable["yapin"] && (unicodeSyllable["wasway"] || unicodeSyllable["hatoh"]))
    {
        if (this.data["yapin"]["ျ_alt"].length)
        {
            syllable["yapin"] = this.data["yapin"]["ျ_alt"];
        }
        else // assume we have the ligatures
        {
            var key = "ျ" + (unicodeSyllable["wasway"])? "ွ":"" +
                (unicodeSyllable["hatoh"])? "ှ":"" + "_lig";
            if (this.data["yapin"][key])
            {
                syllable["yapin"] = this.data["yapin"][key];
                if (unicodeSyllable["wasway"]) delete syllable["wasway"];
                if (unicodeSyllable["hatoh"]) delete syllable["hatoh"];
            }
        }
    }
    if (unicodeSyllable["yayit"])
    {
        var variant = "_wide";
        if (unicodeSyllable["cons"] == "ခ" || unicodeSyllable["cons"] == "ဂ" ||
        unicodeSyllable["cons"] == "င" ||  unicodeSyllable["cons"] == "စ" ||
        unicodeSyllable["cons"] == "ဎ" || unicodeSyllable["cons"] == "ဒ" ||
        unicodeSyllable["cons"] == "ဓ" || unicodeSyllable["cons"] == "န" ||
        unicodeSyllable["cons"] == "ပ" || unicodeSyllable["cons"] == "ဖ" ||
        unicodeSyllable["cons"] == "ဗ" || unicodeSyllable["cons"] == "မ" ||
        unicodeSyllable["cons"] == "ဝ")
            variant = "_narrow";
        if (unicodeSyllable["uVowel"] || unicodeSyllable["kinzi"] || unicodeSyllable["anusvara"])
            variant = "_upper" + variant;
        if (unicodeSyllable["wasway"])
        {
            if (this.data["yayit"]["ြ_lower_wide"].length)
            {
                variant = "_lower" + variant;
                syllable["yayit"] = this.data["yayit"]["ြ" + variant];
            }
            else if (unicodeSyllable["hatoh"])
            {
                if (variant == "_narrow") variant = "";
                syllable["yayit"] = this.data["yayit"]["ြ" + variant];
                syllable["wasway"] = this.data["wasway"]["ွှ_small"];
                delete syllable["hatoh"];
            }
            else
            {
                syllable["yayit"] = this.data["yayit"]["ြွ" + variant];
                delete syllable["wasway"];
            }
        }
        else if (unicodeSyllable["hatoh"])
        {
            if (variant == "_narrow") variant = "";
            syllable["yayit"] = this.data["yayit"]["ြ" + variant];
            syllable["hatoh"] = this.data["hatoh"]["ှ_small"];
        }
        else if (unicodeSyllable["lVowel"] && this.data["yayit"]["ြု_wide"])
        {
            syllable["yayit"] = this.data["yayit"]["ြု" + variant];
            delete syllable["lVowel"];
        }
        else
        {
            if (variant == "_narrow") variant = "";
            syllable["yayit"] = this.data["yayit"]["ြ" + variant];
        }
    }
    if (syllable["wasway"] && syllable["hatoh"])
    {
        delete syllable["hatoh"];
        syllable["wasway"] = this.data["wasway"]["ွှ_lig"];
    }
    if (syllable["hatoh"] && syllable["lVowel"] && !syllable["yapin"] && !syllable["yayit"])
    {
        syllable["hatoh"] = this.data["hatoh"]["ှ" + unicodeSyllable["lVowel"] + "_lig"];
        delete syllable["lVowel"];
    }
    if (syllable["uVowel"] && unicodeSyllable["uVowel"] == "ိ" &&
     syllable["anusvara"] && unicodeSyllable["anusvara"] == "ံ")
    {
        syllable["uVowel"] = this.data["uVowel"]["ိံ_lig"];
        delete syllable["anusvara"];
    }
    if (syllable["lVowel"] && (unicodeSyllable["yayit"] || unicodeSyllable["yapin"] ||
     unicodeSyllable["wasway"] || unicodeSyllable["hatoh"] || unicodeSyllable["lig"] ||
     unicodeSyllable["stack"] || unicodeSyllable["cons"] == "ဍ" || unicodeSyllable["cons"] == "ဋ" ||
     unicodeSyllable["cons"] == "ဌ" || unicodeSyllable["cons"] == "ဈ" ||
     unicodeSyllable["cons"] == "ဥ" || unicodeSyllable["cons"] == "ဠ"))
    {
        syllable["lVowel"] = this.data["lVowel"][unicodeSyllable["lVowel"] + "_tall"];
    }
    if (unicodeSyllable["aVowel"] && unicodeSyllable["asat"] && unicodeSyllable["aVowel"] == "ါ")
    {
        syllable["aVowel"] = this.data["aVowel"]["ါ်_lig"];
        delete syllable["asat"];
    }
    if (unicodeSyllable["lDot"] && (unicodeSyllable["aVowel"] ||
        !(unicodeSyllable["yayit"] || unicodeSyllable["lig"] ||
        unicodeSyllable["stack"] || unicodeSyllable["yapin"] || unicodeSyllable["wasway"] ||
        unicodeSyllable["hatoh"] || unicodeSyllable["lVowel"] || unicodeSyllable["cons"] == "ဍ" ||
        unicodeSyllable["cons"] == "ဋ" || unicodeSyllable["cons"] == "ဌ" ||
        unicodeSyllable["cons"] == "ဈ" ||  unicodeSyllable["cons"] == "ရ")))
    {
        if (unicodeSyllable["cons"] == "န")
            syllable["lDot"] = this.data["lDot"]["့_alt"];        
        else
            syllable["lDot"] = this.data["lDot"]["့_left"];
    }
    if (unicodeSyllable["lDot"] && !syllable["yayit"] && !(unicodeSyllable["cons"] == "ရ") &&
        ((syllable["hatoh"] && syllable["hatoh"].length == 1 && !syllable["lVowel"]) || 
         (syllable["lVowel"] && syllable["lVowel"] == this.data["lVowel"]["ု"])))
    {
        syllable["lDot"] = this.data["lDot"]["့_alt"];
    }
    if (syllable["asat"])
    {
        if (!syllable["eVowel"] && (syllable["yayit"] || syllable["yapin"] || syllable["wasway"] ||
           syllable["lVowel"]))
        {
            syllable["contraction"] = syllable["asat"];
            delete syllable["asat"];
        }
    }
    var outputOrder = new Array("eVowel","yayit","lig","cons","stack","contraction","yapin","kinzi",
        "wasway","hatoh","uVowel","lVowel","anusvara","aVowel","asat","lDot","visarga");
    var outputText = "";
    for (var i = 0; i < outputOrder.length; i++)
    {
        if (syllable[outputOrder[i]])
            outputText += syllable[outputOrder[i]];
    }
    return outputText;
}

function tlsConvert(sourceId, sourceEncoding, targetId, targetEncoding)
{
    var debug = new TlsDebug();
    var sourceElement = document.getElementById(sourceId);
    var targetElement = document.getElementById(targetId);
    sourceEncoding = sourceEncoding.toLowerCase();
    targetEncoding = targetEncoding.toLowerCase();
    try
    {
        if (sourceEncoding == "unicode")
        {
            var converter = tlsMyanmarConverters[targetEncoding];
            targetElement.value = converter.convertFromUnicode(sourceElement.value);
        }
        else
        {
            var converter = tlsMyanmarConverters[sourceEncoding];
            if (targetEncoding == "unicode")
            {
                targetElement.value = converter.convertToUnicode(sourceElement.value);
            }
            else
            {
                var converter2 = tlsMyanmarConverters[targetEncoding];
                var unicodeText = converter.convertToUnicode(sourceElement.value);
                targetElement.value = converter2.convertFromUnicode(unicodeText);
            }
        }
    }
    catch (e)
    {
        for (p in e)
        {
            debug.print(p + ":" + e[p]);
        }
    }
}

