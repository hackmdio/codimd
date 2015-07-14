//db
//external modules
var pg = require('pg');
var fs = require('fs');
var util = require('util');

//core
var config = require("../config.js");
var logger = require("./logger.js");

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
    return new pg.Client(process.env.DATABASE_URL || config.postgresqlstring);
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
            client.end();
            callback(err, null);
            return logger.error('could not connect to postgres', err);
        }
        var newnotequery = util.format(insertquery, id, owner, body);
        //logger.info(newnotequery);
        client.query(newnotequery, function (err, result) {
            client.end();
            if (err) {
                callback(err, null);
                return logger.error("new note to db failed: " + err);
            } else {
                if (config.debug)
                    logger.info("new note to db success");
                callback(null, result);
            }
        });
    });
}

function readFromDB(id, callback) {
    var client = getDBClient();
    client.connect(function (err) {
        if (err) {
            client.end();
            callback(err, null);
            return logger.error('could not connect to postgres', err);
        }
        var readquery = util.format(selectquery, id);
        //logger.info(readquery);
        client.query(readquery, function (err, result) {
            client.end();
            if (err) {
                callback(err, null);
                return logger.error("read from db failed: " + err);
            } else {
                //logger.info(result.rows);
                if (result.rows.length <= 0) {
                    callback("not found note in db: " + JSON.stringify(id), null);
                } else {
                    if(config.debug)
                        logger.info("read from db success");
                    callback(null, result);
                }
            }
        });
    });
}

function saveToDB(id, title, data, callback) {
    var client = getDBClient();
    client.connect(function (err) {
        if (err) {
            client.end();
            callback(err, null);
            return logger.error('could not connect to postgres', err);
        }
        var savequery = util.format(updatequery, title, data, id);
        //logger.info(savequery);
        client.query(savequery, function (err, result) {
            client.end();
            if (err) {
                callback(err, null);
                return logger.error("save to db failed: " + err);
            } else {
                if (config.debug)
                    logger.info("save to db success");
                callback(null, result);
            }
        });
    });
}

function countFromDB(callback) {
    var client = getDBClient();
    client.connect(function (err) {
        if (err) {
            client.end();
            callback(err, null);
            return logger.error('could not connect to postgres', err);
        }
        client.query(countquery, function (err, result) {
            client.end();
            if (err) {
                callback(err, null);
                return logger.error("count from db failed: " + err);
            } else {
                //logger.info(result.rows);
                if (result.rows.length <= 0) {
                    callback("not found note in db", null);
                } else {
                    if(config.debug)
                        logger.info("count from db success");
                    callback(null, result);
                }
            }
        });
    });
}

module.exports = db;