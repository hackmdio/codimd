//config
var path = require('path');

var domain = process.env.DOMAIN;
var testport = '3000';
var testsslport = '3001';
var port = process.env.PORT || testport;
var sslport = process.env.SSLPORT || testsslport;
var usessl = false;
var urladdport = true; //add port on getserverurl

var config = {
    debug: true,
    usecdn: false,
    version: '0.3.4',
    domain: domain,
    alloworigin: ['add here to allow origin to cross'],
    testport: testport,
    testsslport: testsslport,
    port: port,
    sslport: sslport,
    sslkeypath: 'change this',
    sslcertpath: 'change this',
    sslcapath: ['change this'],
    usessl: usessl,
    getserverurl: function() {
        if(usessl)
            return 'https://' + domain + (sslport == 443 || !urladdport ? '' : ':' + sslport);
        else
            return 'http://' + domain + (port == 80 || !urladdport ? '' : ':' + port);
    },
    //path
    tmppath: "./tmp/",
    defaultnotepath: path.join(__dirname, '/public', "default.md"),
    defaultfeaturespath: path.join(__dirname, '/public', "features.md"),
    indexpath: path.join(__dirname, '/public/', "index.ejs"),
    hackmdpath: path.join(__dirname, '/public/views', "index.ejs"),
    errorpath: path.join(__dirname, '/public/views', "error.ejs"),
    prettypath: path.join(__dirname, '/public/views', 'pretty.ejs'),
    //db string
    postgresqlstring: "change this",
    mongodbstring: "change this",
    //constants
    featuresnotename: "features",
    sessionname: 'change this',
    sessionsecret: 'change this',
    sessionlife: 14 * 24 * 60 * 60 * 1000, //14 days
    sessiontouch: 1 * 3600, //1 hour
    heartbeatinterval: 5000,
    heartbeattimeout: 10000,
    documentmaxlength: 100000,
    //auth
    facebook: {
        clientID: 'change this',
        clientSecret: 'change this',
        callbackPath: '/auth/facebook/callback'
    },
    twitter: {
        consumerKey: 'change this',
        consumerSecret: 'change this',
        callbackPath: '/auth/twitter/callback'
    },
    github: {
        clientID: 'change this',
        clientSecret: 'change this',
        callbackPath: '/auth/github/callback'
    },
    dropbox: {
        clientID: 'change this',
        clientSecret: 'change this',
        callbackPath: '/auth/dropbox/callback'
    },
    imgur: {
        clientID: 'change this'
    }
};

module.exports = config;
