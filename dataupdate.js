var Moment = require('moment');
var Async = require('async');

var lolesports = require('./lolesports');
var database = require('./database');

function onUpdate(callback) {
    
    // Run all these in parallel
    Async.parallel([
        function(callback) {
            updateLeagues(callback);
        },
        function(callback) {
            updateProgrammingWeek(callback);
        }
    ], function (err) {
        // Callback with the time for the next update
        callback(null, Moment().add(1, 'days')); 
    });
}

// Find all leagues and enter them into the database
function updateLeagues(callback) {
    lolesports.requestAndParseLeagues(function (err, leagues) {
        Async.each(leagues, function (league, callback) {
            database.findOrCreate({"id": league.id}, league, database.leagues, callback);
            
        }, function (err) {
            console.log(leagues.length + " leagues updated");
            callback();
        });
    });
}

// Update programming week and download everything new
function updateProgrammingWeek(callback) {
    lolesports.getProgrammingBlocksForNextWeek(function (err, programmingBlocksInWeek) {
	    lolesports.getProgrammingBlocksForIds(programmingBlocksInWeek, function (err, blocks) {
	        lolesports.getMatchesFromProgrammingBlocks(blocks, function (err, matches) {

                Async.parallel([
                    function(callback) {
                        Async.each(matches, function (match, callback) {
        	                database.findOrCreate({"id": match.id}, match, database.matches, callback);
        	            }, function (err) {
        	                console.log(matches.length + " matches updated");
        	                callback();
        	            });
                    },
                    function(callback) {
                        lolesports.getTeamsForMatches(matches, function (err, teams) {
                            Async.each(teams, function (team, callback) {
                                database.findOrCreate({"id": team.id}, team, database.teams, callback);
                            }, function (err) {
                                console.log(teams.length + " teams updated");
                                callback(); 
                            });
	                    });
                    }
                ], function (err) {
                    console.log("Programming week updated");
                    callback();
                });
	        });
	    });
	});
}

exports.onUpdate = onUpdate;
