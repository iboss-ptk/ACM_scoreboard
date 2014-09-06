//ANGULAR SCOREBOARD
var app = angular.module('scoreboard', []);
var controllers = {};

app.directive('shortcut', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    link:    function postLink(scope, iElement, iAttrs){
      jQuery(document).on('keypress', function(e){
         scope.$apply(scope.keyPressed(e));
       });
    }
  };
});



controllers.scoreboardCtrl = function ($scope) {

	//score data must be replaced later
    xmlDoc=loadXMLDoc("results-before.xml");
    score_before = xmlToJson(xmlDoc);
    $scope.header = getProblemItems(score_before);
    // Reconstruct Teams data
    allteam_temp = getAllTeam(score_before);
    allteam = [];
    $.each(allteam_temp, function(index, val) {
        val["rank"] = index;
        allteam.push(val);
    });
    // Load Final Score And Reconstruct Teams data
    xmlDoc=loadXMLDoc("results-after.xml");
    score_after = xmlToJson(xmlDoc);
    allteam_after_temp = getAllTeam(score_after);
    allteam_after = [];
    $.each(allteam_after_temp, function(index, val) {
        val["rank"] = index;
        allteam_after.push(val);
    });


    //Add Parameter to Pending Item
    allteam = addToOpen(allteam, allteam_after);
    // console.log(allteam);
    //Initialize Teams' Details to Scope
    $scope.teams = allteam.slice();

    // Get number of the problem
    numberOfProblem = getNumOfProblem(score_before);
    
    
  


    $(document).keypress(function(e) {
        if(e.which == 13) {

            var position = findLastToOpen(allteam);
            // position[0] is Team Index in allteam variable
            // position[1] is ProblemId  that has to be opened
            // Find Team index in After Score
            afterTeamIndex = getTeamIndexByID(allteam_after, allteam[position[0]]["teamId"]);
            var problemItem = allteam_after[afterTeamIndex]["problemSummaryInfo"][position[1]];
            var isSolved = problemItem["isSolved"];
            var attempts = parseInt(problemItem["attempts"]);
            var solutionTime = parseInt(problemItem["solutionTime"]);
            //Check is Solved or not
            if(isSolved == "true") {
                allteam[position[0]]["solved"] = parseInt(allteam[position[0]]["solved"]) + 1 + ""; //Add number of solved items
                allteam[position[0]]["points"] = parseInt(allteam[position[0]]["points"]) + solutionTime + (20*(attempts - 1)) +""; //Update team's points
                allteam[position[0]]["totalAttempts"] = parseInt(allteam[position[0]]["totalAttempts"]) - parseInt(allteam[position[0]]["problemSummaryInfo"][position[1]]["attempts"]) + attempts + ""; //Update team's totalAttempts
                allteam[position[0]]["problemSummaryInfo"][position[1]] = problemItem; //Update problemItem;
                allteam[position[0]]["problemSummaryInfo"][position[1]]["problemStylingClass"] = "animated fadeInDown solved"; // Add Styling Class
                allteam[position[0]]["problemSummaryInfo"][position[1]]["isOpened"] = true; //Set that this Problem is already opened
                
            } else {
                allteam[position[0]]["totalAttempts"] = parseInt(allteam[position[0]]["totalAttempts"]) - parseInt(allteam[position[0]]["problemSummaryInfo"][position[1]]["attempts"]) + attempts + ""; //Update team's totalAttempts
                allteam[position[0]]["problemSummaryInfo"][position[1]] = problemItem; //Update problemItem;
                allteam[position[0]]["problemSummaryInfo"][position[1]]["problemStylingClass"] = "animated fadeInDown attempted";   // Add Styling Class    
                allteam[position[0]]["problemSummaryInfo"][position[1]]["isOpened"] = true; //Set that this Problem is already opened
                         
            }
            // console.log(position);
            // console.log(allteam[position[0]]);
            allteam = rerank(allteam);


            // Update allteam to SCOPE
            $scope.teams = allteam.slice();


            

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
    team['problemSummaryInfo'] = [];
    for (var i = 0; i < team_raw['problemSummaryInfo'].length; i++) {
        var problem_id = team_raw['problemSummaryInfo'][i]['@attributes']['index'];
        team['problemSummaryInfo'][problem_id-1] = team_raw['problemSummaryInfo'][i]['@attributes'];
    }
    return team;
}

//Get Team Information by TEAM_ID!!! Return as Team Index in DATA
function getTeamIndexByID(Data, id) {
    var numberOfTeam = Data.length;
    for(var i = 0; i < numberOfTeam; i++){
        if(parseInt(Data[i]['teamId']) == id) {
            return i;
        }
    }    
}

function getTeamByID2(Data,id){
    var team = {};
    var numberOfTeam = getNumOfTeam(Data);

    for(var i = 0; i < numberOfTeam; i++){
//            console.log("Currently Reading On team = " + Data['contestStandings']['teamStanding'][i]['@attributes']['teamName']); //////////////
          if(Data['contestStandings']['teamStanding'][i]['@attributes']['teamId'] == id) {
            team = Data['contestStandings']['teamStanding'][i];
            return team;
        }  
    }

}

// Function to find pending problem for all team
function addToOpen(Data_before, Data_after){
    var numberOfProblem = Data_before[0]["problemSummaryInfo"].length;
    for (var i = Data_before.length - 1; i >= 0; i--) {
        //Find Index of Team with same ID
        var afterTeamId= getTeamIndexByID(Data_after, Data_before[i]["teamId"]);
        for(var j = 0; j < numberOfProblem; j ++) {
            if(Data_before[i]["problemSummaryInfo"][j]["attempts"] < Data_after[afterTeamId]["problemSummaryInfo"][j]["attempts"]){
                //Something need to be opened in the future
                Data_before[i]["problemSummaryInfo"][j]["isOpened"] = false;
                Data_before[i]["problemSummaryInfo"][j]["problemStylingClass"] = "animated fadeInDown toopen";
            } else {
                // Nothing need to be opened
                Data_before[i]["problemSummaryInfo"][j]["isOpened"] = true;
                if(Data_before[i]["problemSummaryInfo"][j]["isSolved"] == "true")
                    Data_before[i]["problemSummaryInfo"][j]["problemStylingClass"] = "animated fadeInDown solved";
                else if(Data_before[i]["problemSummaryInfo"][j]["attempts"] > 0)
                    Data_before[i]["problemSummaryInfo"][j]["problemStylingClass"] = "animated fadeInDown attempted";
            }
        }
    }
    return Data_before;
}

// Find ProblemID and TeamIndex of the last need to Open item
function findLastToOpen(Data) {
    // Sort by Rank first
    Data.sort(function(a, b){
        aRank = parseInt(a["rank"]);
        bRank = parseInt(b["rank"]);
        return ((aRank < bRank) ? -1 : ((aRank > bRank) ? 1 : 0));
    });
    var position = [];
    var numberOfProblem = Data[0]["problemSummaryInfo"].length;
    for (var i = Data.length - 1; i >= 0; i--) {
        for (var j = 0; j < numberOfProblem ; j++) {
            if(Data[i]["problemSummaryInfo"][j]["isOpened"] == false){
                // Sort by Index to places they used to be
                position.push(parseInt(Data[i]["index"]));
                position.push(j);
                Data.sort(function(a,b) {
                    aIndex = parseInt(a["index"]);
                    bIndex = parseInt(b["index"]);
                    return ((aIndex < bIndex) ? -1 : ((aIndex > bIndex) ? 1 : 0));
                });
                return position;

            }
        };
    };    
    Data.sort(function(a,b) {
        aIndex = parseInt(a["index"]);
        bIndex = parseInt(b["index"]);
        return ((aIndex < bIndex) ? -1 : ((aIndex > bIndex) ? 1 : 0));
    });
    return undefined;
}

//Function for reRank teams
function rerank(Data){
    Data.sort(function(a, b){
        aSolved = parseInt(a["solved"]);
        bSolved = parseInt(b["solved"]);
        aPoints = parseInt(a["points"]);
        bPoints = parseInt(b["points"]);
        aIndex = parseInt(a["index"]);
        bIndex = parseInt(b["index"]);
        aTotalAttempts = parseInt(a["totalAttempts"]);
        bTotalAttempts = parseInt(b["totalAttempts"]);
        if(aSolved != bSolved) {        
            //Sort by number of items solved first
            return ((aSolved > bSolved) ? -1 : ((aSolved < bSolved) ? 1 : 0));
        } else if(aPoints != bPoints) {
            // Then sort by lower points
            return ((aPoints < bPoints) ? -1 : ((aPoints > bPoints) ? 1 : 0));
        } else if(aTotalAttempts != bTotalAttempts) {
            // Then sort by lower total attempts
            return ((aTotalAttempts < bTotalAttempts) ? -1 : ((aTotalAttempts > bTotalAttempts) ? 1 : 0));
        } else {
            // Then sort by Index
            return ((aIndex < bIndex) ? -1 : ((aIndex > bIndex) ? 1 : 0));
        }
    });
    
    // Put rank to attribute Rank
    for (var i = Data.length - 1; i >= 0; i--) {
        Data[i]["rank"] = i+1;
    }

    // Sort back by Index
    Data.sort(function(a,b) {
        aIndex = parseInt(a["index"]);
        bIndex = parseInt(b["index"]);
        return ((aIndex < bIndex) ? -1 : ((aIndex > bIndex) ? 1 : 0));
    });
    console.log(Data);

    return Data;

}

function sleep(seconds) 
{
  var e = new Date().getTime() + (seconds * 1000);
  while (new Date().getTime() <= e) {}
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


