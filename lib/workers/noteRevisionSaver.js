// core
var logger = require("../logger.js");
var models = require("../models");

process.on('message', function (data) {
    if (!data || !data.msg || data.msg !== 'save note revision') return process.exit();
    models.Revision.saveAllNotesRevision(function (err, notes) {
        if (err) {
            logger.error('note revision saver failed: ' + err);
            return process.exit();
        }
        if (notes && notes.length <= 0) {
            process.send({
                msg: 'empty'
            });
        }
        process.exit();
    });
});