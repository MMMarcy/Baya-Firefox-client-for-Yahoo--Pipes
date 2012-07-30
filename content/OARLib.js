var processByOARLib = function (component, type, action){
    log("Inside OARLIB: "+ component.type+" "+type+" "+action);
    switch (true){
        case (type == "module" && action == "add"):
            getPvList(component.type, "");
            getComCoList(component.type);
            getMulcoList(component.type);
            //multi = getMulti(component.type);            
            break;
        
        case (type == "module" && action == "remove"):
            break;
        
        case (type == "module" && action == "focus"):
            getPvList(component.type, "");
            getComCoList(component.type);
            getMulcoList(component.type);
            log("focus on component "+component.type);
            break;
        
        case (type == "wire" && action == "add"):
            break;
        
        case (type == "wire" && action == "remove"):
            break;
        
        case (type == "pattern" && action == "weaved"):
            break;
        
        case (type == "pattern" && action == "undo"):
            break;
        
    } 
}
