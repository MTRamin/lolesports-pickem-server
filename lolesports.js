var Http = require('http');
var Async = require('async');

var leagueOverviewRequest = {
	hostname: 'na.lolesports.com',
	path: '/api/league.json?parameters[method]=all',
	method: 'GET'
}

var programmingWeekRequest = {
	hostname: 'na.lolesports.com',
	path: '/api/programmingWeek/2014-8-28/0.json',
	method: 'GET'
}

// Data about a League
function LoLLeague() {
    this.id;
    this.name;
    this.abbr;
    this.color;
    this.logoUrl;
}

// Data about a Team
function LoLTeam() {
    this.id;
    this.name;
    this.abbr;
    this.logoUrl;
}

// Data about a Match
function LoLMatch() {
    this.id;
    this.league;
    this.tournament;
    this.blueTeam;  // Team id
    this.redTeam;   // Team id
    this.blueScore;
    this.redScore;
    this.dateTime;
    this.state; // pregame, live, postgame
    this.isAnalyzed = false;
    this.bestof;
    this.games; // List of game id's
}

// Data about a single game
function LoLGame() {
    this.id;
    this.matchId;
    this.duration;
    this.winner;
    this.gameInSeries;
    this.killsBlue;
    this.killsRed;
    this.goldBlue;
    this.goldRed;
}

function init(callback) {
    requestAndParseLeagues();
}

function requestAndParseLeagues(callback) {
    request(leagueOverviewRequest, function (err, data) {
        var leagues = [];
        
        // Parse data to JSON
        data = JSON.parse(data);
        
        // Parse elements of JSON data
        Async.each(data.leagues, function (leagueData, callback) {
            // Iterating
            var league = new LoLLeague();
            league.id = leagueData.id;
            league.name = leagueData.label;
            league.abbr = leagueData.shortName;
            league.color = leagueData.color;
            league.logoUrl = leagueData.leagueImage;
            
            leagues.push(league);
            callback();
        }, function (err) {
            // All done 
            return callback(err, leagues);
        });
    });
}

function requestAndParseProgrammingWeek(callback) {
    request(programmingWeekRequest, function (err, data) {
        var programmingBlocks = [];
        
        // Parse data to JSON
        data = JSON.parse(data);
        
        Async.each(data.days, function (day, callback) {
            // Iterating
            if (day.blockNum > 0) {
                Async.each(day.blockIds, function (id, callback) {
                    programmingBlocks.push(id);
                    callback();
                }, function (err) {
                    callback();
                });
            } else {
                callback();
            }
        }, function (err) {
            // All done
            
            Async.each(programminBlocks, function (block, callback) {
                // Iterating
                
            }, function (err) {
                // All done 
            });
            
            
            return callback(err, programmingBlocks);
            
            
            
            // Do something with the programming Blocks
            // e.g. maybe download the matches... and the games!?
        });
    });
}

function request(request, callback) {
    var httpRequest = Http.get(request, function (response) {
		var str = '';

		response.on('data', function (chunk) {
			str += chunk;
		});

		response.on('end', function () {
		    return callback(null, str);
		});
	});

	httpRequest.on('error', function (err) {
		return callback(err);
	});
}

exports.requestAndParseProgrammingWeek = requestAndParseProgrammingWeek;