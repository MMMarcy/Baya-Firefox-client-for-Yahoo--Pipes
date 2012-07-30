function TracingListener() {
//this.receivedData = [];
}
//Class for reading the response body
TracingListener.prototype =
{
    originalListener: null,
    receivedData: "",   // array for incoming data.

    onDataAvailable: function(subject, context, inputStream, offset, count)
    {
        var binaryInputStream = CCIN("@mozilla.org/binaryinputstream;1", "nsIBinaryInputStream");
        var storageStream = CCIN("@mozilla.org/storagestream;1", "nsIStorageStream");
        binaryInputStream.setInputStream(inputStream);
        storageStream.init(8192, count, null);

        var binaryOutputStream = CCIN("@mozilla.org/binaryoutputstream;1",
            "nsIBinaryOutputStream");

        binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));

        // Copy received data as they come.
        var data = binaryInputStream.readBytes(count);
        var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
        this.receivedData = data;
        //Will be true only with our custom requests to save the PM   
        if(httpChannel.originalURI.prePath == "http://pipes.yahoo.com" && httpChannel.originalURI.path == "/pipes/ajax.pipe.save" && session.customReq){ 
            session.customReq = false;
            log("data from custom req is ----> "+data);
            if(!session.id){
                session.id = JSON.parse(unescape(data)).id; 
            }
            try {
                window.gBrowser.loadURI("http://pipes.yahoo.com/pipes/pipe.edit?_id="+session.id, gBrowser.currentURI, "UTF-8" );
            }catch(e){
                log(e.message+" line:"+e.lineNumber);
            }
        }
        //Only for the first save
        if(httpChannel.originalURI.prePath == "http://pipes.yahoo.com" && httpChannel.originalURI.path.indexOf("/pipes/ajax.module.list") == 0 && !session.name){
            session.name = "test";
            var saveStr = "_out=json&name="+session.name+"&_def=%7B%22layout%22%3A%5B%7B%22id%22%3A%22_OUTPUT%22%2C%22xy%22%3A%5B671%2C724%5D%7D%5D%2C%22modules%22%3A%5B%7B%22type%22%3A%22output%22%2C%22id%22%3A%22_OUTPUT%22%2C%22conf%22%3A%7B%7D%7D%5D%2C%22terminaldata%22%3A%5B%5D%2C%22wires%22%3A%5B%5D%7D&rnd=918";
            saveStr += "&.crumb="+session.crumb;
            savePattern(saveStr);
        } 
        
        binaryOutputStream.writeBytes(data, count);
        this.originalListener.onDataAvailable(subject, context,storageStream.newInputStream(0), offset, count);
    },

    onStartRequest: function(request, context) {
        this.originalListener.onStartRequest(request, context);
    },

    onStopRequest: function(request, context, statusCode)
    {
        this.originalListener.onStopRequest(request, context, statusCode);
    },

    QueryInterface: function (aIID) {
        if (aIID.equals(Ci.nsIStreamListener) ||
            aIID.equals(Ci.nsISupports)) {
            return this;
        }
        throw Components.results.NS_NOINTERFACE;
    },
    
    

}; 


hRO = {
    observe: function(subject, topic, data){
        
        if(topic == "http-on-modify-request"){
            var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
            var poststr;
            /**
             * Ifs to take different actions based on the path of the request
             */
            if(subject.originalURI.prePath == "http://pipes.yahoo.com" && subject.originalURI.path == "/pipes/ajax.pipe.save" ){
                 poststr = readFromStream(httpChannel); 
                try{
                    log("INTERCEPTING THE SAVE METHOD");
                    //Read the request BEFORE is sent 
                    //log("parsing JSON inside the examine request coming from ajax.pipe.save");
                    saveSession(poststr);
                    
                }
                catch(exp){
                    logE(exp);
                }
            }
            if(subject.originalURI.prePath == "http://pipes.yahoo.com" && subject.originalURI.path == "/pipes/ajax.pipe.preview"){
                poststr = readFromStream(httpChannel); 
                //log("parsing JSON inside the request to ajax.pipe.preview"); 
                saveSession(poststr);
                
            }
            if(subject.originalURI.prePath == "http://pipes.yahoo.com" && subject.originalURI.path.indexOf("/pipes/ajax.module.list") == 0 && !session.crumb){
                log("we save the .crumb from the first request");
                session.crumb = getQueryVariable(subject.originalURI.path, ".crumb");
                log("crumb = "+session.crumb);
            }
        }
        if(topic == "http-on-examine-response"){
            subject.QueryInterface(Components.interfaces.nsIHttpChannel);
            if(subject.originalURI.prePath == "http://pipes.yahoo.com" && subject.originalURI.path == "/pipes/ajax.pipe.preview"){
                findDiff();
            }else{
                try{
                    var newListener = new TracingListener();
                    subject.QueryInterface(Ci.nsITraceableChannel);
                    newListener.originalListener = subject.setNewListener(newListener);
                }catch(exp){
                    log(exp.message+", line n."+exp.lineNumber);
                }
            }
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
    
    


};

if (typeof Cc == "undefined") {
    var Cc = Components.classes;
}
if (typeof Ci == "undefined") {
    var Ci = Components.interfaces;
}
if (typeof CCIN == "undefined") {
    function CCIN(cName, ifaceName){
        return Cc[cName].createInstance(Ci[ifaceName]);
    }
}
if (typeof CCSV == "undefined") {
    function CCSV(cName, ifaceName){
        if (Cc[cName])
            // if fbs fails to load, the error can be _CC[cName] has no properties
            return Cc[cName].getService(Ci[ifaceName]);
        else{
            alert("CCSV fails for cName:" + cName);
            return null;
        }
    };
}
/**
 *Add observers to the browser
 */
observerService.addObserver(hRO,"http-on-examine-response", false);
observerService.addObserver(hRO,"http-on-modify-request", false);


//Method to read a stream from a channel and convert it into a ascii string.
var readFromStream = function  (channel){
    try{
        var is = channel.QueryInterface(Ci.nsIUploadChannel).uploadStream;
        var ss = is.QueryInterface(Ci.nsISeekableStream);
        ss.seek(Components.interfaces.nsISeekableStream.NS_SEEK_SET, 0);  
        var stream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);  
        stream.setInputStream(ss);
        var postBytes = stream.readByteArray(stream.available());  
        var poststr = String.fromCharCode.apply(null, postBytes);  
        ss.seek(Components.interfaces.nsISeekableStream.NS_SEEK_SET, 0);
        return poststr;
    } catch(e){
        log(e.message +", line: "+e.lineNumber);
    }
    return null;
}
