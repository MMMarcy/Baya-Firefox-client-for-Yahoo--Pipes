var findDiff = function()
{
    if(session.pm.length > 1){
        var actual = session.pm[session.pm.length-1];              
        var old = session.pm[session.pm.length-2];
        //log("actual length= "+(actual.modules.length));
        //log("actual old= "+(old.modules.length));
        //First we look for difference in component numbers to see if a component has been added
        var diff = (actual.modules.length)-(old.modules.length);
        switch(diff){
            case 1:
                //TODO: have to check if the last component is the _OUTPUT
                //var comp = actual.modules[actual.modules.length-1];
                //log("a component has been added");
                /*if(comp.type != "output")
                    processByOARLib(comp, "module", "add");
                else{
                    comp = actual.module[actual.module.length-2];
                    if(comp)
                        processByOARLib(comp, "module", "add");
                }*/
                break;
            case 0:
                //log("a wire or something else has taken place");
                //We now want to see if a wire has been added or removed
                findWiresDiff(actual, old);
                break;
            case -1:
                //log("a component has been removed");
                break;
            default:
                //If we are here a multicomponent, a co-coccurrence weave has taken place or a one of them has been undo.
                //we have to decide the policy in above cases
                break;
        }
    }
    else{

    }
};

var findWiresDiff = function (actual, old){
    
};

//Add update listeners to document.
function addListeners(){
    try{
        mainWindow.document.removeEventListener("keyup", keyup, false);
        mainWindow.document.removeEventListener("DOMNodeInserted", domNodeInserted, false);
        mainWindow.document.removeEventListener("click", click, false);

    }
    catch(e){
        logE(e);
    }finally{
        mainWindow.document.addEventListener("keyup", keyup, false, true);
        mainWindow.document.addEventListener("DOMNodeInserted", domNodeInserted, false, true);
        mainWindow.document.addEventListener("click", click, false, true);
        
        parval = document.getElementById("parval");
        compco = document.getElementById("Comco");
        mulco = document.getElementById("Commul");
        
        //Fucntion that will be called after each weaving ( not the one that wires with the _OUTPUT)
        if(session.lastComp){
            getPvList(session.lastComp, "");
            getComCoList(session.lastComp);
            getMulcoList(session.lastComp);

        }
    }
}

/**
 *
 * Event handler for keyup, click, nodeInserted...
 *
 */
function keyup(evt){   
    if(evt.explicitOriginalTarget == "[object HTMLInputElement]" || evt.explicitOriginalTarget == "[object HTMLTextAreaElement]" ){
        var el = getCompFromInputClick(evt.explicitOriginalTarget)

        getPvList(translateFromNameToType(el), evt.explicitOriginalTarget.value);
    }   
}

function click(evt){
    //printTime("click");
    var title = getCompFromInputClick(evt.explicitOriginalTarget);
    if(title){
        var title = translateFromNameToType(title);
        if(!title)
            title = "undefined";
        
        getPvList(title, "");
        getComCoList(title);
        getMulcoList(title);
    }
}

function domNodeInserted(evt){
    
    var obj = evt.explicitOriginalTarget;
        
        try{            
        if(obj.getAttribute("ismodule") && !session.lastComp){
            //printTime("drop");
            var a = obj.firstChild.firstChild.firstChild.firstChild;
            var l =a.innerHTML.lastIndexOf("<");
            var k=a.innerHTML.lastIndexOf(">",l);
            a=a.innerHTML.substring(k+1,l);
            getPvList(a, "");
            getComCoList(a);
            getMulcoList(a);      
        }
    } catch (e){
        
    }
}
/**
 * End event handlers
 */


/**
 *
 *
 * Functions to handle each display result box
 *
 */

function show(element, html)
{
  
    try{
        element.className="yahoo-accordion-title-vert hide";
        //for mozilla whitespace problem
        var nSibling = element.nextSibling.nextSibling;
                
        var buttonbox = nSibling.childNodes[1].childNodes[1];
        while(buttonbox.firstChild){
            buttonbox.removeChild(buttonbox.firstChild);
        }
        
        var pad = 135;
        for ( i in html) {
            buttonbox.appendChild(html[i]);
            html[i].style.left = (pad*i)+"px";
        }
        nSibling.style.display="block";
    } catch (e){
        logE(e);
    }

}

function hide(element)
{

        element.className="yahoo-accordion-title-vert show";
        //for mozilla whitespace problem
        var nSibling = element.nextSibling.nextSibling;
        var buttonbox = nSibling.childNodes[1].childNodes[1];
        while(buttonbox.firstChild){
            buttonbox.removeChild(buttonbox.firstChild);
        }
        var nSibling = element.nextSibling.nextSibling;
        nSibling.style.display="none";

              
}

function showHide(element)
{    
    if (element.className=="yahoo-accordion-title-vert show") 
    {
        element.className="yahoo-accordion-title-vert hide";
        //for mozilla whitespace problem
        var nSibling = element.nextSibling.nextSibling;
        nSibling.style.display="block";
        var buttonbox = nSibling.childNodes[1].childNodes[1];
        if(!buttonbox.hasChildNodes()){
            var span = document.createElementNS("http://www.w3.org/1999/xhtml","span");
            span.appendChild(document.createTextNode("No results available"));
            span.setAttribute("style", "color: red;");
            buttonbox.appendChild(span);
        }
        
        
    }
    else{
        element.className="yahoo-accordion-title-vert show";
        //for mozilla whitespace problem
        var nSibling = element.nextSibling.nextSibling;
        nSibling.style.display="none";
    }
}


 

/**
 *
 * Functions to traverse the dom note to get the 'parent' component
 */
function getCompFromInputClick(htmlObj){
    session.lastComp = null;
    try{
        if(htmlObj.getAttribute("ismodule") === "true"){
            var html = recParsingTitle(htmlObj);
            return html;
        }
        else
            if(htmlObj.parentNode.getAttribute("id") === "editcontainer10")
                throw "Exception";
            return getCompFromInputClick(htmlObj.parentNode);
    } catch (e){
        return null;
    }
}
    
function recParsingTitle(obj){
    var tmp = null;
    try{
        if( obj.getAttribute("class") === "title"){
            tmp =  obj.innerHTML;
        }
        else{
            for(i in obj.childNodes){
                tmp = recParsingTitle(obj.childNodes[i]);
                if(tmp)
                    break;
            }
        }
    } catch(err){
        return null;
    }
    return tmp;          
}

function displayExplenation(obj){
    
    var infoContainer = mainWindow.document.getElementById("infoContainer");
    
    //Cleaning the panel
    while(infoContainer.firstChild){
        infoContainer.removeChild(infoContainer.firstChild);
    } 
    
    //Title of the status panel
    var h3 = document.createElementNS("http://www.w3.org/1999/xhtml", "h4");
    h3.appendChild(document.createTextNode("Explenation"));
    h3.setAttribute("class","yahoo-accordion-title-vert");
    infoContainer.appendChild(h3);
    var text = document.createElementNS("http://www.w3.org/1999/xhtml", "span");
    infoContainer.appendChild(text);
    text.appendChild(document.createTextNode(obj.title));
    
    
}

