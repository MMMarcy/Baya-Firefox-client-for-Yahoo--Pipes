/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


//Weaver weaves the selected patterns into the current pm. It contains set of basic weaving strategies which consist of mashup operations, called in sequence for each pattern types.

 
//weave parameter value pattern; input cp is the selected parameter value pattern 

function weavePvalue(ComponentType,cp)
{
    cp = JSON.parse(cp);
    var lastPM = session.pm.pop();
    var modules = lastPM.modules;
    var isPresent = false;
    for(var i in modules){
      if(modules[i].type == ComponentType){
        modules[i].conf = cp.conf;
        isPresent = true;
        var isInLayout = false;
        for(var k in lastPM.layout){
          if(lastPM.layout[k].id == modules[i].id){
            isInLayout = true;
            break;
          }
        }
        if(!isInLayout){
          lastPM.layout.push({"id":modules[i].id,"xy":[Math.floor(Math.random()*1000),Math.floor(Math.random()*1000)]});
        }
        break;
      }
    }
    if(!isPresent){
      var id = setComponentID();
      log("adding Layout");
      lastPM.layout.push({"id":id,"xy":[Math.floor(Math.random()*1000),Math.floor(Math.random()*1000)]});
      modules.push({"type": ComponentType,"id":id,"conf":cp.conf});
      
    }
    session.lastComp = ComponentType;
    session.pm.push(lastPM);
    //if the call come from a weaving action it weaves, if it's used by compCo or Mulco not
    if(!arguments[2]){
      var str  ="";
      str += "_out=json";
      str += "&id="+session.id;
      str += "&name="+session.name;
      if(session.tags)
          str += "&tags="+session.tags;
      str += "&_def="+escape(JSON.stringify(session.pm[session.pm.length-1]));
      str += "&rnd="+session.rnd;
      str += "&.crumb="+session.crumb;
      savePattern(str);
    }

} 

//Process in two steps. i chech the 2 modules calling PV. If they are not present will be added by the call. They i will add the wire that link the 2 components.
function weaveCompCoo(ComponentType,cp)
{
  cp = JSON.parse(cp);
  
  //Add modules if needed
  for(var i in cp.modules){
    weavePvalue(cp.modules[i].type,JSON.stringify(cp.modules[i]), false);
  }
  var wire = cp.wires[0];
  var lastPM = session.pm.pop();
  var modules = lastPM.modules;
  //Set the wire
  for(var i in modules){
    if(modules[i].type == wire.src.moduleid){
      wire.src.moduleid = modules[i].id;
      continue;
    }
    if(modules[i].type == wire.tgt.moduleid){
      wire.tgt.moduleid = modules[i].id;
      continue;
    }
  }
  //Add the wire to the pm
  lastPM.wires.push(wire);
  
  
  session.lastComp = ComponentType;
  session.pm.push(lastPM);
  //if the call come from a weaving action it weaves, if it's used by Mulco id doesn't
  if(!arguments[2]){
    var str  ="";
    str += "_out=json";
    str += "&id="+session.id;
    str += "&name="+session.name;
    if(session.tags)
        str += "&tags="+session.tags;
    str += "&_def="+escape(JSON.stringify(session.pm[session.pm.length-1]));
    str += "&rnd="+session.rnd;
    str += "&.crumb="+session.crumb;
    savePattern(str);
  }
  
}


//function to weave multi-component pattern

function weaveMultico(ComponentType,cp)
{
    cp = JSON.parse(cp);
    try{
       
        var srcComponentID;
               
        if(session.pm[session.pm.length-1].layout.length < 2)
        {
            //set id for the newly added component, other than the default output component 
            var cid = setComponentID();
          
            session.pm.push(JSON.parse('{"layout":[{"id":\"'+cid+'\","xy":[260,115]},{"id":"_OUTPUT","xy":[626,454]}],"modules":[{"type":\"'+ComponentType+'\",\"id":\"'+cid+'\","conf":{"BASE":{"value":"","type":""},"PORT":{"value":"","type":""},"PATH":{"value":"","type":""},"PARAM":[{"key":{"value":"","type":""},"value":{"value":"","type":""}}]}},{"type":"output","id":"_OUTPUT","conf":{}}],"terminaldata":[],"wires":[]}'));
        }

        //To get the modules length
        var tmp = session.pm.pop();
        log("temp JSON is >>>>>>>>>>>>> "+JSON.stringify(tmp));
        var mlength= tmp.modules.length;
        session.pm.push(tmp);
        var ln;
        log("we are in the conflict situation part and we are adding a new component: session module is ---"+ session.pm[session.pm.length-1].modules[mlength-2].type+"last component is "+session.pm[session.pm.length-1].modules[mlength-1].type+"and cp module is---->"+cp.modules[0].type+"mlenght is "+mlength);
        //for the first insertion
        if(mlength==2)
        {
            
            ln=mlength-2;
        }
        //for the remainings..
        else if(mlength>2)
        {
            ln=mlength-1;
        }
        
        //conflict happens if the last component in pm is same as the first component in cp 
        if(session.pm[session.pm.length-1].modules[ln].type==cp.modules[0].type)
        {
       
        
        
            srcComponentID = session.pm[session.pm.length-1].modules[ln].id;
            //delete the existing component by overwriting the modules with the modules in cp
            session.pm[session.pm.length-1].modules[ln].conf=cp.modules[0].conf;
        //we retain the old layout and all incoming wires to the existing component
       
        }
       
        else if(session.pm[session.pm.length-1].modules[ln].type!=cp.modules[0].type)
        {
            srcComponentID = setComponentID();
            addComponent(srcComponentID,cp.modules[0]);
         
       
       
        }

        //many components inside the retrieved pattern requires a loop for the assignment of ids; we assign ids for all the components except the source.
        cp.modules[0].id = srcComponentID;
        for( var k=1; k < cp.modules.length-1; k++)
        {
            cp.modules[k].id = setComponentID();
        }
        
        
        
       
        // wires id management inside cp
        var wireJson= cp.wires;
        var wlength= session.pm[session.pm.length-1].wires.length;
        

        var wid;
        if (wlength < 1)
        {
         
            wid =1;
        }
        else wid=wlength*2-1;
       
       
        for(var k=0;k < wireJson.length;k++)
        {

            wireJson[k].id="_w"+wid;
            wid=wid+2;
         
        }
      
   
         


        //add new component, this comes along with the value assignment and data mapping
        for(var k=1; k< cp.modules.length; k++)
        {
            tgtComponentID = setComponentID();
        
            addComponent(cp.modules[k].id, cp.modules[k]);
        }
        //addconnector
        
        for(var m=0; m< wireJson.length; m++)
        { 
            for(var n=0; n< cp.modules.length; n++)
            {
        
                if ((wireJson[m].src.moduleid==cp.modules[n].type)||(wireJson[m].tgt.moduleid==cp.modules[n].type))
                {
                    if (wireJson[m].src.moduleid==cp.modules[n].type) 
                        wireJson[m].src.moduleid = cp.modules[n].id;
                    //addConnector(srcComponentID, tgtComponentID, wireJson);
         
                    else wireJson[m].tgt.moduleid = cp.modules[n].id;
                // log(" (wireJson[m].src.moduleid==cp.modules[n].type) where src.moduleid is="+ wireJson[m].src.moduleid+"and target module id for wire is "+wireJson[m].tgt.moduleid);
                }//if 
            }//for n
        }//for m 
        
        for(var m=0; m< wireJson.length; m++)
        {
            //log("before addconnector in multi@@@@@@@@@@@@@@@@@ src id-->"+ JSON.stringify(wireJson[m].src.moduleid)+"target id-->"+ JSON.stringify(wireJson[m].tgt.moduleid)+"json is -->"+JSON.stringify(wireJson[m]));
            addConnector(wireJson[m].src.moduleid, wireJson[m].tgt.moduleid, wireJson[m]);
        
        }

        
        //log(JSON.stringify(session.pm[session.pm.length-1]);
        //TODO: now we also need to send back this modified pm back to server.
        var str  ="";
        str += "_out=json";
        str += "&id="+session.id;
        str += "&name="+session.name;
        if(session.tags)
            str += "&tags="+session.tags;
        //str += "&_def="+JSON.stringify(session.pm[session.pm.length-1]);
        str += "&_def="+escape(JSON.stringify(session.pm[session.pm.length-1]));
        str += "&rnd="+session.rnd;
        str += "&.crumb="+session.crumb;
        savePattern(str);
        //log("the sent string for multi pattern is ----->"+str); 
        
        return;
    } catch (e) {
        log(e.message+", "+e.lineNumber);
    }
}








//function to set newly added component ID

function setComponentID()
{
    log("dentro setComponentId");
    var randomnumber=Math.floor(Math.random()*101);
    var cid="sw-"+randomnumber;
    return cid;
}

