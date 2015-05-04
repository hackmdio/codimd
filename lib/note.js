//note
//external modules
var LZString = require('lz-string');
var marked = require('marked');
var cheerio = require('cheerio');

//others
var db = require("./db.js");

//public
var note = {
    checkNoteIdValid: checkNoteIdValid,
    checkNoteExist: checkNoteExist,
    getNoteTitle: getNoteTitle
};

function checkNoteIdValid(noteId) {
    try {
        //console.log(noteId);
        var id = LZString.decompressFromBase64(noteId);
        if (!id) return false;
        var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        var result = id.match(uuidRegex);
        if (result && result.length == 1)
            return true;
        else
            return false;
    } catch (err) {
        console.error(err);
        return false;
    }
}

function checkNoteExist(noteId) {
    try {
        //console.log(noteId);
        var id = LZString.decompressFromBase64(noteId);
        db.readFromDB(id, function (err, result) {
            if (err) return false;
            return true;
        });
    } catch (err) {
        console.error(err);
        return false;
    }
}

//get title
function getNoteTitle(body) {
    var $ = cheerio.load(marked(body));
    var h1s = $("h1");
    var title = "";
    if (h1s.length > 0)
        title = h1s.first().text();
    else
        title = "Untitled";
    return title;
}

module.exports = note;