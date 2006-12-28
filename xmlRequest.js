/** Retrieves the XMLHTTPRequest object.
* The getRequestObject method is taken from xAJAX 
* and is covered by the GNU LESSER GENERAL PUBLIC LICENSE
* See http://www.xajaxproject.org
*/
function XmlRequest()
{
	this.getRequestObject = function()
	{
		var req = null;
		// IE7 now has a native XMLHttpRequest object, however, 
        // it does not allow access to local files, which is 
		// what we want it for, so choose the ActiveXObject in preference
		if (!req && typeof ActiveXObject != "undefined")
		{
			try
			{
				req=new ActiveXObject("Msxml2.XMLHTTP");
			}
			catch (e)
			{
				try
				{
					req=new ActiveXObject("Microsoft.XMLHTTP");
				}
				catch (e2)
				{
					try {
						req=new ActiveXObject("Msxml2.XMLHTTP.4.0");
					}
					catch (e3)
					{
						req=null;
					}
				}
			}
		}
		if (typeof XMLHttpRequest != "undefined")
			req = new XMLHttpRequest();
		if(!req && window.createRequest)
			req = window.createRequest();
		
		if (!req) window.status = "Request Object Instantiation failed.";
			
		return req;
	};
}
var xmlRequest = new XmlRequest();
