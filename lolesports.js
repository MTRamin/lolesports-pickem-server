var Http = require('http');
var Async = require('async');
var Moment = require('moment');

var leagueOverviewRequest = {
	hostname: 'na.lolesports.com',
	path: '/api/league.json?parameters[method]=all',
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

// Data about a programming block (only internal for data retrieval)
function LoLProgrammingBlock() {
    this.id;
    this.leagueId;
    this.tournamentId;
    this.matches;
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
    this.leagueId;
    this.tournamentId;
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
    this.blueTeam;
    this.redTeam;
    this.killsBlue;
    this.killsRed;
    this.goldBlue;
    this.goldRed;
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

function getProgrammingBlocksForNextWeek(callback) {
    // Date format example:     2014-9-8
    //                          YYYY-M-D
    var date = Moment().format('YYYY-M-D');
    requestProgrammingWeekForDate(date, function (err, programmingBlocks) {
        callback(err, programmingBlocks); 
    });
}

// Clusterfuck, clean this up
function requestProgrammingWeekForDate(date, callback) {
    // Download the programming week
    var programmingWeekRequest = {
    	hostname: 'na.lolesports.com',
    	path: '/api/programmingWeek/' + date + '/0.json',
    	method: 'GET'
    }

    request(programmingWeekRequest, function (err, data) {
        var programmingBlocks = [];
        
        // Parse data to JSON
        data = JSON.parse(data);
        
        // Find all programming blocks in the next week
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
            return callback(err, programmingBlocks);
        });
    });
}

function getProgrammingBlocksForIds(blocks, callback) {
    var programmingBlocks = [];
    
    // Find all matches from all the programming blocks
    Async.each(blocks, function (blockId, callback) {
        // Iterating
        requestProgrammingBlock(blockId, function (err, block) {
            programmingBlocks.push(block);
            callback();
        });
        
    }, function (err) {
        // All done
        return callback(err, programmingBlocks);
    });
}

function requestProgrammingBlock(blockId, callback) {
    var blockRequest = {
        hostname: 'na.lolesports.com',
    	path: '/api/programming/' + blockId + '.json',
    	method: 'GET'
    }
    
    request(blockRequest, function (err, data) {
        data = JSON.parse(data);
        
        var block = new LoLProgrammingBlock();
        
        block.id = data.blockId;
        block.leagueId = data.leagueId;
        block.tournamentId = data.tournamentId;
        block.matches = data.matches;
        
        callback(err, block);
    });
}

function getMatchesForProgrammingBlocks(blocks, callback) {
    var matches = [];
    
    Async.each(blocks, function (block, callback) {
        Async.each(block.matches, function (matchId, callback) {
            requestAndParseMatch(matchId, function (err, match) {
                match.leagueId = block.leagueId;
                match.tournamentId = block.tournamentId;
                
                matches.push(match);
                callback();
            })
        }, function (err) {
            callback(); 
        });
    }, function(err) {
        return callback(err, matches);
    });
}

function getMatches(matches, callback) {
    var updatedMatches = [];
    
    Async.each(matches, function (match, callback) {
        requestAndParseMatch(match.id, function (err, updatedMatch) {
           updatedMatch.leagueId = match.leagueId; 
           updatedMatch.tournamentId = match.tournamentId;
           
           updatedMatches.push(updatedMatch);
           callback();
        })
    }, function (err) {
        return callback(err, updatedMatches); 
    });
}

function requestAndParseMatch(matchId, callback) {
    var matchRequest = {
        hostname: 'na.lolesports.com',
    	path: '/api/match/' + matchId + '.json',
    	method: 'GET'
    }

    request(matchRequest, function (err, data) {
        data = JSON.parse(data);
        
        var match = new LoLMatch();
        match.id = matchId;
        match.blueTeam = data.contestants.blue.id;
        match.redTeam = data.contestants.red.id;
        match.dateTime = data.dateTime;
        match.state = (data.isLive) ? "LIVE" : (data.isFinished == 1) ? "POST" : "PRE";
        match.isAnalyzed = false;
        match.bestof = data.maxGames;
        
        // TODO: Get teams data
        
        // Get games data
        var games = [];
        var blueScore = 0;
        var redScore = 0;
        
        // Iterate through games objects
        for (var key in data.games) {
            if (data.games.hasOwnProperty(key)) { // Check if object has value
                var game = data.games[key];
                games.push(game.id);
                
                if (game.winnerId) {
                    if (game.winnerId == match.blueTeam) {
                        blueScore++;
                    } else {
                        redScore++;
                    }
                }
            }
        }
        
        match.games = games; // Download Games
        match.blueScore = blueScore; // Calculate from games
        match.redScore = redScore; // Calculate from games
        
        callback(err, match);
        
    });
}

function getGamesForMatches(matches, callback) {
    var games = [];
    
    Async.each(matches, function (match, callback) {
        Async.each(match.games, function (gameId, callback) {
            requestAndParseGame(gameId, function (err, game) {
                games.push(game);
                callback();
            })
        }, function (err) {
            callback();    
        }); 
    }, function (err) {
        return callback(err, games); 
    });
}

function requestAndParseGame(gameId, callback) {
    var gameRequest = {
        hostname: 'na.lolesports.com',
    	path: '/api/game/' + gameId + '.json',
    	method: 'GET'
    }
    
    request(gameRequest, function (err, data) {
        data = JSON.parse(data);
        
        var game = new LoLGame();
        game.id = gameId;
        game.matchId = data.matchId;
        game.duration = data.gameLength;
        game.gameInSeries = data.gameNumber;
        game.blueTeam = data.contestants.blue.id;
        game.redTeam = data.contestants.red.id;
        if (data.winnerId) {
            game.winner = (data.winnerId == game.blueTeam) ? "BLUE" : "RED";    
        }
        
        if (data.players) {
            var blueGold = 0;
            var redGold = 0;
            var blueKills = 0;
            var redKills = 0;
            
            for (var key in data.players) {
                if (data.players.hasOwnProperty(key)) {
                    var player = data.players[key];
                    
                    if (player.teamId == game.blueTeam) {
                        blueGold += player.totalGold;
                        blueKills += player.kills;
                    } else {
                        redGold += player.totalGold;
                        redKills += player.kills;
                    }
                }
            }
            
            game.killsBlue = blueKills;
            game.killsRed = redKills;
            game.goldBlue = blueGold;
            game.goldRed = redGold;
        
        }
        callback(err, game);
    });
}

function getTeamsForMatches(matches, callback) {
    var teams = [];
    
    Async.each(matches, function (match, callback) {
        Async.parallel([
            function(callback) {
                requestAndParseTeam(match.blueTeam, function (err, team) {
                    teams.push(team);
                    callback();
                });
            }, 
            function(callback) {
                requestAndParseTeam(match.redTeam, function (err, team) {
                    teams.push(team);
                    callback();
                });
            }
        ], function (err) {
            callback();
        });
    }, function (err) {
        return callback(err, teams);
    });
}

function requestAndParseTeam(teamId, callback) {
    var gameRequest = {
        hostname: 'na.lolesports.com',
    	path: '/api/team/' + teamId + '.json',
    	method: 'GET'
    }
    
    request(gameRequest, function (err, data) {
        data = JSON.parse(data);
        
        var team = new LoLTeam();
        team.id = teamId;
        team.name = data.name;
        team.abbr = data.acronym;
        team.loglUrl = data.logoUrl;
        
        callback(err, team);
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

exports.requestAndParseLeagues = requestAndParseLeagues;
exports.getProgrammingBlocksForNextWeek = getProgrammingBlocksForNextWeek;
exports.getProgrammingBlocksForIds = getProgrammingBlocksForIds;
exports.getMatchesFromProgrammingBlocks = getMatchesForProgrammingBlocks;
exports.getGamesForMatches = getGamesForMatches;
exports.getTeamsForMatches = getTeamsForMatches;
exports.getMatches = getMatches;