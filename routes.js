var lolesports = require('./lolesports');

// Set up all routes
module.exports = [
    { method: 'GET',    path: '/register',     handler: returnUserToken,    config: { auth: 'register' } },
    { method: 'GET',    path: '/login',        handler: returnUserToken,    config: { auth: 'login' } },
    { method: 'GET',    path: '/',             handler: returnTest,         config: { auth: 'authenticate' } },
    { method: 'GET',    path: '/{name}',       handler: helloName,          config: { auth: 'authenticate' } },
];

function returnUserToken(request, reply) {
    var user = new Object();
    user.username = request.auth.credentials.username;
    user.token = request.auth.credentials.token;
    
    reply(user);
}

function returnTest(request, reply) {
	lolesports.getProgrammingBlocksForNextWeek(function (err, programmingBlocksInWeek) {
	    lolesports.getProgrammingBlocksForIds(programmingBlocksInWeek, function (err, blocks) {
	        lolesports.getMatchesFromProgrammingBlocks(blocks, function (err, matches) {
	            lolesports.getGamesForMatches(matches, function (err, games) {
	                reply(games);    
	            });
	            
	            /*
	            lolesports.getTeamsForMatches(matches, function (err, teams) {
	                reply(teams);  
	            });
	            */
	            
	            
	        });
	    });
	});
}

function helloName(request, reply) {
	var name = request.params.name;

	reply('Hello, ' + name + '!');
}
