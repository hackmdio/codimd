HackMD
===

[![Join the chat at https://gitter.im/hackmdio/hackmd](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hackmdio/hackmd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

HackMD is a realtime collaborative markdown notes on all platforms.  
Inspired by Hackpad, but more focusing on speed and flexibility.  
Still in early stage, feel free to fork or contribute to this.

Thanks for your using! :smile:

[docker-hackmd](https://github.com/hackmdio/docker-hackmd)
---
Before you going too far, here is the great docker repo for HackMD.  
With docker, you can deploy a server in minutes without any hardtime.

[migration-to-0.4.0](https://github.com/hackmdio/migration-to-0.4.0)
---
We've dropped MongoDB after version 0.4.0.  
So here is the migration tool for you to transfer old DB data to new DB.  
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
- Node.js 4.x or up (test up to 6.2.2)
- Database (PostgreSQL, MySQL, MariaDB, SQLite, MSSQL)
- npm and bower

Get started
---
1. Download a release and unzip or clone into a directory
2. Enter the directory and type `npm install && bower install`, will install all the dependencies
3. Setup the configs, see more on below
4. Setup environment variables, which will overwrite the configs
5. Run the server as you like (node, forever, pm2)

Upgrade guide
---
If you are upgrading HackMD from an older version, follow these steps:

1. Fully stop your old server first (important).
2. `git pull` or do whatever that really update the files.
3. `npm install && bower install` to update dependencies.
4. Modify the file named `.sequelizerc`, change the value of the variable `url` with your db connection string.  
   For example: `postgres://username:password@localhost:5432/hackmd`.
5. Run `node_modules/.bin/sequelize db:migrate`, this step will migrate your db to the latest schema.
6. Start your whole new server!

Structure
---
```
hackmd/
├── tmp/			--- temporary files
├── docs/			--- document files
├── lib/			--- server libraries
└── public/			--- client files
	├── css/		--- css styles
	├── js/			--- js scripts
	├── vendor/		--- vendor includes
	└── views/		--- view templates
```

Configuration files
---
There are some configs you need to change in below files
```
./config.json			--- for server settings
./public/js/common.js	--- for client settings
```

Client settings `common.js`
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
| NODE_ENV  | `production` or `development` | set current environment (will apply correspond settings in the `config.json`) |
| DOMAIN | `hackmd.io` | domain name |
| URL_PATH | `hackmd` | sub url path, like `www.example.com/<URL_PATH>` |
| PORT | `80` | web app port |
| DEBUG | `true` or `false` | set debug mode, show more logs |

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
| protocolusessl | `true` or `false` | set to use ssl protocol for resources path |
| urladdport | `true` or `false` | set to add port on callback url (port 80 or 443 won't applied) |
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
| service | file path | description |
| ------- | --------- | ----------- |
| facebook, twitter, github, gitlab, dropbox, google | `config.json` | for signin |
| imgur | `config.json` | for image upload |
| google drive, dropbox | `public/js/common.js` | for export and import |

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
From 0.3.2, we start support operational transformation.  
Which make concurrent editing safe and not break up other users' operations.  
Even more, now can show other clients' selections.  
See more at http://operational-transformation.github.io/

**License under MIT.**
