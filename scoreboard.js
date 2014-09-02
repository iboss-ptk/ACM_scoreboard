var app = angular.module('scoreboard', []);
var controllers = {};

controllers.scoreboardCtrl = function ($scope) {

	//score data must be replaced later
    xmlDoc=loadXMLDoc("results-before.xml");
    score_before = xmlToJson(xmlDoc);
    $scope.header = getProblemItems(score_before);
    $scope.teams = getAllTeam(score_before);

    // console.log(getAllTeam(score_before));
	// $scope.teams = [{
 //        name: 'THA',
 //        s1: 1,
 //        s2: 13

 //    }, {
 //        name: 'JAP',
 //        s1: 20,
 //        s2: 9
 //    }];
}


app.controller(controllers);

// Load XML function
function loadXMLDoc(dname)
{   if (window.XMLHttpRequest)
      {
      xhttp=new XMLHttpRequest();
      }
    else
      {
      xhttp=new ActiveXObject("Microsoft.XMLHTTP");
      }
    xhttp.open("GET",dname,false);
    xhttp.send();
    return xhttp.responseXML;
}

//Function for Converting XML to JSON
xmlToJson = function(xml) {
    var obj = {};
    if (xml.nodeType == 1) {                
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { 
        obj = xml.nodeValue;
    }            
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
}
//Get Problem Information
function getProblemItems(Data) {
    var problem = {};
    problems = Data['contestStandings']['standingsHeader']['problem'];
    for (var i = 0; i < problems.length; i++) {
        var problem_id = problems[i]['@attributes']['id']
        problem[problem_id] = {};
        problem[problem_id]['title'] = problems[i]['@attributes']['title'];
        problem[problem_id]['bestSolutionTime'] = problems[i]['@attributes']['bestSolutionTime'];      
    }
    return problem;
}
//Get Number of Teams
function getNumOfTeam(Data){
    return Data['contestStandings']['teamStanding'].length;
}

//Get Team Information by RANK!!!
function getTeamByRank(Data, rank) {
    var team = {};
    team_raw = Data['contestStandings']['teamStanding'][rank-1];
    team = team_raw['@attributes'];
    team['problemSummaryInfo'] = {};
    for (var i = 0; i < team_raw['problemSummaryInfo'].length; i++) {
        var problem_id = team_raw['problemSummaryInfo'][i]['@attributes']['index'];
        team['problemSummaryInfo'][problem_id] = team_raw['problemSummaryInfo'][i]['@attributes'];
    }
    return team;
}

//Get Team Information by TEAM_ID!!!
function getTeamByID(Data, id) {
    var team = {};
    var numberOfTeam = getNumOfTeam(Data);
    for(var i = 0; i < numberOfTeam; i++){
        if(Data['contestStandings']['teamStanding'][i]['@attributes']['teamId'] == id) {
            rank = Data['contestStandings']['teamStanding'][i]['@attributes']['rank'];
            return getTeamByRank(Data, rank);
        }
    }
    
}

//Get ALL Teams
function getAllTeam(Data) {
    var numberOfTeam = getNumOfTeam(Data);
    var teams = {};
    for(var i = 1; i <= numberOfTeam; i++){
        teams[i] = getTeamByRank(Data, i);
    }
    return teams;
}


