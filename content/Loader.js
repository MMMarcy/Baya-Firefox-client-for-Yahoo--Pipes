
//Getting the reference to the main browser object
var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)  
.getInterface(Components.interfaces.nsIWebNavigation)  
.QueryInterface(Components.interfaces.nsIDocShellTreeItem)  
.rootTreeItem  
.QueryInterface(Components.interfaces.nsIInterfaceRequestor)  
.getInterface(Components.interfaces.nsIDOMWindow);
var gBrowser = mainWindow.gBrowser;

var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

//Function that loads baya plugin
var Loader = {
    observe : function (subject, topic, data){
        try{
            var tmp = window.document.getElementById("bayaMenu");
            if(tmp.getAttribute("hidden") === "true")
                tmp.setAttribute("hidden", "false");
            addListeners();  
        } catch (e){
            Components.utils.reportError(e);
        }

    },
    QueryInterface: function(aIID){
        if (typeof Cc == "undefined") {
            var Cc = Components.classes;
        }
        if (typeof Ci == "undefined") {
            var Ci = Components.interfaces;
        }
        if (aIID.equals(Ci.nsIObserver) ||
            aIID.equals(Ci.nsISupports)) {
            return this;
        }

        throw Components.results.NS_NOINTERFACE;

    },
}

//Register the observer 
observerService.addObserver(Loader,"baya-on-load", false);
function tdLoadHandler(event) {
    var targetBrowser = null;
    var uri, pageCookie;
    if (gBrowser) {
        if (gBrowser.mTabbedMode) {
            var targetBrowserIndex = gBrowser.getBrowserIndexForDocument(event.originalTarget);
            if (targetBrowserIndex != -1) {
                targetBrowser = gBrowser.getBrowserAtIndex(targetBrowserIndex);
            }
        } else {
            targetBrowser = gBrowser.mCurrentBrowser;
        }
    }
    if(targetBrowser){
        uri = targetBrowser.currentURI.prePath + targetBrowser.currentURI.path;
        if(uri.indexOf("http://pipes.yahoo.com/pipes/pipe.edit") == 0){
            //Telling the observe that we are on pipe page
            observerService.notifyObservers(event,"baya-on-load", uri);
        }
        else{
            //Unload the baya plugin ( Still to be fixed )
            var tmp = window.document.getElementById("bayaMenu");
            if(tmp.getAttribute("hidden") === "false"){
                tmp.setAttribute("hidden", "true");
                session = new Session();
            }
        }
    }

}
window.addEventListener("load",
    function () {
        gBrowser.addEventListener("load", tdLoadHandler, true);
    },
    false
);

