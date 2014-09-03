//ANGULAR SCOREBOARD
var app = angular.module('scoreboard', []);
var controllers = {};

controllers.scoreboardCtrl = function ($scope) {

	//score data must be replaced later
    xmlDoc=loadXMLDoc("results-before.xml");
    score_before = xmlToJson(xmlDoc);
    $scope.header = getProblemItems(score_before);
    $scope.teams = getAllTeam(score_before);

    // console.log(getAllTeam(score_before));
	/*$scope.teams = [{
        teamName: 'THA',
        rank: 1,
        points: 99

    }, {
        teamName: 'JAP',
        rank: 2,
        points: 88
    }];*/
    xmlDoc=loadXMLDoc("results-after.xml");
    score_after = xmlToJson(xmlDoc);

    console.log(score_before);
    numberOfProblem = getNumOfProblem(score_before);

    $(document).keypress(function(e) {
        if(e.which == 13) {
            lastChild = $('.notsort:last');
            teamId = lastChild.attr('id');
            teamDetails = getTeamByID(score_after, teamId);
            // Add Each Problem Solving to Table
            for(var i = 1; i <= numberOfProblem; i++){
                if(teamDetails["problemSummaryInfo"][i]["attempts"] != 0) {
                    if(teamDetails["problemSummaryInfo"][i]["isSolved"] != "false")
                        lastChild.find(".problem" + i)
                            .html(teamDetails["problemSummaryInfo"][i]["attempts"] +" (" + teamDetails["problemSummaryInfo"][i]["solutionTime"] + " + " + ((teamDetails["problemSummaryInfo"][i]["attempts"]-1)*20) + ")")
                            .addClass('solved');
                    else 
                        lastChild.find(".problem" + i)
                            .html(teamDetails["problemSummaryInfo"][i]["attempts"])
                            .addClass('attempted');
                }
                
            }
            // Add new Points
            lastChild.find(".subpointcell")
                .html(teamDetails['points']);
            // Add new Solved item
            lastChild.find(".solvedcell")
                .html(teamDetails['solved']);
            // ====== Add new RANK ======
            lastChild.find(".rankcell")
                .html(teamDetails['rank']);

            console.log(teamDetails);
            lastChild
                .removeClass('notsort')
                .addClass('sorted');
        }
    });
}


app.controller(controllers);

// Load XML function
function loadXMLDoc(dname){   
    if (window.XMLHttpRequest){
      xhttp=new XMLHttpRequest();
    }else{
      xhttp=new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET",dname,false);
    xhttp.send();
    return xhttp.responseXML;
}

//Function for Converting XML to JSON
xmlToJson = function(xml) {
    var obj = {};
    
    if (xml.nodeType == 1) { //TN : Element Node                
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

    //TN : recursive to get the child ( Ex. TeamStanding -> problemSummary )            
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            }else{
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

//Get Nomber of Problems
function getNumOfProblem(Data){
    return Data['contestStandings']['standingsHeader']['problem'].length;
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

    //PARSE THE RANK NUMBER TO INT ( OPTIMIZED )
    for(var i = 1; i <= numberOfTeam; i++){
        teams[i] = getTeamByRank(Data, i);
        teams[i].rank = parseInt(teams[i].rank);
    }
 
    return teams;
}

//http://stackoverflow.com/questions/14478106/angularjs-sorting-by-property
//TN : JSON Does Not SUPPORT OBJECTs but array! (kuy) 
//and i guess that NG-REPEAT USE array so 
//SO Let's Make Filter for our objects

// <TAG> ng-repeat=" team in teams | orderObjectBy:'rank' " </TAG>
// input is auto by 'teams' and return array (sorted)
// attribute => any,field (ascend,decend by put '-')
app.filter('orderObjectBy', function(){
 return function(input, attribute) {
    if (!angular.isObject(input)) return input;

    var array = [];
    for(var objectKey in input) {
        array.push(input[objectKey]);
    }

    array.sort(function(a, b){
        a = parseInt(a[attribute]);
        b = parseInt(b[attribute]);
        return a - b;
    });
    return array;
 }
});


