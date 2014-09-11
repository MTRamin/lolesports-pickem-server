var Async = require('async');
var Moment = require('moment');

var dataupdate = require('./dataupdate');
var matchupdate = require('./matchupdate');

var dataTimeout;
var matchesTimeout;

function init() {
    onDataUpdate();
}

function onMatchesUpdate() {
    console.log("Games update initiated");
    // Check DB for active / finished games
    
    matchupdate.onUpdate(function (err, date) {
        scheduleGamesUpdate(date);
    });
}

function onDataUpdate() {
    console.log("Data update initiated");
    // Update lol schedule and all data
    
    dataupdate.onUpdate(function (err, date) {
        
        // After successful data update - update games as well
        clearTimeout(matchesTimeout);
        onMatchesUpdate();
    
        
        scheduleDataUpdate(date);
    });
}

// Schedule an update for all data for a specific date
function scheduleDataUpdate(date) {
    scheduleUpdate(dataTimeout, date, function() {
        onDataUpdate();
    });
}

// Schedule an update of all games for a specific date
function scheduleGamesUpdate(date) {
    scheduleUpdate(matchesTimeout, date, function() {
        onMatchesUpdate();
    });
}

function scheduleUpdate(object, date, callback) {
    var now = Moment();
	var ms = date - now;
	
	object = setTimeout(callback, ms);

	console.log("Update scheduled for " + date.format() + " - that's in " + ms + "ms");
}

exports.init = init;