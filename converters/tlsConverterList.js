

function TlsConversionLoader(converterName, converterData)
{
    this.converterName = converterName;
    this.req = new XMLHttpRequest();
    this.req.open("GET", "converters/" + converterData, true);
    this.req.overrideMimeType('text/plain; charset=utf-8');
    //this.req.onreadystatechange = this;
    this.handleEvent = function(theEvent) {
        if (this.req.readyState == 4 && (this.req.status == 200 || this.req.status == 0))
        {
            try
            {
                var data = JSON.parse( this.req.responseText );
                new TlsMyanmarConverter(this.converterName, data);
            }
            catch(e)
            {
                var debug = new TlsDebug();
                debug.print(e + " " + this.converterName);
                for (var f in e)
                {
                    debug.print(f + ":" + e[f]);
                }
            }
        }
    };
    this.req.addEventListener("readystatechange", this, true);
    this.load = function() { this.req.send(); }
}

var tlsZawgyiLoader = new TlsConversionLoader("zawgyi-one", "zawgyi.json");
tlsZawgyiLoader.load();
var tlsWininnwaLoader = new TlsConversionLoader("wininnwa", "wininnwa.json");
tlsWininnwaLoader.load();
var tlsWwin_BurmeseLoader = new TlsConversionLoader("wwin_burmese1", "wwin_burmese.json");
tlsWwin_BurmeseLoader.load();

