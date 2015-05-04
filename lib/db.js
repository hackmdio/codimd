//db
//external modules
var pg = require('pg');
var fs = require('fs');
var util = require('util');

//core
var config = require("../config.js");

//public
var db = {
    readFromFile: readFromDB,
    saveToFile: saveToFile,
    newToDB: newToDB,
    readFromDB: readFromDB,
    saveToDB: saveToDB,
    countFromDB: countFromDB
};

function getDBClient() {
    if (config.debug)
        return new pg.Client(config.postgresqlstring);
    else
        return new pg.Client(process.env.DATABASE_URL);
}

function readFromFile(callback) {
    fs.readFile('hackmd', 'utf8', function (err, data) {
        if (err) throw err;
        callback(data);
    });
}

function saveToFile(doc) {
    fs.writeFile('hackmd', doc, function (err) {
        if (err) throw err;
    });
}

var updatequery = "UPDATE notes SET title='%s', content='%s', update_time=NOW() WHERE id='%s';";
var insertquery = "INSERT INTO notes (id, owner, content) VALUES ('%s', '%s', '%s');";
var insertifnotexistquery = "INSERT INTO notes (id, owner, content) \
SELECT '%s', '%s', '%s' \
WHERE NOT EXISTS (SELECT 1 FROM notes WHERE id='%s') RETURNING *;";
var selectquery = "SELECT * FROM notes WHERE id='%s';";
var countquery = "SELECT count(*) FROM notes;";

function newToDB(id, owner, body, callback) {
    var client = getDBClient();
    client.connect(function (err) {
        if (err) {
            callback(err, null);
            return console.error('could not connect to postgres', err);
        }
        var newnotequery = util.format(insertquery, id, owner, body);
        //console.log(newnotequery);
        client.query(newnotequery, function (err, result) {
            if (err) {
                callback(err, null);
                return console.error("new note to db failed: " + err);
            } else {
                if (config.debug)
                    console.log("new note to db success");
                callback(null, result);
                client.end();
            }
        });
    });
}

function readFromDB(id, callback) {
    var client = getDBClient();
    client.connect(function (err) {
        if (err) {
            callback(err, null);
            return console.error('could not connect to postgres', err);
        }
        var readquery = util.format(selectquery, id);
        //console.log(readquery);
        client.query(readquery, function (err, result) {
            if (err) {
                callback(err, null);
                return console.error("read from db failed: " + err);
            } else {
                //console.log(result.rows);
                if (result.rows.length <= 0) {
                    callback("not found note in db", null);
                } else {
                    console.log("read from db success");
                    callback(null, result);
                    client.end();
                }
            }
        });
    });
}

function saveToDB(id, title, data, callback) {
    var client = getDBClient();
    client.connect(function (err) {
        if (err) {
            callback(err, null);
            return console.error('could not connect to postgres', err);
        }
        var savequery = util.format(updatequery, title, data, id);
        //console.log(savequery);
        client.query(savequery, function (err, result) {
            if (err) {
                callback(err, null);
                return console.error("save to db failed: " + err);
            } else {
                if (config.debug)
                    console.log("save to db success");
                callback(null, result);
                client.end();
            }
        });
    });
}

function countFromDB(callback) {
    var client = getDBClient();
    client.connect(function (err) {
        if (err) {
            callback(err, null);
            return console.error('could not connect to postgres', err);
        }
        client.query(countquery, function (err, result) {
            if (err) {
                callback(err, null);
                return console.error("count from db failed: " + err);
            } else {
                //console.log(result.rows);
                if (result.rows.length <= 0) {
                    callback("not found note in db", null);
                } else {
                    console.log("count from db success");
                    callback(null, result);
                    client.end();
                }
            }
        });
    });
}

module.exports = db;