
var Hapi = require('hapi');
var Good = require('good');
var Basic = require('hapi-auth-basic');
var Token = require('hapi-auth-bearer-token');
var DotEnv = require('dotenv');

// Load environment variables
DotEnv.load();

var routes = require('./routes');
var authentication = require('./authentication');
var updateSchedule = require('./updateschedule');
var database = require('./database');

// Set server variables
var ip = String(process.env.IP || 'localhost');
var port = Number(process.env.PORT || 3000);
var config = { };
var server = new Hapi.Server(ip, port, config);

// Register Good logging
server.pack.register(Good, function (err) {
	if (err) {
		throw err;
	}
});

// Register basic register/login with user/pass
server.pack.register(Basic, function (err) {
    if (err) {
		throw err;
	}
	
    server.auth.strategy('register', 'basic', { validateFunc: authentication.register });
    server.auth.strategy('login', 'basic', { validateFunc: authentication.login });
});


// Register token authentication
server.pack.register(Token, function (err) {
    if (err) {
		throw err;
	}
	
    server.auth.strategy('authenticate', 'bearer-access-token', { validateFunc: authentication.authenticate });
});

// Add server routes
server.route(routes);

// Init database connection
database.init(function (err) {
    if (err) {
		throw err;
	}
	server.log('info', 'Database connection established');
	
	updateSchedule.init();
	// Start server
    server.start(function () {
        server.log('info', 'Server running at: ' + server.info.uri);
    });	    
});




	