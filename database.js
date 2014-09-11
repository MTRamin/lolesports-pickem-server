var MongoClient = require('mongodb').MongoClient;

var dbuser = process.env.MONGO_USER;
var dbpass = process.env.MONGO_PASS;

var dburl = 'mongodb://' + dbuser + ':' + dbpass + '@' + process.env.MONGO_URL;

var collection_user = 		process.env.MONGO_COLLECTION_USER;
var collection_leagues = 	process.env.MONGO_COLLECTION_LEAGUES;
var collection_teams = 		process.env.MONGO_COLLECTION_TEAMS;
var collection_matches = 	process.env.MONGO_COLLECTION_MATCHES;
var collection_games = 		process.env.MONGO_COLLECTION_GAMES;

function init(callback) {
	MongoClient.connect(dburl, function(err, db) {
		if (err) {
			callback(err);
		}

		db.authenticate(dbuser, dbpass, function (err, res) {
			if (err) {
				return callback(err);
			}

			if (res === 0) {
				return callback(err);
			}

			module.exports.db = 		db;
			module.exports.user = 		db.collection(collection_user);
			module.exports.leagues = 	db.collection(collection_leagues);
			module.exports.teams = 		db.collection(collection_teams);
			module.exports.matches = 	db.collection(collection_matches);
			module.exports.games = 		db.collection(collection_games);

			callback();
		});
	});
}

function find(data, collection, callback) {
	collection.find(data).toArray(callback);
}

function contains(data, collection, callback) {
	callback(null, (collection.find(data).limit(1).size() > 0));
}

function update(query, data, collection, callback) {
	collection.update(query, data, callback);
}

function findOrCreate(query, data, collection, callback) {
	collection.findAndModify(query, [], { $setOnInsert: data}, {new:true, upsert:true}, callback);
}

function insert(data, collection, callback) {
	collection.insert(data, {w:1}, callback);
}

exports.init = init;
exports.find = find;
exports.contains = contains;
exports.update = update;
exports.insert = insert;
exports.findOrCreate = findOrCreate;