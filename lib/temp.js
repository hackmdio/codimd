//temp
//external modules
var mongoose = require('mongoose');

//core
var config = require("../config.js");

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
            console.log('find temp failed: ' + err);
            callback(err, null);
        }
        if (!err && temp) {
            callback(null, temp);
        } else {
            console.log('find temp failed: ' + err);
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
            console.log('new temp failed: ' + err);
            callback(err, null);
        } else {
            console.log("new temp success: " + temp.id);
            callback(null, temp);
        };
    });
}

function removeTemp(id, callback) {
    findTemp(id, function(err, temp) {
        if(!err && temp) {
            temp.remove(function(err) {
                if(err) {
                    console.log('remove temp failed: ' + err);
                    callback(err, null);
                } else {
                    callback(null, null);
                }
            });
        } else {
            console.log('remove temp failed: ' + err);
            callback(err, null);
        }
    });
}

module.exports = temp;