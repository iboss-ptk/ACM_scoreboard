var app = angular.module('scoreboard', []);
var controllers = {};

controllers.scoreboardCtrl = function ($scope) {

	//score data must be replaced later
	 $scope.teams = [{
        name: 'THA',
        s1: 1,
        s2: 13

    }, {
        name: 'JAP',
        s1: 20,
        s2: 9
    }];
}


app.controller(controllers);