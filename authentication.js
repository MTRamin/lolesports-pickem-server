var Bcrypt = require('bcrypt');
var Uuid = require('node-uuid');

var database = require('./database');

function User(username, password, token) {
    this.username = username;
    this.password = password;
    this.token = token;
}

var authenticate = function (token, callback) {
    database.find({"token": token}, database.user, function (err, users) {
        if (users.length > 0) {
            var user = users[0];
            callback(null, true, { token: user.token, username: user.username });
        } else {
            callback(null, false);
        }
    });
};

var register = function (username, password, callback) {
    database.contains({"username": username}, database.user, function (err, exists) {
        if (exists) {
            return callback(err, false);
        }
        
        hashPassword(password, function (err, hash) {
            if (err) {
                callback(err);
            }
            var user = new User(username, hash, generateToken());
            
            database.insert(user, database.user, function (err, docs) {
                if (err) {
                    return callback(err, false);
                }
                callback(err, true, { token: user.token, username: user.username });
            });
        });
    });
};

var login = function (username, password, callback) {
    database.find({"username": username}, database.user, function (err, users) {
        if (users.length > 0) {
            var user = users[0];
            comparePassword(password, user.password, function (err, result) {
                if (result) {
                    return callback(err, true, { token: user.token, username: user.username });
                } else {
                    return callback(err, false);
                }
            });
        } else {
            return callback(err, false);
        }
    });
};

function generateToken() {
    return Uuid.v4();
}

function hashPassword(password, callback) {
    Bcrypt.genSalt(10, function (err, salt) {
        Bcrypt.hash(password, salt, function (err, hash) {
            callback(err, hash);
        });
    });
}

function comparePassword(password, hash, callback) {
    Bcrypt.compare(password, hash, callback);
}

exports.authenticate = authenticate;
exports.register = register;
exports.login = login;