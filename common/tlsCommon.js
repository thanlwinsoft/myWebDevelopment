// Copyright: Keith Stribley 2008, 2010 http://www.ThanLwinSoft.org/
// License: GNU Lesser General Public License, version 2.1 or later.
// http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

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

