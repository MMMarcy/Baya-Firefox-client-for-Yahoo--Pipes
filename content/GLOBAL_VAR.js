//Class for remember the session params
function Session(){
    this.name = null;
    this.crumb = null;
    this.tags = null;
    this.rnd = null;
    this.pm = []; //Pms
    this.id = null;
    this.customReq = false; //Used for avoid intercepting saves request made by baya
    this.lastComp = null;
}

var session = new Session();

function DbRes (){
    this.name = "";
    this.json = "";
    this.html = "";
    this.smallThumb ="";
    this.bigThumb ="";
    this.downVotes ="";
    this.upVotes ="";
    this.usage ="";
    this.tags = ""; 
    this.date ="";
    this.patternType ="";

}
function Res(){
    this.pv = [];
    this.co_occ = [];
    this.comp_co = [];
    this.dm = [];
    this.multi = [];
}
var res = new Res();

var parval;
var compco;
var mulco;

var cover;
var baya;
var prex =130;
var prey=130;
