HackMD
===

[![Standard - JavaScript Style Guide][standardjs-image]][standardjs-url]

[![Join the chat at https://gitter.im/hackmdio/hackmd][gitter-image]][gitter-url]
[![build status][travis-image]][travis-url]
[![version][github-version-badge]][github-release-page]


HackMD lets you create realtime collaborative markdown notes on all platforms.
Inspired by Hackpad, with more focus on speed and flexibility.
Still in the early stage, feel free to fork or contribute to HackMD.

Thanks for using! :smile:

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
# Table of Contents

- [Browsers Requirement](#browsers-requirement)
- [Installation](#installation)
  - [Getting started (Native install)](#getting-started-native-install)
    - [Prerequisite](#prerequisite)
    - [Windows](#windows)
    - [Instructions](#instructions)
  - [Heroku Deployment](#heroku-deployment)
  - [HackMD by docker container](#hackmd-by-docker-container)
- [Upgrade](#upgrade)
  - [Native setup](#native-setup)
- [Configuration](#configuration)
  - [Environment variables (will overwrite other server configs)](#environment-variables-will-overwrite-other-server-configs)
  - [Application settings `config.json`](#application-settings-configjson)
  - [Third-party integration api key settings](#third-party-integration-api-key-settings)
  - [Third-party integration oauth callback urls](#third-party-integration-oauth-callback-urls)
- [Developer Notes](#developer-notes)
  - [Structure](#structure)
  - [Operational Transformation](#operational-transformation)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Browsers Requirement

- ![Chrome](http://browserbadge.com/chrome/47/18px) Chrome >= 47, Chrome for Android >= 47
- ![Safari](http://browserbadge.com/safari/9/18px) Safari >= 9, iOS Safari >= 8.4
- ![Firefox](http://browserbadge.com/firefox/44/18px) Firefox >= 44
- ![IE](http://browserbadge.com/ie/9/18px) IE >= 9, Edge >= 12
- ![Opera](http://browserbadge.com/opera/34/18px) Opera >= 34, Opera Mini not supported
- Android Browser >= 4.4

# Installation

## Getting started (Native install)

### Prerequisite

- Node.js 6.x or up (test up to 7.5.0)
- Database (PostgreSQL, MySQL, MariaDB, SQLite, MSSQL) use charset `utf8`
- npm (and its dependencies, especially [uWebSockets](https://github.com/uWebSockets/uWebSockets#nodejs-developers), [node-gyp](https://github.com/nodejs/node-gyp#installation))

### Windows

You need to setup bash for npm first before the Instructions below.
1. Install [git-for-windows](https://git-for-windows.github.io/) to get BASH emulation(bash.exe) for Windows 
2. Update npm to 5.1.0 or up by `npm install npm@latest -g`
3. Set config by `npm config set script-shell = "path/to/bash.exe"`
   (default path is `C:\Program Files\Git\bin\bash.exe`)

### Instructions

1. Download a release and unzip or clone into a directory
2. Enter the directory and type `bin/setup`, which will install npm dependencies and create configs. The setup script is written in Bash, you would need bash as a prerequisite.
3. Setup the configs, see more below
4. Setup environment variables which will overwrite the configs
5. Build front-end bundle by `npm run build` (use `npm run dev` if you are in development)
6. Run the server as you like (node, forever, pm2)

## Heroku Deployment

You can quickly setup a sample heroku hackmd application by clicking the button below.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## HackMD by docker container
[![Try in PWD](https://cdn.rawgit.com/play-with-docker/stacks/cff22438/assets/images/button.png)](http://play-with-docker.com?stack=https://github.com/hackmdio/docker-hackmd/raw/master/docker-compose.yml&stack_name=hackmd)


**Debian-based version:**

[![latest](https://images.microbadger.com/badges/version/hackmdio/hackmd.svg)](https://microbadger.com/images/hackmdio/hackmd "Get your own version badge on microbadger.com") [![](https://images.microbadger.com/badges/image/hackmdio/hackmd.svg)](https://microbadger.com/images/hackmdio/hackmd "Get your own image badge on microbadger.com")


**Alpine-based version:**

[![latest-alpine](https://images.microbadger.com/badges/version/hackmdio/hackmd:latest-alpine.svg)](https://microbadger.com/images/hackmdio/hackmd:latest-alpine "Get your own version badge on microbadger.com") [![](https://images.microbadger.com/badges/image/hackmdio/hackmd:latest-alpine.svg)](https://microbadger.com/images/hackmdio/hackmd:latest-alpine "Get your own image badge on microbadger.com")

The easiest way to setup HackMD using docker are using the following three commands:

```console
git clone https://github.com/hackmdio/docker-hackmd.git
cd docker-hackmd
docker-compose up
```
Read more about it in the [docker repository…](https://github.com/hackmdio/docker-hackmd)

# Upgrade

## Native setup

If you are upgrading HackMD from an older version, follow these steps:

1. Fully stop your old server first (important)
2. `git pull` or do whatever that updates the files
3. `npm install` to update dependencies
4. Build front-end bundle by `npm run build` (use `npm run dev` if you are in development)
5. Modify the file named `.sequelizerc`, change the value of the variable `url` with your db connection string
   For example: `postgres://username:password@localhost:5432/hackmd`
6. Run `node_modules/.bin/sequelize db:migrate`, this step will migrate your db to the latest schema
7. Start your whole new server!

* [migration-to-0.5.0](https://github.com/hackmdio/migration-to-0.5.0)

We don't use LZString to compress socket.io data and DB data after version 0.5.0.
Please run the migration tool if you're upgrading from the old version.

* [migration-to-0.4.0](https://github.com/hackmdio/migration-to-0.4.0)

We've dropped MongoDB after version 0.4.0.
So here is the migration tool for you to transfer the old DB data to the new DB.
This tool is also used for official service.

# Configuration

There are some configs you need to change in the files below

```
./config.json      ----application settings
```

## Environment variables (will overwrite other server configs)

| variables | example values | description |
| --------- | ------ | ----------- |
| NODE_ENV  | `production` or `development` | set current environment (will apply corresponding settings in the `config.json`) |
| DEBUG | `true` or `false` | set debug mode, show more logs |
| HMD_DOMAIN | `hackmd.io` | domain name |
| HMD_URL_PATH | `hackmd` | sub url path, like `www.example.com/<URL_PATH>` |
| HMD_PORT | `80` | web app port |
| HMD_ALLOW_ORIGIN | `localhost, hackmd.io` | domain name whitelist (use comma to separate) |
| HMD_PROTOCOL_USESSL | `true` or `false` | set to use ssl protocol for resources path (only applied when domain is set) |
| HMD_URL_ADDPORT | `true` or `false` | set to add port on callback url (port 80 or 443 won't applied) (only applied when domain is set) |
| HMD_USECDN | `true` or `false` | set to use CDN resources or not (default is `true`) |
| HMD_ALLOW_ANONYMOUS | `true` or `false` | set to allow anonymous usage (default is `true`) |
| HMD_ALLOW_FREEURL | `true` or `false` | set to allow new note by accessing not exist note url |
| HMD_DEFAULT_PERMISSION | `freely`, `editable`, `limited`, `locked` or `private` | set notes default permission (only applied on signed users) |
| HMD_DB_URL | `mysql://localhost:3306/database` | set the db url |
| HMD_FACEBOOK_CLIENTID | no example | Facebook API client id |
| HMD_FACEBOOK_CLIENTSECRET | no example | Facebook API client secret |
| HMD_TWITTER_CONSUMERKEY | no example | Twitter API consumer key |
| HMD_TWITTER_CONSUMERSECRET | no example | Twitter API consumer secret |
| HMD_GITHUB_CLIENTID | no example | GitHub API client id |
| HMD_GITHUB_CLIENTSECRET | no example | GitHub API client secret |
| HMD_GITLAB_SCOPE | `read_user` or `api` | GitLab API requested scope (default is `api`) (gitlab snippet import/export need `api` scope) |
| HMD_GITLAB_BASEURL | no example | GitLab authentication endpoint, set to use other endpoint than GitLab.com (optional) |
| HMD_GITLAB_CLIENTID | no example | GitLab API client id |
| HMD_GITLAB_CLIENTSECRET | no example | GitLab API client secret |
| HMD_MATTERMOST_BASEURL | no example | Mattermost authentication endpoint |
| HMD_MATTERMOST_CLIENTID | no example | Mattermost API client id |
| HMD_MATTERMOST_CLIENTSECRET | no example | Mattermost API client secret |
| HMD_DROPBOX_CLIENTID | no example | Dropbox API client id |
| HMD_DROPBOX_CLIENTSECRET | no example | Dropbox API client secret |
| HMD_GOOGLE_CLIENTID | no example | Google API client id |
| HMD_GOOGLE_CLIENTSECRET | no example | Google API client secret |
| HMD_LDAP_URL | `ldap://example.com` | url of LDAP server |
| HMD_LDAP_BINDDN | no example | bindDn for LDAP access |
| HMD_LDAP_BINDCREDENTIALS | no example | bindCredentials for LDAP access |
| HMD_LDAP_TOKENSECRET | `supersecretkey` | secret used for generating access/refresh tokens |
| HMD_LDAP_SEARCHBASE | `o=users,dc=example,dc=com` | LDAP directory to begin search from |
| HMD_LDAP_SEARCHFILTER | `(uid={{username}})` | LDAP filter to search with |
| HMD_LDAP_SEARCHATTRIBUTES | no example | LDAP attributes to search with |
| HMD_LDAP_TLS_CA | `server-cert.pem, root.pem` | Root CA for LDAP TLS in PEM format (use comma to separate) |
| HMD_LDAP_PROVIDERNAME | `My institution` | Optional name to be displayed at login form indicating the LDAP provider |
| HMD_IMGUR_CLIENTID | no example | Imgur API client id |
| HMD_EMAIL | `true` or `false` | set to allow email signin |
| HMD_ALLOW_PDF_EXPORT | `true` or `false` | Enable or disable PDF exports |
| HMD_ALLOW_EMAIL_REGISTER | `true` or `false` | set to allow email register (only applied when email is set, default is `true`) |
| HMD_IMAGE_UPLOAD_TYPE | `imgur`, `s3` or `filesystem` | Where to upload image. For S3, see our [S3 Image Upload Guide](docs/guides/s3-image-upload.md) |
| HMD_S3_ACCESS_KEY_ID | no example | AWS access key id |
| HMD_S3_SECRET_ACCESS_KEY | no example | AWS secret key |
| HMD_S3_REGION | `ap-northeast-1` | AWS S3 region |
| HMD_S3_BUCKET | no example | AWS S3 bucket name |
| HMD_HSTS_ENABLE | ` true`  | set to enable [HSTS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) if HTTPS is also enabled (default is ` true`) |
| HMD_HSTS_INCLUDE_SUBDOMAINS | `true` | set to include subdomains in HSTS (default is `true`) |
| HMD_HSTS_MAX_AGE | `31536000` | max duration in seconds to tell clients to keep HSTS status (default is a year) |
| HMD_HSTS_PRELOAD | `true` | whether to allow preloading of the site's HSTS status (e.g. into browsers) |

## Application settings `config.json`

| variables | example values | description |
| --------- | ------ | ----------- |
| debug | `true` or `false` | set debug mode, show more logs |
| domain | `localhost` | domain name |
| urlpath | `hackmd` | sub url path, like `www.example.com/<urlpath>` |
| port | `80` | web app port |
| alloworigin | `['localhost']` | domain name whitelist |
| usessl | `true` or `false` | set to use ssl server (if true will auto turn on `protocolusessl`) |
| hsts | `{"enable": "true", "maxAgeSeconds": "31536000", "includeSubdomains": "true", "preload": "true"}` | [HSTS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) options to use with HTTPS (default is the example value, max age is a year) |
| protocolusessl | `true` or `false` | set to use ssl protocol for resources path (only applied when domain is set) |
| urladdport | `true` or `false` | set to add port on callback url (port 80 or 443 won't applied) (only applied when domain is set) |
| usecdn | `true` or `false` | set to use CDN resources or not (default is `true`) |
| allowanonymous | `true` or `false` | set to allow anonymous usage (default is `true`) |
| allowfreeurl | `true` or `false` | set to allow new note by accessing not exist note url |
| defaultpermission | `freely`, `editable`, `limited`, `locked`, `protected` or `private` | set notes default permission (only applied on signed users) |
| dburl | `mysql://localhost:3306/database` | set the db url, if set this variable then below db config won't be applied |
| db | `{ "dialect": "sqlite", "storage": "./db.hackmd.sqlite" }` | set the db configs, [see more here](http://sequelize.readthedocs.org/en/latest/api/sequelize/) |
| sslkeypath | `./cert/client.key` | ssl key path (only need when you set usessl) |
| sslcertpath | `./cert/hackmd_io.crt` | ssl cert path (only need when you set usessl) |
| sslcapath | `['./cert/COMODORSAAddTrustCA.crt']` | ssl ca chain (only need when you set usessl) |
| dhparampath | `./cert/dhparam.pem` | ssl dhparam path (only need when you set usessl) |
| tmppath | `./tmp/` | temp directory path |
| defaultnotepath | `./public/default.md` | default note file path |
| docspath | `./public/docs` | docs directory path |
| indexpath | `./public/views/index.ejs` | index template file path |
| hackmdpath | `./public/views/hackmd.ejs` | hackmd template file path |
| errorpath | `./public/views/error.ejs` | error template file path |
| prettypath | `./public/views/pretty.ejs` | pretty template file path |
| slidepath | `./public/views/slide.hbs` | slide template file path |
| sessionname | `connect.sid` | cookie session name |
| sessionsecret | `secret` | cookie session secret |
| sessionlife | `14 * 24 * 60 * 60 * 1000` | cookie session life |
| staticcachetime | `1 * 24 * 60 * 60 * 1000` | static file cache time |
| heartbeatinterval | `5000` | socket.io heartbeat interval |
| heartbeattimeout | `10000` | socket.io heartbeat timeout |
| documentmaxlength | `100000` | note max length |
| email | `true` or `false` | set to allow email signin |
| allowemailregister  | `true` or `false` | set to allow email register (only applied when email is set, default is `true`) |
| imageUploadType | `imgur`(default), `s3` or `filesystem` | Where to upload image
| s3 | `{ "accessKeyId": "YOUR_S3_ACCESS_KEY_ID", "secretAccessKey": "YOUR_S3_ACCESS_KEY", "region": "YOUR_S3_REGION" }` | When `imageUploadType` be set to `s3`, you would also need to setup this key, check our [S3 Image Upload Guide](docs/guides/s3-image-upload.md) |
| s3bucket | `YOUR_S3_BUCKET_NAME` | bucket name when `imageUploadType` is set to `s3` |

## Third-party integration api key settings

| service | settings location | description |
| ------- | --------- | ----------- |
| facebook, twitter, github, gitlab, mattermost, dropbox, google, ldap | environment variables or `config.json` | for signin |
| imgur, s3 | environment variables or `config.json` | for image upload |
| google drive(`google/apiKey`, `google/clientID`), dropbox(`dropbox/appKey`) | `config.json` | for export and import |

## Third-party integration oauth callback urls

| service | callback url (after the server url) |
| ------- | --------- |
| facebook | `/auth/facebook/callback` |
| twitter | `/auth/twitter/callback` |
| github | `/auth/github/callback` |
| gitlab | `/auth/gitlab/callback` |
| mattermost | `/auth/mattermost/callback` |
| dropbox | `/auth/dropbox/callback` |
| google | `/auth/google/callback` |

# Developer Notes

## Structure

```text
hackmd/
├── tmp/            --- temporary files
├── docs/           --- document files
├── lib/            --- server libraries
└── public/         --- client files
    ├── css/        --- css styles
    ├── js/         --- js scripts
    ├── vendor/     --- vendor includes
    └── views/      --- view templates
```

## Operational Transformation

From 0.3.2, we started supporting operational transformation.
It makes concurrent editing safe and will not break up other users' operations.
Additionally, now can show other clients' selections.
See more at [http://operational-transformation.github.io/](http://operational-transformation.github.io/)



# License

**License under MIT.**

[gitter-image]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/hackmdio/hackmd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
[travis-image]: https://travis-ci.org/hackmdio/hackmd.svg?branch=master
[travis-url]: https://travis-ci.org/hackmdio/hackmd
[github-version-badge]: https://img.shields.io/github/release/hackmdio/hackmd.svg
[github-release-page]: https://github.com/hackmdio/hackmd/releases
[standardjs-image]: https://cdn.rawgit.com/feross/standard/master/badge.svg
[standardjs-url]: https://github.com/feross/standard
