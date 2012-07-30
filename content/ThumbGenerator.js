
var body;
var prev;
var baseShiftPV = 0;
var baseShiftMulco = 0;
var baseShiftComco = 0;

//Const for small thumbnail
const SmallfixWidth = 70;
const SmallfixHeight = 25;
const SmallfixWidthPV = 115;
const SmallfixHeightPV = 45;
const SmallmaxWidthMulco = 150;
const Smalldeltax = 15;
const Smalldeltay = 45;

//Constants for big previews
const BigfixWidth = 150;
const BigfixHeight = 35;
const BigfixWidthPV = 180;
const BigfixHeightPV = 70;
const BigmaxWidthMulco = 250;
const Bigdeltax = 40;
const Bigdeltay = 50;

function weavePv(json){
    console.log("weavePV");
}

function weaveCompCo(json){
    console.log("weaveCompCo");
}

function weaveMulco(json){
    console.log("Mulco");
}

function setSmallContainer(obj){
	body = obj;
}
function setBigContainer(obj){
	prev= obj;
}

/**
 *
 *
 *      PART FOR SMALL THUMB
 *  
 *
 **/
//draws PV Thumbnails
function drawSmallPV(type,json){
    var div = createSmallDiv(type, type, drawBigPV, type, json, weavePv);
	json = JSON.parse(json);
	try{
		json = JSON.parse(json);
	} catch (e){
		unescape(json);
	};
	if(!json["conf"])
		return;
	conf = findKeysValues(json["conf"],type);
    for(var i in conf){
        if(conf[i].length > 5){
            var tmp = document.createElementNS("http://www.w3.org/1999/xhtml","a");
            tmp.appendChild(document.createTextNode(conf[i]));
            div.appendChild(tmp);
            div.appendChild(document.createElementNS("http://www.w3.org/1999/xhtml","br"));
        }
    }
	div.style.width = SmallfixWidthPV+"px";
	div.style.height = SmallfixHeightPV+"px";
	div.style.left = "15px";
	div.addEventListener("dblclick", function (){
		weavePvalue(type,JSON.stringify(json));
	},false);
}

//draws Compco Thumbnails
function drawSmallCompCo(name,json){
	try{
		json = JSON.parse(json);
	} catch (e){
		return;
	}
	try{
		var wire = json["wires"][0];
		var div1 = createSmallDiv(wire["src"]["moduleid"],wire["src"]["moduleid"],drawBigCompCo,JSON.stringify(json),null,weaveCompCo);
		var div2 = createSmallDiv(wire["tgt"]["moduleid"],wire["tgt"]["moduleid"],drawBigCompCo,JSON.stringify(json),null,weaveCompCo);
	}catch(e){
		log(e.message+" -> "+json);
	}
    
	/*div1.appendChild(document.createElementNS("http://www.w3.org/1999/xhtml", "br"));
	div2.appendChild(document.createElementNS("http://www.w3.org/1999/xhtml", "br"));*/
	
    var can = document.createElementNS("http://www.w3.org/1999/xhtml","canvas");    
    setSmallDivsPositions(div1,div2,1);
    setSmallCanvasProperties(can, div1, div2);
	div1.addEventListener("dblclick", function (){
		weaveCompCoo(name,JSON.stringify(json));
		},false);
	div2.addEventListener("dblclick", function (){
		weaveCompCoo(name,JSON.stringify(json));
		},false);
}

//function that draws mulco patterns
function drawSmallMulco (sourceComp, json){
    var divs = [];
    json = JSON.parse(json);
	var base = sourceComp;
    
    //We create all small thumbnail for each module
    for(i in json["modules"]){
        divs.push(createSmallDiv(json["modules"][i]["type"], json["modules"][i]["type"],drawBigMulco, sourceComp, JSON.stringify(json),weaveMulco));
    }
	for(var j in divs){
		divs[j].appendChild(document.createElementNS("http://www.w3.org/1999/xhtml", "br"));
		divs[j].addEventListener("dblclick", function (){
			weaveMultico(base,JSON.stringify(json));
		},false);
	}
    var level = 1;
    
    var tmp = [];
    var srcComp = getDivFromarray(divs,sourceComp);
    srcComp.setAttribute("level",level);
    tmp.push(srcComp);
    
    srcComp = tmp.pop();
    for(var k in json["modules"]){
        for(var i in json["wires"]){
            if(json["wires"][i]["src"]["moduleid"]== sourceComp){
                var tmpComp = getDivFromarray(divs,json["wires"][i]["tgt"]["moduleid"]);
				if(!tmpComp)
					tmpComp = createSmallDiv("Pipe Output");
                tmpComp.setAttribute("level",level);
				setSmallDivsPositions(srcComp, tmpComp,++level,level-parseInt(srcComp.getAttribute("level")));
                var can = document.createElementNS("http://www.w3.org/1999/xhtml","canvas");
                setSmallCanvasProperties(can,srcComp,tmpComp);
                tmp.push(tmpComp);
            }
        }
		
		
		if(!tmp[0])
			break;
		srcComp = tmp.pop();
        sourceComp = srcComp.getAttribute("compType");
    }

  
}

//Function that sets labels' prperties for titles
function setSmallLabelsProperties(label, text){
    label.style.backgroundColor = "#4EA1E6";
    label.style.overflow = "hidden";
    label.style.position = "relative";
    label.style.top = "0px";
    label.style.fontSize = "9px";
    label.appendChild(document.createTextNode(translateFromTypeToName(text)));
    label.style.textAlign = "left";
}

//Default properties for each thumbnail div
function setSmallDivsProperties(div){
    div.style.position = "absolute";
	div.style.textAlign = "left";
    div.style.border ="2px solid #4EA1E6";
    div.style.setProperty("border-radius", "5px", "");
    div.style.height = SmallfixHeight+"px";
    div.style.width = SmallfixWidth+"px";
    div.style.overflow = "hidden";
    div.style.backgroundColor = "white";
    div.style.fontSize = "9px";
	div.style.left = "15px";
	div.style.zIndex= 101;
    div.style.fontFamily = "sans-serif";
	
    div.setAttribute("onSelectStart", "return false;");
    div.setAttribute("onContextMenu", "return false;");

}

//Function that sets the position of the successive elements
function setSmallDivsPositions(parentDiv, childDiv, generation){
	if(!childDiv){
		childDiv = createSmallDiv("Pipe Output");
	}
    var level = arguments[3];
    if(!level)
        level = 1;
	var offx = 0;
	var offy = 0;
	if(parentDiv){
		offx = parseInt(parentDiv.style.left);
		offy = parseInt(parentDiv.style.top) + Smalldeltay*level;
	}

    childDiv.style.top = offy+"px";
    if(generation%2 == 0){
		childDiv.style.left = (offx-Smalldeltax)+"px";
    }else{
		childDiv.style.left = (offx+Smalldeltax)+"px";
    }
}

//Function that creates a div with style and label
function createSmallDiv(text, compType){
    var div = document.createElementNS("http://www.w3.org/1999/xhtml","div");
    var label = document.createElementNS("http://www.w3.org/1999/xhtml","div");
    div.setAttribute("compType", compType);
    var fun = arguments[2];
    var type = arguments[3];
    var json = arguments[4];
    var funDblClick = arguments[5];

    div.addEventListener("dblclick", function (){
        if(json)
            funDblClick(json);
        else
            funDblClick(type);
    },false);
    body.appendChild(div);
	div.style.top = "5px";
	div.appendChild(label);
	//div.style.left = parseInt(body.style.width)/2-(parseInt(body.style.width)/2);
	setSmallDivsProperties(div);
	setSmallLabelsProperties(label, text);
    return div;
}

/**
 *
 *
 *      BIG PREVIEW PART
 *
 *
 *
 **/

//draws PV Thumbnails
function drawBigPV(type,json){
    
    if(!arguments[2]){
        var fun = weavePv;
        var jsonCall = json;
    } else{
        var fun = arguments[2];
        var jsonCall = arguments[3];
    }
    var div = createBigDiv(type, type,fun, jsonCall);
    div.setAttribute("comptype",type);
    json = JSON.parse(json)["conf"];
	json = findKeysValues(json, type);
    
	for(var i in json){
		var text = json[i];
		var tmp = document.createElementNS("http://www.w3.org/1999/xhtml","a");
		tmp.appendChild(document.createTextNode(text));
		div.appendChild(tmp);
		div.appendChild(document.createElementNS("http://www.w3.org/1999/xhtml","br"));
	}


	div.addEventListener("mouseover", function(){
			div.style.height ="auto";
			div.style.zIndex = 102;
		},false);
		

	
	if(arguments[2]){
		if(div.childNodes.length < 2){
			div.style.height = BigfixHeight+"px";
		}
		div.addEventListener("mouseout", function(){
			div.style.height =BigfixHeight+"px";
			div.style.zIndex =101;
		},false);
        return div;
    }
	div.addEventListener("mouseout", function(){
			div.style.height =BigfixHeightPV+"px";
			div.style.zIndex =101;
		},false);
	div.style.left = "45px";
	div.style.height =BigfixHeightPV+"px";
	div.style.width =BigfixWidthPV+"px";
	return null;
}

//draws Compco Thumbnails
function drawBigCompCo(json){
    
    json = JSON.parse(json);
    var wire = json["wires"][0];
    //var div1 = createBigDiv(wire["src"]["moduleid"]);
    var div1 = drawBigPV(wire["src"]["moduleid"], getJSONOfComponent(wire["src"]["moduleid"],json),weaveCompCo, json);
    var div2 = drawBigPV(wire["tgt"]["moduleid"], getJSONOfComponent(wire["tgt"]["moduleid"],json),weaveCompCo, json); 


    var can = document.createElementNS("http://www.w3.org/1999/xhtml","canvas");
	setBigDivsPositions(div1, div2, 1);
    setBigCanvasProperties(can, div1, div2);
}

//function that draws mulco patterns
function drawBigMulco (sourceComp, json){
    
    var divs = [];
    json = JSON.parse(json);
    
    //We create all Big thumbnail for each module
    for(i in json["modules"]){
        divs.push(drawBigPV(json["modules"][i]["type"], JSON.stringify(json["modules"][i]) ,weaveMulco, json));

    }
    
    
    var level = 1;
    
    var tmp = [];
    var srcComp = getDivFromarray(divs,sourceComp);
    srcComp.setAttribute("level",level);
    tmp.push(srcComp);
    
    srcComp = tmp.pop();
    for(var k in json["modules"]){
        
        for(var i in json["wires"]){
            if(json["wires"][i]["src"]["moduleid"]== sourceComp){
                var tmpComp = getDivFromarray(divs,json["wires"][i]["tgt"]["moduleid"]);
				if(!tmpComp)
					tmpComp = createBigDiv("Pipe Output");
                setBigDivsPositions(srcComp, tmpComp,++level,level-parseInt(srcComp.getAttribute("level")));
                tmpComp.setAttribute("level",level);
                var can = document.createElementNS("http://www.w3.org/1999/xhtml","canvas");
                can.style.position = "absolute";
                setBigCanvasProperties(can,srcComp,tmpComp);
                tmp.push(tmpComp);
            }
        }
        if(!tmp[0])
            break;
        srcComp = tmp.pop();
        sourceComp = srcComp.getAttribute("compType");
    }


}

//Function that sets labels' prperties for titles
function setBigLabelsProperties(label, text){
    label.style.backgroundColor = "#4EA1E6";
    label.style.overflow = "hidden";
    label.style.position = "relative";
    label.style.top = "0px";
    label.style.fontSize = "13px";
    label.appendChild(document.createTextNode(translateFromTypeToName(text)));
    label.style.textAlign = "left";
	
	
}

//Default properties for each thumbnail div
function setBigDivsProperties(div){
	div.style.position = "absolute";
	div.style.textAlign = "left";
    div.style.border ="2px solid #4EA1E6";
    div.style.setProperty("border-radius", "5px", "");
    div.style.height = BigfixHeight+"px";
    div.style.width = BigfixWidth+"px";
    div.style.overflow = "hidden";
    div.style.backgroundColor = "white";
    div.style.fontSize = "10px";
	div.style.left = 48+"px";
	div.style.zIndex= 101;
    div.style.fontFamily = "sans-serif";
	
	
    div.setAttribute("onSelectStart", "return false;");
    div.setAttribute("onContextMenu", "return false;");
    
}

//Function that sets the position of the successive elements ( need to be imporved for multico)
function setBigDivsPositions(parentDiv, childDiv, generation){
	if(!childDiv){
		childDiv = createBigDiv("Pipe Output");
	}
    var level = arguments[3];
    if(!level)
        level = 1;
	var height = parseInt(parentDiv.style.height);
    var offx = parseInt(parentDiv.style.left);
    var offy = parseInt(parentDiv.style.top) + Bigdeltay*level+(height-BigfixHeight);
	log(height+" "+offx+" "+offy+" of"+parentDiv.getAttribute("compType"));
    childDiv.style.top = offy+"px";
    if(generation%2 == 0){
		childDiv.style.left = (offx-Bigdeltax)+"px";
    }else{
		childDiv.style.left = (offx+Bigdeltax)+"px";
    }
}

//Function that creates a div with style and label
function createBigDiv(text){
    var div = document.createElementNS("http://www.w3.org/1999/xhtml","div");
    var label = document.createElementNS("http://www.w3.org/1999/xhtml","div");
	prev.appendChild(div);
	div.appendChild(label);
	
    setBigDivsProperties(div);
    setBigLabelsProperties(label, text);
    if(arguments[1])
        div.setAttribute("compType", text);
    if(arguments[2]){
        var fun = arguments[2];
        var json = arguments[3];
    }
    else{
        var fun = function(){console.log("dblclick")};
    }
	
    div.addEventListener("dblclick",function(){fun(json);},true);
    div.style.top = "15px";

    return div;
}


/**
 *
 *
 *      COMMON FUNCTIONS
 *
 **/
//Recursive function to find all the obj with keys == "value" inside a JSON Obj. Returns an array String
function findKeysValues(json, type){
	var tmp = [];
	
	switch(type){
		
		case "filter":
			var condition = json.COMBINE.value;
			if (condition == "and")
				condition = "any";
			else
				condition = "at least one"
			tmp.push(json.MODE.value + " items that match "+condition+" of the following :"  );
			var rules = json.RULE;
			if(typeof(rules[0]) == "undefined")
				rules = [rules];
			for(var i in rules){
				var rule = rules[i];
				try{
					var field = rule.field.value;
					var op = rule.op.value;
					var value = rule.value.value;
				 } catch(e){
					continue;
				 }
				if(!field || !value)
					continue;
				//Means the everything is allright and we can add the string to the preview. We can modify it
				if(op == "doesnotcontain")
					op = "does not contain";
				if(op == "greater")
					op = "is greater than";
				if(op == "less")
					op = "is less than";
				
				tmp.push(field+" "+op+" "+value);
			}
			break;
		
		case "loop":
			var embed = json.embed.value;
			tmp.push("This loop component embed a component "+embed.type+" configured as: ");
			tmp = tmp.concat(findKeysValues(embed, embed.type));
			
			break;
		
		default:
			
			try{
				var keys = Object.keys(json);
			} catch(e){
				tmp.push(json);
				return;
			}
			for(var i in keys){
				var string = json[keys[i]];
				if(typeof(string)== "object"){
					tmp = tmp.concat(findKeysValues(string, type));
				}
				else{
					//Filter to information that will be displayed
					if(string.length > 3 && string != "output" && string != "terminal" && string != "text")
						tmp.push(string);
				}
			}
			break;
		

	}
	return tmp;
	
}




//This function consume one element into the array of components
function getDivFromarray(array,type){
    var comp;
    for(var i in array){
        if(array[i].getAttribute("compType") == type){
            comp = array[i];
            array.splice(i,1);
            break;
        }
    }
    return comp;
}

//create width, height and position of the canvas
function setSmallCanvasProperties(can, div1, div2){
	var x1 = SmallfixWidth;
	var y1 = SmallfixHeight;
	var offx1 = 0;
	var offy1 = 0;
	
	if(div1){
		x1 = parseInt(div1.style.width);
		y1 = parseInt(div1.style.height);
		offx1 = parseInt(div1.style.left);
		offy1 = parseInt(div1.style.top);
	}
    
    var x2 = parseInt(div2.style.width);
    var y2 = parseInt(div2.style.height);

    
    
    var offx2 = parseInt(div2.style.left);
    var offy2 = parseInt(div2.style.top);
	
	
    
    var leftToRight = (offx1+x1/2)<(offx2+x2/2);
	body.appendChild(can);
    can.style.top = (offy1+y1+2)+"px";
	can.style.position = "absolute";
    can.style.zIndex = 100;

    if(leftToRight){
        can.style.left = Math.floor(x1/2+offx1)+"px";
        can.setAttribute("width", Smalldeltax+"px");
        can.setAttribute("height", Math.abs(offy2-(offy1+y1)));
        drawSmallWires(can, true);   
    } else{
        can.style.left = (offx2+x2/2)+"px";
        can.setAttribute("width", Smalldeltax+"px");
        can.setAttribute("height", Math.abs(offy2-(offy1+y1)));
        drawSmallWires(can, false);
    }

}
//create width, height and position of the canvas
function setBigCanvasProperties(can, div1, div2){
    var x1 = parseInt(div1.style.width);
    var y1 = parseInt(div1.style.height);
    
    var x2 = parseInt(div2.style.width);
    var y2 = parseInt(div2.style.height);

    var offx1 = parseInt(div1.style.left);
    var offy1 = parseInt(div1.style.top);
    
    var offx2 = parseInt(div2.style.left);
    var offy2 = parseInt(div2.style.top);
    
	log(x1+" "+y1+" "+x2+" "+y2+" "+offx1+" "+offy1+" "+offx2+" "+offy2);
	
    var leftToRight = (offx1+x1/2)<(offx2+x2/2);
	prev.appendChild(can);
    can.style.top = (offy1+y1+2)+"px";
	can.style.position = "absolute";
    can.style.zIndex = 100;

    if(leftToRight){
        can.style.left = Math.floor(x1/2+offx1)+"px";
        can.setAttribute("width", Bigdeltax+"px");
        can.setAttribute("height", Math.abs(offy2-(offy1+y1)));
        drawBigWires(can, true);   
    } else{
        can.style.left = (offx2+x2/2)+"px";
        can.setAttribute("width", Bigdeltax+"px");
        can.setAttribute("height", Math.abs(offy2-(offy1+y1)));
        drawBigWires(can, false);
    }

}

//Function that draw wires from corner to corner of the canvas
function drawSmallWires(can, leftToRight){
    var ctx=can.getContext("2d");
    var height = parseInt(can.getAttribute("height"));
    var width = parseInt(can.getAttribute("width"));
    ctx.beginPath();
    if(leftToRight){
        ctx.moveTo(0,0);
        ctx.lineTo(width,height);
    }
    else{
        ctx.moveTo(width,0);
        ctx.lineTo(0,height);
    }
    ctx.strokeStyle="rgba(78, 161, 230, 0.6)";
    ctx.lineWidth = 2;
    ctx.closePath();
    ctx.stroke();
}

//Function that draw wires from corner to corner of the canvas
function drawBigWires(can, leftToRight){
    var ctx=can.getContext("2d");
    var height = parseInt(can.getAttribute("height"));
    var width = parseInt(can.getAttribute("width"));
    ctx.beginPath();
    if(leftToRight){
        ctx.moveTo(0,0);
        ctx.lineTo(width,height);
    }
    else{
        ctx.moveTo(width,0);
        ctx.lineTo(0,height);
    }
    ctx.strokeStyle="rgba(78, 161, 230, 0.7)";
    ctx.lineWidth = 2;
    ctx.closePath();
    ctx.stroke();
}


function getJSONOfComponent(Comp, json){
    for( var i in json["modules"]){
        if(json["modules"][i]["type"] == Comp)
            return JSON.stringify(json["modules"][i]);
    }
    return null;
}
function clearPrev(){
    while(prev.firstChild){
        prev.removeChild(prev.firstChild);
    }
}
function clearObj(obj){
    while(obj.firstChild){
        obj.removeChild(obj.firstChild);
    }
}
