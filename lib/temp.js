//temp
//external modules
var mongoose = require('mongoose');

//core
var config = require("../config.js");
var logger = require("./logger.js");

// create a temp model
var model = mongoose.model('temp', {
    id: String,
    data: String,
    created: Date
});

//public
var temp = {
    model: model,
    findTemp: findTemp,
    newTemp: newTemp,
    removeTemp: removeTemp,
    getTempCount: getTempCount
};

function getTempCount(callback) {
    model.count(function(err, count){
        if(err) callback(err, null);
        else callback(null, count);
    });
}

function findTemp(id, callback) {
    model.findOne({
        id: id
    }, function (err, temp) {
        if (err) {
            logger.error('find temp failed: ' + err);
            callback(err, null);
        }
        if (!err && temp) {
            callback(null, temp);
        } else {
            logger.error('find temp failed: ' + err);
            callback(err, null);
        };
    });
}

function newTemp(id, data, callback) {
    var temp = new model({
        id: id,
        data: data,
        created: Date.now()
    });
    temp.save(function (err) {
        if (err) {
            logger.error('new temp failed: ' + err);
            callback(err, null);
        } else {
            logger.info("new temp success: " + temp.id);
            callback(null, temp);
        };
    });
}

function removeTemp(id, callback) {
    findTemp(id, function(err, temp) {
        if(!err && temp) {
            temp.remove(function(err) {
                if(err) {
                    logger.error('remove temp failed: ' + err);
                    callback(err, null);
                } else {
                    callback(null, null);
                }
            });
        } else {
            logger.error('remove temp failed: ' + err);
            callback(err, null);
        }
    });
}

module.exports = temp;