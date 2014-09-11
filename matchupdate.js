var Moment = require('moment');
var Async = require('async');

var lolesports = require('./lolesports');
var database = require('./database');

function onUpdate(callback) {
    
    selectMatchesToUpdate(function (err, matches) {
        updateSelectedMatches(matches, function (err, updatedMatches) {
            
            updateGamesForMatches(updatedMatches, function () {});
            checkMatchesForFinished(updatedMatches);
                
            // Just set the next update time for now
            calculateNextMatchUpdateTime(matches, callback);
        });
    });
}

function calculateNextMatchUpdateTime(matches, callback) {
    var gameLive = false;
    var now = Moment();
    var next = Moment().add(1, 'year');
    
    Async.each(matches, function (match, callback) {
        if (gameLive || match.state == "LIVE") {
            gameLive = true;
        } else if (match.state == "PRE") {
            // Parse match start date/time
            var matchStart = Moment(match.dateTime);
            if (matchStart > now && matchStart < next) {
                next = matchStart;
            }
        }
        callback();
    }, function (err) {
        var tomorrow = Moment().add(1, 'day');
        var update = next;
        
        if (gameLive) {
            update = Moment().add(5, 'minutes');
        } else if (next > tomorrow) {
            update = Moment().add(12, 'hours');
        }
        
        callback(err, update);
    });
}

function checkMatchesForFinished(matches) {
    var matchesToAnalyze = [];
    Async.each(matches, function(match, callback) {
        if (match.state == "POST" && match.isAnalyzed === false) {
            matchesToAnalyze.push(match);
        }
        callback();
    }, function (err) {
        analyzeMatches(matchesToAnalyze);
    });
}

function analyzeMatches(matches) {
    Async.each(matches, function (match, callback) {
        console.log("Analyzing match " + match.id);  
        callback();
    }, function (err) {
        console.log(matches.length + " matches analyzed (not really.... I lied... sorry :(");
    });
    
}

function updateGamesForMatches(matches, callback) {
    lolesports.getGamesForMatches(matches, function (err, games) {
        Async.each(games, function (game, callback) {
            database.update({"id": game.id}, game, database.games, callback);
        }, function (err) {
            console.log(games.length + " games updated");
            return callback(err, games);
        }); 
    });
}

function updateSelectedMatches(matches, callback) {
    // Update matches themselves
    lolesports.getMatches(matches, function(err, updatedMatches) {
        Async.each(updatedMatches, function (match, callback) {
            database.update({"id": match.id}, match, database.matches, callback);
        }, function (err) {
            console.log(updatedMatches.length + " matches updated");
            return callback(err, updatedMatches);
        });
    });
}

function selectMatchesToUpdate(callback) {
    database.find({}, database.matches, function (err, matches) {
        var selectedMatches = [];
        
        Async.each(matches, function (match, callback) {
            if (match.state != "POST" || match.isAnalyzed === false) {
                selectedMatches.push(match);
            }
            callback();
        }, function (err) {
            callback(err, selectedMatches);
        });
    });
}

exports.onUpdate = onUpdate;
