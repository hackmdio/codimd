HackMD
===

[![Join the chat at https://gitter.im/hackmdio/hackmd](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hackmdio/hackmd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

HackMD lets you create realtime collaborative markdown notes on all platforms.  
Inspired by Hackpad, with more focus on speed and flexibility.  
Still in the early stage, feel free to fork or contribute to HackMD.

Thanks for using! :smile:

[docker-hackmd](https://github.com/hackmdio/docker-hackmd)
---

Before you go too far, here is the great docker repo for HackMD.  
With docker, you can deploy a server in minutes without any downtime.

[migration-to-0.4.0](https://github.com/hackmdio/migration-to-0.4.0)
---

We've dropped MongoDB after version 0.4.0.  
So here is the migration tool for you to transfer the old DB data to the new DB.  
This tool is also used for official service.

Browsers Requirement
---

- Chrome >= 45, Chrome for Android >= 47
- Safari >= 9, iOS Safari >= 8.4
- Firefox >= 44
- IE >= 9, Edge >= 12
- Opera >= 34, Opera Mini not supported
- Android Browser >= 4.4

Prerequisite
---

- Node.js 4.x or up (test up to 6.7.0)
- Database (PostgreSQL, MySQL, MariaDB, SQLite, MSSQL)
- npm and bower

Get started
---

1. Download a release and unzip or clone into a directory
2. Enter the directory and type `bin/setup`, which will install npm/bower dependencies and create configs. The setup script is written in Bash, you would need bash as a prerequisite.
3. Setup the configs, see more below
4. Setup environment variables which will overwrite the configs
5. Build front-end bundle by `npm run build` (use `npm run dev` if you are in development)
6. Run the server as you like (node, forever, pm2)

Upgrade guide
---

If you are upgrading HackMD from an older version, follow these steps:

1. Fully stop your old server first (important)
2. `git pull` or do whatever that updates the files
3. `npm install && bower install` to update dependencies
4. Modify the file named `.sequelizerc`, change the value of the variable `url` with your db connection string
   For example: `postgres://username:password@localhost:5432/hackmd`
5. Run `node_modules/.bin/sequelize db:migrate`, this step will migrate your db to the latest schema
6. Start your whole new server!

Structure
---

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

Configuration files
---

There are some configs you need to change in the files below

```
./config.json			--- for server settings
./public/js/config.js	--- for client settings
```

Client settings `config.js`
---

| variables | example values | description |
| --------- | ------ | ----------- |
| debug | `true` or `false` | set debug mode, show more logs |
| domain | `localhost` | domain name |
| urlpath | `hackmd` | sub url path, like: `www.example.com/<urlpath>` |

Environment variables (will overwrite other server configs)
---

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
| HMD_FACEBOOK_CLIENTID | no example | Facebook API client id |
| HMD_FACEBOOK_CLIENTSECRET | no example | Facebook API client secret |
| HMD_TWITTER_CONSUMERKEY | no example | Twitter API consumer key |
| HMD_TWITTER_CONSUMERSECRET | no example | Twitter API consumer secret |
| HMD_GITHUB_CLIENTID | no example | GitHub API client id |
| HMD_GITHUB_CLIENTSECRET | no example | GitHub API client secret |
| HMD_GITLAB_BASEURL | no example | GitLab authentication endpoint, set to use other endpoint than GitLab.com (optional) |
| HMD_GITLAB_CLIENTID | no example | GitLab API client id |
| HMD_GITLAB_CLIENTSECRET | no example | GitLab API client secret |
| HMD_DROPBOX_CLIENTID | no example | Dropbox API client id |
| HMD_DROPBOX_CLIENTSECRET | no example | Dropbox API client secret |
| HMD_GOOGLE_CLIENTID | no example | Google API client id |
| HMD_GOOGLE_CLIENTSECRET | no example | Google API client secret |
| HMD_IMGUR_CLIENTID | no example | Imgur API client id |

Server settings `config.json`
---

| variables | example values | description |
| --------- | ------ | ----------- |
| debug | `true` or `false` | set debug mode, show more logs |
| domain | `localhost` | domain name |
| urlpath | `hackmd` | sub url path, like `www.example.com/<urlpath>` |
| port | `80` | web app port |
| alloworigin | `['localhost']` | domain name whitelist |
| usessl | `true` or `false` | set to use ssl server (if true will auto turn on `protocolusessl`) |
| protocolusessl | `true` or `false` | set to use ssl protocol for resources path (only applied when domain is set) |
| urladdport | `true` or `false` | set to add port on callback url (port 80 or 443 won't applied) (only applied when domain is set) |
| usecdn | `true` or `false` | set to use CDN resources or not |
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

Third-party integration api key settings
---

| service | settings location | description |
| ------- | --------- | ----------- |
| facebook, twitter, github, gitlab, dropbox, google | environment variables or `config.json` | for signin |
| imgur | environment variables or `config.json` | for image upload |
| google drive, dropbox | `public/js/config.js` | for export and import |

Third-party integration oauth callback urls
---

| service | callback url (after the server url) |
| ------- | --------- |
| facebook | `/auth/facebook/callback` |
| twitter | `/auth/twitter/callback` |
| github | `/auth/github/callback` |
| gitlab | `/auth/gitlab/callback` |
| dropbox | `/auth/dropbox/callback` |
| google | `/auth/google/callback` |

Operational Transformation
---

From 0.3.2, we started supporting operational transformation.  
It makes concurrent editing safe and will not break up other users' operations.  
Additionally, now can show other clients' selections.  
See more at [http://operational-transformation.github.io/](http://operational-transformation.github.io/)

**License under MIT.**
