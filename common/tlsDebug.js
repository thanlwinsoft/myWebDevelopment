// Copyright: Keith Stribley 2008, 2010 http://www.ThanLwinSoft.org/
// License: GNU Lesser General Public License, version 2.1 or later.
// http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
var tlsAlertOnce  = true;
function TlsDebug()
{
    this.debug = (typeof document != "undefined")? document.getElementById("tlsDebug") : false;
    this.indent = "";
    this.dumpLevel = 0;
    this.FINE = new Number(1);
    this.DEBUG = new Number(2);
    this.INFO = new Number(4);
    this.WARN = new Number(8);
    this.FATAL = new Number(16);
    this.msgLevel = (this.DEBUG | this.INFO | this.WARN | this.FATAL);
    this.print = function(t)
    {
        if (this.debug)
        {
            this.debug.appendChild(document.createTextNode(t));
            this.debug.appendChild(document.createElement("br"));
        }
        return this;
    }
    this.dbgMsg = function(level, t)
    {
        if (this.debug && (level & this.msgLevel))
        {
            this.debug.appendChild(document.createTextNode(t));
            this.debug.appendChild(document.createElement("br"));
        }
        return this;
    }
    this.clear = function() { if (this.debug) this.debug.innerHTML = ""; return this; };
    this.dump = function(obj, levels) {
        var indent = this.indent;
        if (levels == undefined) levels = 1;
        this.dumpLevel++;
        var i = 0;
        for (var p in obj)
        {
            this.print(this.indent + p + ":" + obj[p]);
            if (typeof obj[p] == "object" && this.dumpLevel < levels) 
            {
                this.indent = indent + "\u00A0\u00A0";
                this.dump(obj[p], levels - 1);
                this.indent = indent;
            }
            if (++i > 100) 
            {
                this.print("Only printed first 100 properties."); break; 
            }
        }
        this.dumpLevel--;
        return this;
    };
    return this;
}


//TlsDebug.prototype.msgLevel = (TlsDebug.INFO | TlsDebug.WARN | TlsDebug.FATAL);

var tlsUserAgent = (function() 
{
    if (typeof navigator != "undefined")
    {
        var userAgent = navigator.userAgent.toLowerCase();
        this.isGecko = (userAgent.indexOf('gecko') != -1);
        this.isIe = (userAgent.indexOf("msie")!=-1);
        this.isOpera = (userAgent.indexOf("opera")!=-1);
        this.isWebkit = (userAgent.indexOf("webkit")!=-1);
    }
    return this;
})();

