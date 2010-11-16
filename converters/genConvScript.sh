
echo 'var tlsMyanmarConverterData = new Object();'
echo 'tlsMyanmarConverterData["zawgyi-one"]='
cat zawgyi.json
echo '; new TlsMyanmarConverter(tlsMyanmarConverterData["zawgyi-one"]);'
echo 'tlsMyanmarConverterData["wininnwa"]='
cat wininnwa.json
echo ';new TlsMyanmarConverter(tlsMyanmarConverterData["wininnwa"]);'
echo 'tlsMyanmarConverterData["wwin_burmese1"]='
cat wwin_burmese.json
echo ';new TlsMyanmarConverter(tlsMyanmarConverterData["wwin_burmese1"]);'

