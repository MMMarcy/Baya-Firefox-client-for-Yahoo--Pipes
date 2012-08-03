/**
 * Load the storage module from Firefox native API
 */
Components.utils.import("resource://gre/modules/Services.jsm");  
Components.utils.import("resource://gre/modules/FileUtils.jsm");

var file = FileUtils.getFile("ProfD", ["bayatest.sqlite"]);
var voteFile = FileUtils.getFile("ProfD", ["bayaVoteDB.sqlite"]);
var filePath = file.path;
var db = Services.storage.openDatabase(file);
var voteDB = Services.storage.openDatabase(voteFile);
/**
 * Init the local db
 */
function initDB(){
    try{
        db.executeSimpleSQL('create table if not exists ParameterValues (componentName varchar(100), conf text, desc varchar(1000),  '+
            ' Tags varchar(100), usage int(10), DownVotes int(10), UpVotes int(10), date  datetime DEFAULT current_timestamp ,'+
            ' primary key(componentName, conf) );');
        db.executeSimpleSQL('create table if not exists CompCo ( srcComp varchar(1000), conf text, desc varchar(1000), '+
            ' Tags varchar(256), UpVotes int(20), usage int(20), DownVotes int(20), date  Timestamp DEFAULT current_timestamp,'+
            ' primary key(srcComp, conf) ); ');
        db.executeSimpleSQL('create table if not exists MultiCompCo ' +
            '(srcComp varchar(1000), conf text, desc varchar(1000), Tags varchar(100), ' +
            'UpVotes int(10), DownVotes int(10), usage int(10), date  datetime DEFAULT current_timestamp, primary key(srcComp, conf) ) '); 
    }catch(e){
        logE(e);
    }
    fill4DEMO();
}

//Function to init VoteDB, used to avoid multiple vote of a singleComp by a user
function initVoteDB(){
    try{
        voteDB.executeSimpleSQL('create table if not exists AlreadyVoted (conf text , primary key(conf))');
    }catch(e){
        logE(e);
    }
}

//Function to save an entry in the vote Table
function saveVote(json, typeVote, typeRecommendation,votes){
    try{
        var stmt = voteDB.createAsyncStatement("INSERT INTO AlreadyVoted(conf) values(:json) ");
        stmt.params.json = json;
    
        stmt.executeAsync({
            handleError: function(aError) {  
                printErrorInVote();
            },  
      
            handleCompletion: function(aReason) {  
                if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)
                    printErrorInVote();
                else{
                    //Just add the url to which send the request
                    /*
                    var req = new XMLHttpRequest();
                    req.open("POST", "http://pipes.yahoo.com/pipes/ajax.pipe.save", true);
                    req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
                    //Now we send the xmlHttpRequest
                    req.send(postString);  */
                    //TODO: write code to update the client db
                    try{
                        var stmt;
                        switch(typeRecommendation){
                            case (ParameterValues):
                                stmt = db.createAsyncStatement('UPDATE ParameterValues SET \''+typeVote+'\' = :votes  WHERE ParameterValues.conf like :json');
                                break;
                            case (CompCo):
                                stmt = db.createAsyncStatement('Update CompCo set \''+typeVote+'\' = :votes where CompCo.conf like :json');
                                break;
                            case (MultiCompCo):
                                stmt = db.createAsyncStatement('Update MultiCompCo set \''+typeVote+'\' = :votes where MultiCompCo.conf like :json');
                                break;
                            default:
                                return;
                        }
                        stmt.params.votes = votes;
                        stmt.params.json = json;
                        stmt.executeAsync({
                            handleCompletion: function(aReason) {
                                log("update query completed");    
                            },
                            handleError: function(aError) {  
                                log("Error in update query: " + aError.message);  
                            },
                        });
                        
                    } catch(e){
                        logE(e);    
                    }  
                        
                }
            }
        });
    } catch(e){
        logE(e);
    } 
}

//Function to print "you have already reated this component"
function printErrorInVote(){
    var div = document.getElementById("favor_percent_268");
    while(div.firstChild)
        div.removeChild(div.firstChild);
    
    div.appendChild(document.createTextNode("You have already rated this component"));
}


initDB();
initVoteDB();

function updateDb(){
    
    //Check if the user has already updates in this session
    var dbBtn = mainWindow.document.getElementById("updateDbBtn");
    
    if(dbBtn.getAttribute("class") == "disabled")
        return;
    
    //Erase the old db
    if(file && file.exists()){
        db.asyncClose();
        file.remove(false);
    }
    
    
    //Cached download
    var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]  
    .createInstance(Components.interfaces.nsIWebBrowserPersist);
    
    //File in the profileDirectory
    file = Components.classes["@mozilla.org/file/local;1"]  
    .createInstance(Components.interfaces.nsILocalFile);  
    file.initWithPath(filePath);
    
    //URI pointing to the Database dump
    var obj_URI = Components.classes["@mozilla.org/network/io-service;1"]  
    .getService(Components.interfaces.nsIIOService)  
    .newURI("http://m-steiner.me/bayatest.sqlite", null, null);
    
    //Displaying unpdate process status
    var infoContainer = mainWindow.document.getElementById("infoContainer");
    
    //Cleaning the panel
    while(infoContainer.firstChild){
        infoContainer.removeChild(infoContainer.firstChild);
    }            
    
    //Title of the Download status panel
    var h3 = document.createElementNS("http://www.w3.org/1999/xhtml", "h4");
    h3.appendChild(document.createTextNode("Update Status"));
    h3.setAttribute("class","yahoo-accordion-title-vert");
    infoContainer.appendChild(h3);
    var text = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
    infoContainer.appendChild(text);
    
    persist.progressListener = {  
        onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
            //Current percent of the download
            var percentComplete = Math.floor((aCurTotalProgress/aMaxTotalProgress)*100);
          
            //Cleaning the text
            while(text.firstChild){
                text.removeChild(text.firstChild);
            }            
            
            if(percentComplete==100){
                //Download Complete
                var percentage = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
                percentage.appendChild(document.createTextNode("Update process is complete. You can start using Baya again"));
                text.appendChild(percentage);
                db = Services.storage.openDatabase(file);
                
                initDB();
                dbBtn.setAttribute("class","disabled");
            }else{
                //Download still not Complete
                text.appendChild(document.createTextNode("update process is "));
                var percentage = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
                percentage.appendChild(document.createTextNode(percentComplete+"% "));
                text.appendChild(percentage);
                text.appendChild(document.createTextNode("complete"));
            }
            
        },  
        onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) {  
            
        }  
    }  
    persist.saveURI(obj_URI, null, null, null, "", file); 

    
}





//ONLY FOR THE DEMO (should be removed in a prod environment)
function fill4DEMO(){
    try{
        //urlbuilder 1
        var stmt = db.createStatement("INSERT INTO ParameterValues (componentName, conf, desc,  UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc, :UpVotes, :DownVotes, :usage, :Tags )");
        stmt.params.name = "urlbuilder";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"conf":{"BASE":{"value":"http://ws.geonames.org","type":"text"},"PORT":{"value":"0","type":"number"},"PATH":{"value":"rssToGeoRSS","type":"text"},"PARAM":[{"key":{"value":"feedUrl","type":"text"},"value":{"value":"news.google.com/news?output=rss","type":"text"}}]}}';
        //stmt.params.small = "chrome://baya/content/ParameterValue/small/urlbuilder1.gif";
        //stmt.params.big = "chrome://baya/content/ParameterValue/large/ParamValue-01.bmp";
        stmt.params.UpVotes = 73;
        stmt.params.DownVotes = 27;
        stmt.params.usage = 2058;
        stmt.params.Tags = "geoCoder#find nearby#craiglist#address";
        stmt.execute();
    } catch(e){
        log(e);
    } finally {
        //stmt.reset();
    }
    try{
        //urlbuilder 2
        var stmt = db.createStatement("INSERT INTO ParameterValues (componentName, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc,  :UpVotes, :DownVotes, :usage, :Tags )");
        stmt.params.name = "urlbuilder";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"conf":{"BASE":{"value":"http://www.science.unitn.it","type":"text"},"PORT":{"value":"0","type":"number"},"PATH":{"value":"","type":"text"},"PARAM":[{"key":{"value":"","type":"text"},"value":{"value":"","type":"text"}}]}}';
        //stmt.params.small = "chrome://baya/content/ParameterValue/small/urlbuilder2.gif";
        //stmt.params.big = "chrome://baya/content/ParameterValue/large/ParamValue-02.bmp";
        stmt.params.UpVotes = 94;
        stmt.params.DownVotes = 27;
        stmt.params.usage = 1358;
        stmt.params.Tags = "unitn#";
        stmt.execute();
    } catch(e){
        log(e);
    } finally {
        //stmt.reset();
    }
    
    try{
        //fetch-feed1
        var stmt = db.createStatement("INSERT INTO ParameterValues (componentName, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc,  :UpVotes, :DownVotes, :usage, :Tags )");
        stmt.params.name = "fetch";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"conf":{"URL":{"value":"http://feeds.feedburner.com/yodelanecdotal","type":"url"}}}';
        //stmt.params.small = "chrome://baya/content/ParameterValue/small/fetchfeed1.gif";
        //stmt.params.big = "";
        stmt.params.UpVotes = 87;
        stmt.params.DownVotes = 27;
        stmt.params.usage = 1348;
        stmt.params.Tags = "feedburner#feeds#";
        stmt.execute();
    } catch(e){
        logE(e);
    } finally {
        //stmt.reset();
    }
    
    try{
        //fetch-feed2
        var stmt = db.createStatement("INSERT INTO ParameterValues (componentName, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc,  :UpVotes, :DownVotes, :usage, :Tags )");
        stmt.params.name = "fetch";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"conf":{"URL":{"value":"http://feeds.bbci.co.uk/news/science_and_environment/rss.xml","type":"url"}}}';
        //stmt.params.small = "chrome://baya/content/ParameterValue/small/fetchfeed2.gif";
        //stmt.params.big = "";
        stmt.params.UpVotes = 198;
        stmt.params.DownVotes = 87;
        stmt.params.usage = 1158;
        stmt.params.Tags = "bbc#feeds#science#environment#";
        stmt.execute();
    } catch(e){
        logE(e);
    } finally {
        //stmt.reset();
    }
    
    try{
        //filter1
        var stmt = db.createStatement("INSERT INTO ParameterValues (componentName, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc,  :UpVotes, :DownVotes, :usage, :Tags )");
        stmt.params.name = "filter";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"conf":{"MODE":{"type":"text","value":"permit"},"COMBINE":{"type":"text","value":"and"},"RULE":[{"field":{"value":"title","type":"text"},"op":{"type":"text","value":"matches"},"value":{"value":"Product Pulse","type":"text"}}]}}';
        //stmt.params.small = "chrome://baya/content/ParameterValue/small/filter1.gif";
        //stmt.params.big = "";
        stmt.params.UpVotes = 111;
        stmt.params.DownVotes = 27;
        stmt.params.usage = 984;
        stmt.params.Tags = "product pulse#allow titles#filter";
        stmt.execute();
    } catch(e){
        logE(e);
    } finally {
        //stmt.reset();
    }
    
    try{
        //filter2
        var stmt = db.createStatement("INSERT INTO ParameterValues (componentName, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc,  :UpVotes, :DownVotes, :usage, :Tags )");
        stmt.params.name = "filter";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"conf":{"MODE":{"type":"text","value":"permit"},"COMBINE":{"type":"text","value":"or"},"RULE":[{"field":{"value":"description","type":"text"},"op":{"type":"text","value":"contains"},"value":{"value":"Apple","type":"text"}},{"field":{"value":"description","type":"text"},"op":{"type":"text","value":"contains"},"value":{"value":"macbook","type":"text"}}]}}';
        //stmt.params.small = "chrome://baya/content/ParameterValue/small/filter2.gif";
        //stmt.params.big = "";
        stmt.params.UpVotes = 94;
        stmt.params.DownVotes = 27;
        stmt.params.usage = 1958;
        stmt.params.Tags = "filter#apple#macbook#permit";
        stmt.execute();
    } catch(e){
        logE(e);
    } finally {
        //stmt.reset();
    }
        
    //COMPO #####################################################################
    try{
        //urlbuilder->fecth-feed
        var stmt = db.createStatement("INSERT INTO CompCo (srcComp, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc, :UpVotes, :DownVotes, :usage, :Tags)");
        stmt.params.name = "urlbuilder";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"wires":[{"id":"_w1","src":{"id":"_OUTPUT","moduleid":"urlbuilder"},"tgt":{"id":"1_URL","moduleid":"fetch"}}],"modules":[{"type":"urlbuilder","id":"sw-82","conf":{"BASE":{"value":"http://ws.geonames.org","type":"text"},"PORT":{"value":"0","type":"number"},"PATH":{"value":"rssToGeoRSS","type":"text"},"PARAM":[{"key":{"value":"feedUrl","type":"text"},"value":{"value":"news.google.com/news?output=rss","type":"text"}}]}},{"type":"fetch","id":"sw-117","conf":{"URL":{"type":"url","terminal":"1_URL"}}}]}';
        //stmt.params.small = "chrome://baya/content/Co-occurrence/small/urlbuilder1.gif";
        //stmt.params.big = "chrome://baya/content/Co-occurrence/large/CoOccurrence-01.bmp";
        stmt.params.UpVotes = 93;
        stmt.params.DownVotes = 7;
        stmt.params.usage = 153;
        stmt.params.Tags = "geoname#html#map";
        stmt.execute();
    } catch(e){
        logE(e);
    } finally {
        //stmt.reset();
    }
    
    try{
        //urlbuilder->fecth-page
        var stmt = db.createStatement("INSERT INTO CompCo (srcComp, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc, :UpVotes, :DownVotes, :usage, :Tags)");
        stmt.params.name = "urlbuilder";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"wires":[{"id":"_w8","src":{"id":"_OUTPUT","moduleid":"urlbuilder"},"tgt":{"id":"URL","moduleid":"fetchpage"}}],"modules":[{"type":"urlbuilder","id":"sw-154","conf":{"BASE":{"value":"http://www.unitn.it","type":"text"},"PORT":{"value":"","type":"number"},"PATH":[{"value":"en","type":"text"},{"value":"scienze","type":"text"},{"value":"6859","type":"text"},{"value":"master-science-computer-science","type":"text"}],"PARAM":[{"key":{"value":"","type":"text"}}]}},{"type":"fetchpage","id":"sw-178","conf":{"URL":{"type":"url","terminal":"URL"},"from":{"value":"","type":"text"},"to":{"value":"","type":"text"},"token":{"value":"","type":"text"}}}],"terminaldata":[]}';
        //stmt.params.small = "chrome://baya/content/Co-occurrence/small/urlbuilder2.gif";
        //stmt.params.big = "chrome://baya/content/Co-occurrence/large/CoOccurrence-02.bmp";
        stmt.params.UpVotes = 93;
        stmt.params.DownVotes = 7;
        stmt.params.usage = 153;
        stmt.params.Tags = "fetch page#science.unitn.it#";
        stmt.execute();
    } catch(e){
        logE(e);
    } finally {
        //stmt.reset();
    }  

    try{
        //fetch-sort
        var stmt = db.createStatement("INSERT INTO CompCo (srcComp, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc, :UpVotes, :DownVotes, :usage, :Tags)");
        stmt.params.name = "fetch";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"wires":[{"id":"_w2","src":{"id":"_OUTPUT","moduleid":"fetch"},"tgt":{"id":"_INPUT","moduleid":"sort"}}],"modules":[{"type":"fetch","id":"sw_46","conf":{"URL":{"value":"http://feeds.feedburner.com/yodelanecdotal","type":"url"}}},{"type":"sort","id":"sw-136","conf":{"KEY":[{"field":{"value":"title","type":"text"},"dir":{"type":"text","value":"ASC"}}]}}],"terminaldata":[]}';
        //stmt.params.small = "chrome://baya/content/Co-occurrence/small/fetchfeed2.gif";
        //stmt.params.big = "";
        stmt.params.UpVotes = 1527;
        stmt.params.DownVotes = 111;
        stmt.params.usage = 15745;
        stmt.params.Tags = "sort by title#feed";
        stmt.execute();
    } catch(e) {
        logE(e);
    }
    finally{
        //stmt.reset();
    }
    
    try{
        //fetch-filter
        var stmt = db.createStatement("INSERT INTO CompCo (srcComp, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc, :UpVotes, :DownVotes, :usage, :Tags)");
        stmt.params.name = "fetch";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"wires":[{"id":"_w3","src":{"id":"_OUTPUT","moduleid":"fetch"},"tgt":{"id":"_INPUT","moduleid":"filter"}}],"modules":[{"type":"fetch","id":"sw-117","conf":{"URL":{"type":"url","terminal":"1_URL"}}},{"type":"filter","id":"sw-125","conf":{"MODE":{"type":"text","value":"permit"},"COMBINE":{"type":"text","value":"or"},"RULE":[{"field":{"value":"description","type":"text"},"op":{"type":"text","value":"contains"},"value":{"value":"Apple","type":"text"}},{"field":{"value":"description","type":"text"},"op":{"type":"text","value":"contains"},"value":{"value":"macbook","type":"text"}}]}}],"terminaldata":[]}';
        //stmt.params.small = "chrome://baya/content/Co-occurrence/small/fetchfeed1.gif";
        //stmt.params.big = "chrome://baya/content/Co-occurrence/large/CoOccurrence-03.jpg";
        stmt.params.UpVotes = 77;
        stmt.params.DownVotes = 23;
        stmt.params.usage = 1543;
        stmt.params.Tags = "fetch#filter#";
        stmt.execute();
    } catch(e) {
        logE(e);
    }
    finally{
        //stmt.reset();
    }
    ///MULCO ##########################################################################
    try{
        //filter -> loc. extractor -> output
        var stmt = db.createStatement("INSERT INTO MultiCompCo (srcComp, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc, :UpVotes, :DownVotes, :usage, :Tags)");
        stmt.params.name = "filter";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"modules":[{"type":"filter","id":"sw-125","conf":{"MODE":{"type":"text","value":"permit"},"COMBINE":{"type":"text","value":"or"},"RULE":[{"field":{"value":"description","type":"text"},"op":{"type":"text","value":"contains"},"value":{"value":"Apple","type":"text"}},{"field":{"value":"description","type":"text"},"op":{"type":"text","value":"contains"},"value":{"value":"macbook","type":"text"}}]}},{"type":"geotag","id":"sw-144","conf":{}}],"terminaldata":[],"wires":[{"id":"_w5","src":{"id":"_OUTPUT","moduleid":"filter"},"tgt":{"id":"_INPUT","moduleid":"geotag"}},{"id":"_w7","src":{"id":"_OUTPUT","moduleid":"geotag"},"tgt":{"id":"_INPUT","moduleid":"_OUTPUT"}}]}';
        //stmt.params.small = "chrome://baya/content/Multicomponent/small/filterm3.gif";
        //stmt.params.big = "chrome://baya/content/Multicomponent/large/Multicomponent-01.bmp";        
        stmt.params.UpVotes = 77;
        stmt.params.DownVotes = 23;
        stmt.params.usage = 189;
        stmt.params.Tags = "geocoordinates#locationEx#topic-map#";
        stmt.execute();
    } catch (e){
        logE(e);
    }
    finally{
        //stmt.reset();
    }
    
    
    try{
        //url builder, fetch feed, filter
        var stmt = db.createStatement("INSERT INTO MultiCompCo (srcComp, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc, :UpVotes, :DownVotes, :usage, :Tags)");
        stmt.params.name = "urlbuilder";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"modules":[{"type":"urlbuilder","id":"sw-3","conf":{"BASE":{"value":"http://ws.geonames.org","type":"text"},"PORT":{"value":"0","type":"number"},"PATH":{"value":"rssToGeoRSS","type":"text"},"PARAM":[{"key":{"value":"feedUrl","type":"text"},"value":{"value":"news.google.com/news?output=rss","type":"text"}}]}},{"type":"fetch","id":"sw-117","conf":{"URL":{"type":"url","terminal":"1_URL"}}},{"type":"filter","id":"sw-125","conf":{"MODE":{"type":"text","value":"permit"},"COMBINE":{"type":"text","value":"or"},"RULE":[{"field":{"value":"description","type":"text"},"op":{"type":"text","value":"contains"},"value":{"value":"Apple","type":"text"}},{"field":{"value":"description","type":"text"},"op":{"type":"text","value":"contains"},"value":{"value":"macbook","type":"text"}}]}}],"wires":[{"id":"_w0","src":{"id":"_OUTPUT","moduleid":"urlbuilder"},"tgt":{"id":"1_URL","moduleid":"fetch"}},{"id":"_w1","src":{"id":"_OUTPUT","moduleid":"fetch"},"tgt":{"id":"_INPUT","moduleid":"filter"}}],"terminaldata":[]}';
        //stmt.params.small = "chrome://baya/content/Multicomponent/small/urlbuilder.gif";
        //stmt.params.big = "chrome://baya/content/Multicomponent/large/Multicomponent-03.bmp";        
        stmt.params.UpVotes = 745;
        stmt.params.DownVotes = 231;
        stmt.params.usage = 2478;
        stmt.params.Tags = "urlbuilder#fetch feed#filter";
        stmt.execute();
    } catch (e){
        logE(e);
    }
    finally{
        //stmt.reset();
    }

    
    try{
        //split -> count, filter -> location
        var stmt = db.createStatement("INSERT INTO MultiCompCo (srcComp, conf, desc, UpVotes, DownVotes, usage, Tags ) values(:name, :conf, :desc, :UpVotes, :DownVotes, :usage, :Tags)");
        stmt.params.name = "split";
        stmt.params.desc = "To be decided";
        stmt.params.conf = '{"modules":[{"type":"split","id":"sw-187","conf":{}},{"type":"count","id":"sw-206","conf":{}},{"type":"filter","id":"sw-213","conf":{"MODE":{"type":"text","value":"block"},"COMBINE":{"type":"text","value":"and"},"RULE":[{"field":{"value":"title","type":"text"},"op":{"type":"text","value":"contains"},"value":{"value":"Yahoo","type":"text"}}]}},{"type":"geotag","id":"sw-224","conf":{}}],"wires":[{"id":"_w9","src":{"id":"_OUTPUT","moduleid":"split"},"tgt":{"id":"_INPUT","moduleid":"count"}},{"id":"_w11","src":{"id":"_OUTPUT4","moduleid":"split"},"tgt":{"id":"_INPUT","moduleid":"filter"}},{"id":"_w13","src":{"id":"_OUTPUT","moduleid":"filter"},"tgt":{"id":"_INPUT","moduleid":"geotag"}}],"terminaldata":[]}';
        //stmt.params.small = "chrome://baya/content/Multicomponent/small/filterm2.gif";
        //stmt.params.big = "";        
        stmt.params.UpVotes = 745;
        stmt.params.DownVotes = 231;
        stmt.params.usage = 2478;
        stmt.params.Tags = "filter#counter#split#location extractor#";
        stmt.execute();
    } catch (e){
        logE(e);
    }
    finally{
        //stmt.reset();
    }

}


  
/**
 *
 * Functions to get results from local DB. Each one spawn another thread which is joined back to the main one in stmt.handleResult
 *
 */
function getPvList(name, conf){
    try{
        var stmt = db.createAsyncStatement("SELECT * FROM ParameterValues WHERE componentName = :name and conf like :conf ");
        res.pv = new Array();
        stmt.params.name = name;
        stmt.params.conf = "%"+conf+"%";
        if(conf!= ""){
            hide(compco);
            hide(mulco);
        }
    
        stmt.executeAsync({
            handleResult:  function (resSet){
                for(var row = resSet.getNextRow(); row; row = resSet.getNextRow() ){
                    var tmp = new DbRes();
                    tmp.json = row.getResultByName("conf");


                    tmp.DownVotes = row.getResultByName("DownVotes");
                    tmp.UpVotes = row.getResultByName("UpVotes");
                    tmp.date = row.getResultByName("date");
                    tmp.usage = row.getResultByName("usage");
                    tmp.Tags = row.getResultByName("Tags");
                    tmp.name = name;
                    tmp.patternType= "pv";
                    res.pv.push(tmp);                
                }
            },
            handleError: function(aError) {  
                log("Error: " + aError.message);  
            },  
  
            handleCompletion: function(aReason) {  
                if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)  
                    log("Query canceled or aborted!");
                    
                if(res.pv.length > 0){
                    var html = [];
                    for(i in res.pv){
                        html.push(createHTMLThumb(res.pv[i]));
                    }
                    show(parval, html);
                }
                else{
                    hide(parval);
                }
            }
        });
    } catch(e){
        log(e.message+", line"+e.lineNumber);
    } 
}

function getComCoList(name){
    try{
        log(name);
        var stmt = db.createAsyncStatement("SELECT * FROM CompCo WHERE srcComp like :name ");
        res.comp_co = new Array();
        stmt.params.name = name;
    
        stmt.executeAsync({
            handleResult:  function (resSet){
                for(var row = resSet.getNextRow(); row; row = resSet.getNextRow() ){
                    var tmp = new DbRes();
                    tmp.json = row.getResultByName("conf");


                    tmp.DownVotes = row.getResultByName("DownVotes");
                    tmp.UpVotes = row.getResultByName("UpVotes");
                    tmp.date = row.getResultByName("date");
                    tmp.usage = row.getResultByName("usage");
                    tmp.Tags = row.getResultByName("Tags");
                    tmp.name = name;
                    tmp.patternType= "comco";
                    res.comp_co.push(tmp);                    
                }
            },
            handleError: function(aError) {  
                log("Error in CompCo query: " + aError.message+ " "+JSON.stringify(aError));  
            },  
  
            handleCompletion: function(aReason) {  
                if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)  
                    log("Query canceled or aborted!");
                if(res.comp_co.length > 0){
                    var html = [];
                    for( i in res.comp_co){
                        html.push(createHTMLThumb(res.comp_co[i]));   
                    }
                    show(compco, html);
                }
                else{
                    hide(compco);
                }
                
                
            }
        });
    } catch(e){
        log(e.message+", line"+e.lineNumber);
    } 
}

function getMulcoList(name){
    try{
        var stmt = db.createAsyncStatement("SELECT * FROM MultiCompCo WHERE srcComp like :name ");
        res.mul_co = new Array();
        stmt.params.name = name;
    
        stmt.executeAsync({
            handleResult:  function (resSet){
                for(var row = resSet.getNextRow(); row; row = resSet.getNextRow() ){
                    var tmp = new DbRes();
                    tmp.json = row.getResultByName("conf");
                    tmp.name = name;
                    tmp.DownVotes = row.getResultByName("DownVotes");
                    tmp.UpVotes = row.getResultByName("UpVotes");
                    tmp.date = row.getResultByName("date");
                    tmp.usage = row.getResultByName("usage");
                    tmp.Tags = row.getResultByName("Tags");
                    tmp.patternType= "mulco";
                    res.mul_co.push(tmp);                    
                }
            },
            handleError: function(aError) {  
                log("Error: " + aError.message);  
            },  
  
            handleCompletion: function(aReason) {  
                if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)  
                    log("Query canceled or aborted!");
                if(res.mul_co.length > 0){
                    var html = [];
                    for( i in res.mul_co){
                        html.push(createHTMLThumb(res.mul_co[i],i));   
                    }
                    show(mulco, html);
                }
                else{
                    hide(mulco);
                }
                
                
            }
        });
    } catch(e){
        log(e.message+", line"+e.lineNumber);
    } 
}//End functions to query the db


/**
 * Function that create the box for a single small preview and then fill it with the html canvas drawing.
 */
function createHTMLThumb(obj,i){
    var btn = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    btn.setAttribute("style","width:135px;  height: auto;text-align: center; position: relative;");
    btn.setAttribute("class", "ok-button");
    btn.setAttribute("type", "button");
    btn.setAttribute("onclick", "showPrev( \""+obj.name+"\", "+obj.DownVotes+", "+obj.UpVotes+", \""+obj.date+"\", \""+obj.usage+"\", \""+obj.Tags+"\", "+JSON.stringify(obj.json).toString()+", \""+obj.patternType+"\");");
    
    setSmallContainer(btn);
    switch (obj.patternType){
        case "pv":
            baseShiftPV = (SmallfixWidthPV+10)*i;
            drawSmallPV(obj.name, JSON.stringify(obj.json));
            break;
        case "comco":
            baseShiftComco = (SmallfixWidth+Smalldeltax)*i;
            drawSmallCompCo(obj.name, obj.json);
            break;
        case "mulco":
            baseShiftMulco = (SmallfixWidth)*i;
            drawSmallMulco(obj.name, obj.json);
            break;
            baseShift = 0;
    }
    
    return btn;
}

/**
 * Function that show thre preview panel.
 */
function showPrev(name, DownVotes, UpVotes, date, usage, Tagstring, json,type){
    
    //We get the container for informations
    var infoContainer = mainWindow.document.getElementById("infoContainer");
    
    //We remove the old results
    while(infoContainer.firstChild)
        infoContainer.removeChild(infoContainer.firstChild);
        
    //Every content should be after this
        
    var h3 = document.createElementNS("http://www.w3.org/1999/xhtml", "h4");
    h3.appendChild(document.createTextNode("Preview panel"));
    h3.setAttribute("class","yahoo-accordion-title-vert");
    infoContainer.appendChild(h3);
    
    infoContainer.appendChild(document.createTextNode("Created: "+date));
    infoContainer.appendChild(document.createElementNS("http://www.w3.org/1999/xhtml", "br"));
    infoContainer.appendChild(document.createTextNode("Used: "+usage));
    infoContainer.appendChild(document.createElementNS("http://www.w3.org/1999/xhtml", "br"));   
    
    var dynamicText = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    dynamicText.setAttribute("id", "dynamicText");
    dynamicText.setAttribute("class", "title");
    dynamicText.setAttribute("style", "overflow: auto");
    
    infoContainer.appendChild(dynamicText);   
    
    //We create the preview
    var preview = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    preview.setAttribute("class","previewPanel");
    infoContainer.appendChild(preview);
    setBigContainer(preview);
    preview.style.position = "relative";
    preview.style.left = "1px";
    clearPrev();
    switch (type){
        case "pv":
            drawBigPV(name,json);
            break;
        case "comco":
            drawBigCompCo(json);
            break;
        case "mulco":
            drawBigMulco(name, json);
            break;
    }
        
        

    
    //We create now the vote panel
    var voteContainer = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    voteContainer.setAttribute("class", "image_overlay");
    voteContainer.setAttribute("style", "text-align: center; visibility:none;");
    voteContainer.setAttribute("id", "vote1");
    
    
    var rating = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    rating.setAttribute("class", "rating");
    
    //The 2 buttons to vote
    var down = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    down.setAttribute("class", "down");
    down.setAttribute("id", "down1");
    down.addEventListener("click",function(){
        VoteDown(UpVotes, DownVotes, json, type);    
    },false);
    down.appendChild(document.createTextNode(""));
    
    var up = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    up.setAttribute("class", "up");
    up.setAttribute("id", "up1");
    up.addEventListener("click",function(){
        VoteUP(UpVotes, DownVotes, json, type);    
    },false);
    up.appendChild(document.createTextNode(""));
    
    //The div with percentages of votes
    var results = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    results.setAttribute("id", "favor_percent_268");
    results.setAttribute("class", "favor_percent");
    results.appendChild(document.createTextNode("Out of "));
    
    var num = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    num.setAttribute("id","num");
    num.setAttribute("style", "display:inline;");
    num.appendChild(document.createTextNode((DownVotes+UpVotes)));
    results.appendChild(num);
    
    results.appendChild(document.createTextNode(" votes, "));
    
    var per = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    per.setAttribute("id","per");
    per.setAttribute("style", "display:inline;");
    var tmp = (UpVotes*100)/(UpVotes+DownVotes);
    per.appendChild(document.createTextNode(tmp.toFixed(2)));
    results.appendChild(per);
    
    results.appendChild(document.createTextNode("% like this one."));
    
    //We populate the rating container
    rating.appendChild(down);
    rating.appendChild(up);
    rating.appendChild(results);
    
    voteContainer.appendChild(rating);
    infoContainer.appendChild(voteContainer);
    
    //We create the tag container
    var Tags = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    Tags.setAttribute("id", "Tags");
    Tags.appendChild(document.createTextNode("Tags: "));
    
    var TagsArray = Tagstring.split("#");
    for(i in TagsArray){
        if(TagsArray[i] != ""){
            var tmp = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
            tmp.setAttribute("class", "tag");
            tmp.appendChild(document.createTextNode(TagsArray[i]));
            Tags.appendChild(tmp);
            Tags.appendChild(document.createTextNode(", "));
        }
    }
    var maxWidth = infoContainer.style.width;
    infoContainer.appendChild(Tags);
    Tags.style.maxWidth = "270px";
    
}

/**
 * FUnctions to handle the vote of a partculat pattern
 */
function VoteUP(UpVotes, DownVotes, json, type)
{
    saveVote(json, "UpVotes", type, ++UpVotes);
    var num = mainWindow.document.getElementById('num');
    num.removeChild(num.firstChild);
    num.appendChild(document.createTextNode(UpVotes+DownVotes)); 
    
    var per = mainWindow.document.getElementById('per');
    var tmp = (UpVotes*100)/(UpVotes+DownVotes);
    per.removeChild(per.firstChild);
    per.appendChild(document.createTextNode(tmp.toFixed(2)));
    
    var up = mainWindow.document.getElementById('up1');
    up.addEventListener("click",function(){
        VoteUP(UpVotes, DownVotes, json, type);    
    },false);
    
    var down = mainWindow.document.getElementById('down1');
    down.addEventListener("click",function(){
        VoteDown(UpVotes, DownVotes, json, type);    
    },false);
}
         
function VoteDown(UpVotes, DownVotes, json, type)
{
    saveVote(json, "DownVotes", type, ++DownVotes);
    var num = mainWindow.document.getElementById('num');
    num.removeChild(num.firstChild);
    num.appendChild(document.createTextNode(UpVotes+DownVotes)); 
    
    var per = mainWindow.document.getElementById('per');
    var tmp = (UpVotes*100)/(UpVotes+DownVotes);
    per.removeChild(per.firstChild);
    per.appendChild(document.createTextNode(tmp.toFixed(2)));
    
    var up = mainWindow.document.getElementById('up1');
    up.addEventListener("click",function(){
        VoteUP(UpVotes, DownVotes, json, type);    
    },false);
    
    var down = mainWindow.document.getElementById('down1');
    down.addEventListener("click",function(){
        VoteDown(UpVotes, DownVotes, json, type);    
    },false);
}
