//config
var path = require('path');

var config = {
    debug: true,
    version: '0.2.7',
    domain: 'http://localhost:3000',
    testport: '3000',
    //path
    tmppath: "./tmp/",
    defaultnotepath: path.join(__dirname, '/public', "default.md"),
    defaultfeaturespath: path.join(__dirname, '/public', "features.md"),
    hackmdpath: path.join(__dirname, '/public/views', "index.ejs"),
    errorpath: path.join(__dirname, '/public/views', "error.ejs"),
    prettypath: path.join(__dirname, '/public/views', 'pretty.ejs'),
    //db string
    postgresqlstring: "postgresql://localhost:5432/hackmd",
    mongodbstring: "mongodb://localhost/hackmd",
    //constants
    featuresnotename: "features",
    sessionname: 'please set this',
    sessionsecret: 'please set this',
    sessionlife: 14 * 24 * 60 * 60 * 1000, //14 days
    sessiontouch: 1 * 3600, //1 hour
    heartbeatinterval: 5000,
    heartbeattimeout: 10000,
    //auth
    facebook: {
        clientID: 'get yourself one',
        clientSecret: 'get yourself one',
        callbackPath: '/auth/facebook/callback'
    },
    twitter: {
        consumerKey: 'get yourself one',
        consumerSecret: 'get yourself one',
        callbackPath: '/auth/twitter/callback'
    },
    github: {
        clientID: 'get yourself one',
        clientSecret: 'get yourself one',
        callbackPath: '/auth/github/callback'
    },
    dropbox: {
        clientID: 'get yourself one',
        clientSecret: 'get yourself one',
        callbackPath: '/auth/dropbox/callback'
    }
};

module.exports = config;