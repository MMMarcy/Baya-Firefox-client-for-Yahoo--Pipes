const ParameterValues = "pv";
const CompCo = "comco";
const MultiCompCo = "mulco";


function getQueryVariable(text,variable) {
    var query = text;
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return unescape(pair[1]);
        }
    }
    return null;
}
    
var log = function (aMessage) {
       try{
              aMessage += "\n";
              var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
              consoleService.logStringMessage(aMessage);
              dump(aMessage);
              console.log(aMessage);
       } catch (e){
              log(a.message);
       }
}

var logE = function (exception){
       log(exception.message+", line:"+exception.lineNumber+" -> "+exception.fileName);
}

function saveSession(str){
       var tmp  = getQueryVariable(str, "id");
       if(tmp)
              session.id = tmp
        
       tmp =  getQueryVariable(str, "name");
       if(tmp)
              session.name = tmp;
              
       tmp= getQueryVariable(str, ".crumb");
       if(tmp)
              session.crumb =tmp;
              
       tmp = getQueryVariable(str, "tags");
       if(tmp)
              session.tags=tmp;
              
       tmp = getQueryVariable(str, "rnd");
       if(tmp)
              session.rnd = tmp;
    try{
    var def = getQueryVariable(str, "_def");
       if(def){
          session.pm.push(JSON.parse(def));
          if(!session.pm[session.pm.length-1].layout){
                 session.pm[session.pm.length-1].layout = session.pm[session.pm.length-2].layout;  
          }
       }
    } catch (e) {
       logE(e);
    }
}



function savePattern(postString){
    //we put a model panel over the baya plugin that will be removed when the loading is done
    //we clean the preview panel
    var infoContainer = mainWindow.document.getElementById("infoContainer");
    while(infoContainer.firstChild)
       infoContainer.removeChild(infoContainer.firstChild);
    res = new Res();
    //We set this to check that the request is made by baya
    log("we save now with postString ="+unescape(postString));
    session.customReq = true;      
    var req = new XMLHttpRequest();
    req.open("POST", "http://pipes.yahoo.com/pipes/ajax.pipe.save", true);
    req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    //Now we send the xmlHttpRequest
    req.send(postString);       
}

function translateFromNameToType(name){
       switch (name){
              case "Unique":
                     return "uniq";
              case "URL Builder":
                     return "urlbuilder";
              case "Find First Site Feed":
                     return "fetchsitefeed";
              case "Fetch Page":
                     return "fetchpage";
              case "Yahoo! Local":
                     return "ylocal";
              case "Fetch Feed":
                     return "fetch";
              case "YQL":
                     return "yql";
              case "Flickr":
                     return "flickr";
              case "Filter":
                     return "filter";
              case "Sort":
                     return "sort";
              default:
                     return name.replace(" ","").toLowerCase();
       }       
}
function translateFromTypeToName(type){
       switch (type){
              case "uniq":
                     return "Unique";
              case "output":
                     return "Pipe Output";
              case "urlbuilder":
                     return "URL Builder";
              case "fetchsitefeed":
                     return "Find First Site Feed";
              case "fetchpage":
                     return "fetchpage";
              case "ylocal":
                     return "Yahoo! Local";
              case "fetch":
                     return "Fetch Feed";
              case "yql":
                     return "YQL";
              case "flickr":
                     return "Flickr";
              case "filter":
                     return "Filter";
              case "sort":
                     return "Sort";
              default:
                     return type;
       }       
}

function reset(){
       log("resetting baya");
       session = new Session();
       res = new Res();
       gBrowser.loadURI("http://pipes.yahoo.com/pipes/pipe.edit", gBrowser.currentURI, "UTF-8" );
}







