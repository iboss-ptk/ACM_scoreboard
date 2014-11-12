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
    // ================== Set Team height here ======================
    var teamHeight = 120;
    $scope.teamHeight = teamHeight;
    //===============================================================
    $scope.headerOffset = 12;
    var loadedLastTeam = 0;

    //score data must be replaced later
    xmlDoc=loadXMLDoc("results-recent-before.xml");
    score_before = xmlToJson(xmlDoc);
    $scope.header = getProblemItems(score_before);
    $scope.problems = [];
    $.each($scope.header, function(index, val) {
        $scope.problems.push(val);
    });
    // Reconstruct Teams data
    allteam_temp = getAllTeam(score_before);
    allteam = [];
    $.each(allteam_temp, function(index, val) {
        val["showrank"] = val["rank"];
        val["rank"] = index;
        val["z"] = 0;
        val["stylingClass"] = "";
        allteam.push(val);
    });
    // Load Final Score And Reconstruct Teams data
    xmlDoc=loadXMLDoc("results-recent-after.xml");
    score_after = xmlToJson(xmlDoc);
    allteam_after_temp = getAllTeam(score_after);
    allteam_after = [];
    $.each(allteam_after_temp, function(index, val) {
        val["rank"] = index;
        allteam_after.push(val);
    });

    //Add Parameter to Pending Item
    allteam = addToOpen(allteam, allteam_after, $scope.header);
    // console.log(allteam);
    //Initialize Teams' Details to Scope
    $scope.teams = allteam.slice();

    // Get number of the problem
    numberOfProblem = getNumOfProblem(score_before);

    $(window).scroll(function(event) {
        //Scroll Window to team original position
        var tabletop = $("table").offset().top;
        var pagetop = $(window).scrollTop();
        var headerOffset = 0;
        if(tabletop + $scope.headerOffset < pagetop) {
            $("thead").css('top', pagetop - tabletop);
            $("thead > tr").addClass('headershadow');
        } else {
            $("thead").css('top', $scope.headerOffset);
            $("thead > tr").removeClass('headershadow');
        }
    });

    
    //Resuem stages function
    $scope.resumeStages = function(num){
        var stages = localStorage.stages;
        if(num != 0 && loadedLastTeam == 0){
            loadedLastTeam = 1;
            var position = findLastToOpen(allteam);
            
            while(position[0] >= num){
                if(allteam[position[0]]["rank"] <= lastTeamOpened){
                    openLastGray(allteam, lastTeamOpened);
                    lastTeamOpened--;
                    finish = 1;
                    continue;
                    // console.log(lastTeamOpened);
                }
                team = position[0];
                problem = position[1];
                if(allteam[team]["problemSummaryInfo"][problem]["isOpened"] == true) return;
                    // Find Team index in After Score
                    afterTeamIndex = getTeamIndexByID(allteam_after, allteam[team]["teamId"]);
                    var problemItem = allteam_after[afterTeamIndex]["problemSummaryInfo"][problem];
                    var isSolved = problemItem["isSolved"];
                    var attempts = parseInt(problemItem["attempts"]);
                    var solutionTime = parseInt(problemItem["solutionTime"]);

                    //Check is Solved or not
                    if(isSolved == "true") {
                        allteam[team]["solved"] = parseInt(allteam[team]["solved"]) + 1 + ""; //Add number of solved items
                        allteam[team]["points"] = parseInt(allteam[team]["points"]) + solutionTime + (20*(attempts - 1)) +""; //Update team's points
                        allteam[team]["totalAttempts"] = parseInt(allteam[team]["totalAttempts"]) - parseInt(allteam[team]["problemSummaryInfo"][problem]["attempts"]) + attempts + ""; //Update team's totalAttempts
                        allteam[team]["problemSummaryInfo"][problem] = problemItem; //Update problemItem;
                        // console.log($scope.header[parseInt(problem) + 1]);
                        if($scope.header[parseInt(problem) + 1]['bestSolutionTime'] == solutionTime)
                            allteam[team]["problemSummaryInfo"][problem]["problemStylingClass"] = "solvedfirstanim"; // Add Best Solve Style
                        else 
                            allteam[team]["problemSummaryInfo"][problem]["problemStylingClass"] = "solvedanim"; // Add Styling Class

                        allteam[team]["problemSummaryInfo"][problem]["isOpened"] = true; //Set that this Problem is already opened
                        
                    } else {
                        allteam[team]["totalAttempts"] = parseInt(allteam[team]["totalAttempts"]) - parseInt(allteam[team]["problemSummaryInfo"][problem]["attempts"]) + attempts + ""; //Update team's totalAttempts
                        allteam[team]["problemSummaryInfo"][problem] = problemItem; //Update problemItem;
                        allteam[team]["problemSummaryInfo"][problem]["problemStylingClass"] = "attemptedanim";   // Add Styling Class    
                        allteam[team]["problemSummaryInfo"][problem]["isOpened"] = true; //Set that this Problem is already opened
                                 
                    }


                   // Update allteam to SCOPE
                    $scope.teams = allteam.slice();

                    allteam = rerank(allteam);
                position = findLastToOpen(allteam);
            }
        }
        else if(stages !== undefined){
            stages = JSON.parse(stages);
            $.each(stages, function(team, problems) {
                /* iterate through array or object */
                $.each(problems, function(problem, val) {
                    if(allteam[team]["problemSummaryInfo"][problem]["isOpened"] == true || val !== 1) return;
                    // Find Team index in After Score
                    afterTeamIndex = getTeamIndexByID(allteam_after, allteam[team]["teamId"]);
                    var problemItem = allteam_after[afterTeamIndex]["problemSummaryInfo"][problem];
                    var isSolved = problemItem["isSolved"];
                    var attempts = parseInt(problemItem["attempts"]);
                    var solutionTime = parseInt(problemItem["solutionTime"]);

                    //Check is Solved or not
                    if(isSolved == "true") {
                        allteam[team]["solved"] = parseInt(allteam[team]["solved"]) + 1 + ""; //Add number of solved items
                        allteam[team]["points"] = parseInt(allteam[team]["points"]) + solutionTime + (20*(attempts - 1)) +""; //Update team's points
                        allteam[team]["totalAttempts"] = parseInt(allteam[team]["totalAttempts"]) - parseInt(allteam[team]["problemSummaryInfo"][problem]["attempts"]) + attempts + ""; //Update team's totalAttempts
                        allteam[team]["problemSummaryInfo"][problem] = problemItem; //Update problemItem;
                        if($scope.header[parseInt(problem) + 1]['bestSolutionTime'] == solutionTime)
                            allteam[team]["problemSummaryInfo"][problem]["problemStylingClass"] = "solvedfirstanim"; // Add Best Solve Style
                        else 
                            allteam[team]["problemSummaryInfo"][problem]["problemStylingClass"] = "solvedanim"; // Add Styling Class
                        allteam[team]["problemSummaryInfo"][problem]["isOpened"] = true; //Set that this Problem is already opened
                        
                    } else {
                        allteam[team]["totalAttempts"] = parseInt(allteam[team]["totalAttempts"]) - parseInt(allteam[team]["problemSummaryInfo"][problem]["attempts"]) + attempts + ""; //Update team's totalAttempts
                        allteam[team]["problemSummaryInfo"][problem] = problemItem; //Update problemItem;
                        allteam[team]["problemSummaryInfo"][problem]["problemStylingClass"] = "attemptedanim";   // Add Styling Class    
                        allteam[team]["problemSummaryInfo"][problem]["isOpened"] = true; //Set that this Problem is already opened
                                 
                    }


                   // Update allteam to SCOPE
                    $scope.teams = allteam.slice();
                });

            });
            var position = findLastToOpen(allteam);
            console.log(position);
            if(typeof(position) == "undefined") {position = []; position[0] = 0; }      
            while(lastTeamOpened >= 0){
                if(allteam[position[0]]["rank"] <= lastTeamOpened){
                    openLastGray(allteam, lastTeamOpened);
                    lastTeamOpened--;
                    finish = 1;
                    continue;
                    // console.log(lastTeamOpened);
                } else 
                    break;
            }

        }

        allteam = rerank(allteam);
    }

    $scope.setStage = function(){
        var st=prompt("Enter stage");
        
        if(st>0){
            $scope.resumeStages(st);
        }
        
    }
    $scope.clearStage = function(){
        alert("Stage was cleared !!!");
        localStorage.clear();
    }

    //$scope.resumeStages();
    function saveStage(team, problem){
        var stages = localStorage.stages;
        if(stages !== undefined){
            stages = JSON.parse(stages);
            if(stages[team] == undefined)
                stages[team] = {};
            stages[team][problem] = 1;
        }
        else {
            stages = {};
            stages[team] = {};
            stages[team][problem] = 1;
        }
        stages = JSON.stringify(stages);
        localStorage.stages = stages;

    }

    var finish = 1;
    //Attach open function to Scope
    $scope.opentag = function(position){       
            // -- position[0] is Team Index in allteam variable --
            // -- position[1] is ProblemId  that has to be opened --
            //Check is this already opene or not. If it already opend return;
            if(allteam[position[0]]["problemSummaryInfo"][position[1]]["isOpened"] == true) return;
            // Find Team index in After Score
            afterTeamIndex = getTeamIndexByID(allteam_after, allteam[position[0]]["teamId"]);
            var problemItem = allteam_after[afterTeamIndex]["problemSummaryInfo"][position[1]];
            var isSolved = problemItem["isSolved"];
            var attempts = parseInt(problemItem["attempts"]);
            var solutionTime = parseInt(problemItem["solutionTime"]);
            var prevRank = allteam[position[0]]["rank"];

            //Scroll Window to team original position
            var winhigh = $(window).height();
            var pagetop = $(window).scrollTop();
            var targettop = $("#" + (parseInt(position[0]) + 1)).offset().top;
            //if(Math.abs(pagetop - targettop) > winhigh - 200) {
                $('html, body').animate({
                    scrollTop: allteam[position[0]]["rank"]*(teamHeight + 5) + $scope.headerOffset - 300
                }, 300);
           // }

            //Check is Solved or not
            if(isSolved == "true") {
                allteam[position[0]]["solved"] = parseInt(allteam[position[0]]["solved"]) + 1 + ""; //Add number of solved items
                allteam[position[0]]["points"] = parseInt(allteam[position[0]]["points"]) + solutionTime + (20*(attempts - 1)) +""; //Update team's points
                allteam[position[0]]["totalAttempts"] = parseInt(allteam[position[0]]["totalAttempts"]) - parseInt(allteam[position[0]]["problemSummaryInfo"][position[1]]["attempts"]) + attempts + ""; //Update team's totalAttempts
                allteam[position[0]]["problemSummaryInfo"][position[1]] = problemItem; //Update problemItem;
                if($scope.header[position[1] + 1]['bestSolutionTime'] == solutionTime)
                    allteam[position[0]]["problemSummaryInfo"][position[1]]["problemStylingClass"] = "solvedfirstanim"; // Add Best Solve Style
                else 
                    allteam[position[0]]["problemSummaryInfo"][position[1]]["problemStylingClass"] = "solvedanim"; // Add Styling Class
                allteam[position[0]]["problemSummaryInfo"][position[1]]["isOpened"] = true; //Set that this Problem is already opened
                
            } else {
                allteam[position[0]]["totalAttempts"] = parseInt(allteam[position[0]]["totalAttempts"]) - parseInt(allteam[position[0]]["problemSummaryInfo"][position[1]]["attempts"]) + attempts + ""; //Update team's totalAttempts
                allteam[position[0]]["problemSummaryInfo"][position[1]] = problemItem; //Update problemItem;
                allteam[position[0]]["problemSummaryInfo"][position[1]]["problemStylingClass"] = "attemptedanim";   // Add Styling Class    
                allteam[position[0]]["problemSummaryInfo"][position[1]]["isOpened"] = true; //Set that this Problem is already opened
                         
            }

            //Set Z index of current team and add shadow
            allteam[position[0]]["z"] = 100;
            allteam[position[0]]["stylingClass"] = "shadow";

            //Save Stage to WebStorage
            saveStage(position[0], position[1]);

            /*if(isSolved == "true"){

                setTimeout(function(){
                    //Here is to rerank for there new position
                    allteam = rerank(allteam); 

                    // Update allteam to SCOPE
                    //$scope.teams = allteam.slice();

                    
                    //Scroll Window to the right position
                    var timeConst = 30 * (parseInt(allteam[position[0]]["rank"]) - 1);
                    console.log(timeConst);
                    var target = $("#" + position[0]);
                    $('html, body').delay(timeConst).animate({
                        scrollTop: allteam[position[0]]["rank"] * teamHeight + 100
                    }, 500); 

                }, 100);
            } else {
                
            }*/

            if(isSolved == "true"){
                setTimeout(function(){
                    //Here is to rerank for there new position
                    allteam = rerank(allteam); 

                    // Update allteam to SCOPE
                    $scope.teams = allteam.slice();


                    //Scroll Window to the right position
                    
                    // var target = $("#" + position[0]);
                    // $('html, body').delay(1500).animate({
                    //     scrollTop: allteam[position[0]]["rank"] * (teamHeight + 5) + 112
                    // }, 1000); 
                        
                    


                }, 1000);
                //Remove Shadow
                setTimeout(function(){
                    allteam[position[0]]["stylingClass"] = "";
                    allteam[position[0]]["z"] = 0;
                    $scope.$apply();
                    finish = 1;
                    // alert(finish);
                }, 3000);
            } else {
                //Here is to rerank for there new position
                    allteam = rerank(allteam); 

                    // Update allteam to SCOPE
                    $scope.teams = allteam.slice();

                    // var target = $("#" + position[0]);
                    //     $('html, body').animate({
                    //         scrollTop: allteam[position[0]]["rank"] * (teamHeight + 5) + 112
                    //     }, 200); 

                //Remove Shadow
                setTimeout(function(){
                    allteam[position[0]]["stylingClass"] = "";
                    allteam[position[0]]["z"] = 0;
                    $scope.$apply();
                    finish = 1;
                }, 1000);
            }
            

            //Here is to rerank for there new position
            //allteam = rerank(allteam); 

            // Update allteam to SCOPE
            // $scope.teams = allteam.slice();

            // var target = $("#" + position[0]);
            //     $('html, body').animate({
            //         scrollTop: allteam[position[0]]["rank"] * teamHeight + 100
            // }, 500); 

            

            
            
    };
  
    var lastTeamOpened = allteam.length - 1;


    $(document).keypress(function(e) {
        if(e.which == 13) {
            if(finish == 0) return;
            else finish = 0;
            var position = findLastToOpen(allteam);
            if(typeof(position) == "undefined" && lastTeamOpened >= 0){
                $('html, body').animate({
                    scrollTop: (lastTeamOpened + 1)*(teamHeight + 5) + $scope.headerOffset - 300
                }, 300);
                console.log("hello");
                openLastGray(allteam, lastTeamOpened);
                lastTeamOpened--;
                finish = 1;
            }
            else if(typeof(position) == "undefined") {
                 $('html, body').animate({
                    scrollTop: 0
                }, 300);

            }else if(allteam[position[0]]["rank"] <= lastTeamOpened){
                $('html, body').animate({
                    scrollTop: (lastTeamOpened + 1)*(teamHeight + 5) + $scope.headerOffset - 300
                }, 300);
                console.log("hello");
                openLastGray(allteam, lastTeamOpened);
                lastTeamOpened--;
                finish = 1;
                // console.log(lastTeamOpened);
            } else {
                //Call opentag function
                console.log(allteam[position[0]]["rank"]);
                $scope.opentag(position); 
            }
            $scope.$apply();
            return;
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

function openLastGray(Data, position){
    // Sort by Rank first
    Data.sort(function(a, b){
        aRank = parseInt(a["rank"]);
        bRank = parseInt(b["rank"]);
        return ((aRank < bRank) ? -1 : ((aRank > bRank) ? 1 : 0));
    });

    if(Data[position]["stylingClass"] == "")
        Data[position]["stylingClass"] += " shadowbox";
    
    Data.sort(function(a,b) {
        aIndex = parseInt(a["index"]);
        bIndex = parseInt(b["index"]);
        return ((aIndex < bIndex) ? -1 : ((aIndex > bIndex) ? 1 : 0));
    });
    return undefined;
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
        problem[problem_id]['head'] = problem[problem_id]['title'].charAt(0);
        // problem[problem_id]['head'].substring(0, 1);
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
function addToOpen(Data_before, Data_after, problemInfo){
    var numberOfProblem = Data_before[0]["problemSummaryInfo"].length;
    for (var i = Data_before.length - 1; i >= 0; i--) {
        //Find Index of Team with same ID
        var afterTeamId = getTeamIndexByID(Data_after, Data_before[i]["teamId"]);
        for(var j = 0; j < numberOfProblem; j ++) {
            if(Data_before[i]["problemSummaryInfo"][j]["attempts"] < Data_after[afterTeamId]["problemSummaryInfo"][j]["attempts"] || Data_before[i]["problemSummaryInfo"][j]["isSolved"] !== Data_after[afterTeamId]["problemSummaryInfo"][j]["isSolved"]){
                //Something need to be opened in the future
                Data_before[i]["problemSummaryInfo"][j]["isOpened"] = false;
                Data_before[i]["problemSummaryInfo"][j]["problemStylingClass"] = "toopen";
            } else {
                // Nothing need to be opened
                Data_before[i]["problemSummaryInfo"][j]["isOpened"] = true;
                if(Data_before[i]["problemSummaryInfo"][j]["isSolved"] == "true"){
                    if(problemInfo[j + 1]["bestSolutionTime"] == Data_before[i]["problemSummaryInfo"][j]["solutionTime"])
                        Data_before[i]["problemSummaryInfo"][j]["problemStylingClass"] = "solvedfirst";
                    else
                        Data_before[i]["problemSummaryInfo"][j]["problemStylingClass"] = "solved";

                }
                else if(Data_before[i]["problemSummaryInfo"][j]["attempts"] > 0)
                    Data_before[i]["problemSummaryInfo"][j]["problemStylingClass"] = "attempted";
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
            //Sort by number of items that were solved first
            return ((aSolved > bSolved) ? -1 : ((aSolved < bSolved) ? 1 : 0));
        } else if(aPoints != bPoints) {
            // Then sort by lower points
            return ((aPoints < bPoints) ? -1 : ((aPoints > bPoints) ? 1 : 0));
        } else if(aTotalAttempts != bTotalAttempts && aPoints !== 0 && aPoints !== bPoints) {
            // Then sort by lower total attempts
            return ((aTotalAttempts < bTotalAttempts) ? -1 : ((aTotalAttempts > bTotalAttempts) ? 1 : 0));
        } else {
            // Then sort by Index
            return ((aIndex < bIndex) ? -1 : ((aIndex > bIndex) ? 1 : 0));
        }
    });
    
    // Put rank to attribute "rank" and to attribute "showrank"
    var index = 1;
    var lastpoint = -1;
    var lastsolved = -1;
    for (var i = 0; i <= Data.length - 1; i++) {
        if(lastpoint == Data[i]["points"] && lastsolved == Data[i]["solved"]){
            Data[i]["showrank"] = index;
        } else {
            Data[i]["showrank"] = i + 1;
            index = i + 1;
        }
        lastpoint = Data[i]["points"];
        lastsolved = Data[i]["solved"];
        Data[i]["rank"] = i + 1;
    }

    // Sort back by Index
    Data.sort(function(a,b) {
        aIndex = parseInt(a["index"]);
        bIndex = parseInt(b["index"]);
        return ((aIndex < bIndex) ? -1 : ((aIndex > bIndex) ? 1 : 0));
    });
    //console.log(Data);

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


