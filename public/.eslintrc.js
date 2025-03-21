// this config file is used in concert with the root .eslintrc.js in the root dir.
module.exports = {
  "env": {
    "browser": true,
    "es6": true
  },
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "module"
  },
  "globals": {
    "$": false,
    "CodeMirror": false,
    "Cookies": false,
    "moment": false,
    "editor": false,
    "ui": false,
    "modeType": false,
    "serverurl": false,
    "key": false,
    "gapi": false,
    "Dropbox": false,
    "FilePicker": false,
    "ot": false,
    "MediaUploader": false,
    "hex2rgb": false,
    "num_loaded": false,
    "Visibility": false,
    "inlineAttachment": false
  },
  "rules": {
    "no-unused-vars": "warn"
  }
};
