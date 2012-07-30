//This includes all the operations related to mashup composition 

var cid = 0;

var wid=0;
var i=1;
var j=0;


//get the current object in the canvas

var Object = getCurrentObject();


//get the current partial mashup

var pm = getPartialMashup();

//get JSON object for the current selected component denoted by cid 
function getObjectType(cid)
{

for (var k =0; k < session.pm[session.pm.length-1].modules.length; k++)
{ 
  if (session.pm[session.pm.length-1].modules[k].id == cid) 
   {
     return session.pm[session.pm.length-1].modules[k].type;
   }
 }
 return null;
}

// function to assign parameter value

function assignValues(cid, Val)
{
log("iside assign Values");
//get the type of the component with id cid for which the parameter value will be set
 var m=0;
 var ObjectType = getObjectType(cid);
 
 for(var k=0; k < session.pm[session.pm.length-1].modules.length; k++)
 {
   if(session.pm[session.pm.length-1].modules[k].type == ObjectType)
   {
     m=k;
     break;
   }
  
 }
//assign the parameter value from the selected pattern to the pm
 
session.pm[session.pm.length-1].modules[m].conf = Val;
 
 return null;


}

//for the demo add component has parameter value assignment and data mapping defined inside the component json.
function addComponent(ComponentID, componentjson)
{
  var x;
  var y;

   var tmp = session.pm.pop();
   //now little bit of layout management
   var ln= session.pm[session.pm.length-1].modules.length;
   if (ln==0)
   {
     x=prex;
     y=prey;
    
   }
   else if (ln==1)
   {
     x=prex;
     y=prey;
   }
   
   else if(ln%2 == 0)
   {
     x=prex+450;
     y=prey;
   } 
   else 
   {
     x=prex-400;
     y=prey+200;
   }
   log("JSON Component Id is: "+ComponentID);
   tmp.layout.push(JSON.parse('{"id": \"'+ComponentID+'\","xy":['+x+','+y+']}'));
   prex=x;
   prey=y;
   log("prex, prey============="+prex+","+prey);
   tmp.modules.push(componentjson);
   session.pm.push(tmp);
   session.lastComp = componentjson.type; 
   return null;

}


//for the demo add connector connects two component and update the wire information as in pm.
/*
*@param wireJson is the container for wires obtained from the knowledge base
*/
function addConnector(srcCompID, tgtCompID, wireJson)
{
    var tmp = session.pm.pop();
    //var wire = wireJson.pop();
    wireJson.src.moduleid = srcCompID;
    wireJson.tgt.moduleid = tgtCompID;
    tmp.wires.push(wireJson);
    session.pm.push(tmp);
    return null;

}

//now delete functions 

//delete parameter value for a selected component with id cid
function deleteAllValues(cid)
{
var m=0;

 for(var k=0; k < pm.modules.length; k++)
 {
   if(pm.modules[k].id == cid)
   {
     m=k;
     break;
   }
  
 } 
 //intialize all the existing value with null
 pm.modules[m].conf= new Array();
 return;

}

//delete Component with id cid from pm 
function deleteComponent(cid)
{
var m=0;
 //delete the module from pm
 for(var k=0; k < pm.modules.length; k++)
 {
   if(pm.modules[k].id == cid)
   {
     m=k;
     break;
   }
  
 } 

 delete pm.modules[m];
 //delete the wires from pm 
 for(var k=0; k < pm.wires.length; k++)
 {
   if((pm.wires[k].src[0].moduleid == cid)||(pm.wires[k].tgt[0].moduleid == cid))
   {
      m=k;
      delete pm.wires[k];
     
   }
  
 }
 
  //delete the module from layout
   for(var k=0; k < pm.layout.length; k++)
 {
   if(pm.layout[k].id == cid)
   {
      m=k;
      break;
      
   }
 }
  
 delete pm.layout[m];
 return;

}