HackMD 0.3.2
===

[![Join the chat at https://gitter.im/hackmdio/hackmd](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hackmdio/hackmd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

HackMD is a realtime collaborative markdown notes on all platforms.  
Inspired by Hackpad, but more focusing on speed and flexibility.  
Still in early stage, feel free to fork or contribute to this.

Thanks for your using! :smile:

Get started
---
1. Install PostgreSQL and MongoDB (yes, currently we need both)
2. Import database schema, see more on below
3. Setup the configs, see more on below
4. Setup environment variables, which will overwrite the configs
5. Run the server as you like (node, forever, pm2)

Database dependency
---
- PostgreSQL 9.3.6 or 9.4.1
- MongoDB 3.0.2

Import database schema
---
The notes are store in PostgreSQL, the schema is in the `hackmd_schema.sql`  
To import the sql file in PostgreSQL, type `psql -i hackmd_schema.sql`

The users, temps and sessions are store in MongoDB, which don't need schema, so just make sure you have the correct connection string.

Structure
---
```
hackmd/
├── tmp/			--- temporary files
├── lib/			--- server libraries
└── public/			--- client files
	├── css/		--- css styles
	├── js/			--- js scripts
	├── vendor/		--- vendor includes
	└── views/		--- view templates
```

Configuration files
---
There are some config you need to change in below files
```
./config.js				--- for server settings
./public/js/index.js	--- for client settings
```

Client-side index.js settings
---
| variables | example values | description |
| --------- | ------ | ----------- |
| debug | `true` or `false` | set debug mode, show more logs |
| version | `0.3.2` | current version, must match same var in server side `config.js` |

Environment variables
---
| variables | example values | description |
| --------- | ------ | ----------- |
| NODE_ENV  | `production` or `development` | show current environment status |
| DATABASE_URL | `postgresql://localhost:5432/hackmd` | PostgreSQL connection string |
| MONGOLAB_URI | `mongodb://localhost/hackmd` | MongoDB connection string |
| PORT | `80` | web port |
| SSLPORT | `443` | ssl web port |
| DOMAIN | `localhost` | domain name |

Server-side config.js settings
---
| variables | example values | description |
| --------- | ------ | ----------- |
| testport  | `3000` | debug web port, fallback to this when not set in environment |
| testsslport | `3001` | debug web ssl port, fallback to this when not set in environment |
| usessl | `true` or `false` | set to use ssl |
| urladdport | `true` or `false` | set to add port on oauth callback url |
| debug | `true` or `false` | set debug mode, show more logs |
| usecdn | `true` or `false` | set to use CDN resources or not |
| version | `0.3.2` | currnet version, must match same var in client side `index.js` |
| alloworigin | `['localhost']` | domain name whitelist |
| sslkeypath | `./cert/client.key` | ssl key path |
| sslcertpath | `./cert/hackmd_io.crt` | ssl cert path |
| sslcapath | `['./cert/COMODORSAAddTrustCA.crt']` | ssl ca chain |
| tmppath | `./tmp/` | temp file path |
| postgresqlstring | `postgresql://localhost:5432/hackmd` | PostgreSQL connection string, fallback to this when not set in environment |
| mongodbstring | `mongodb://localhost/hackmd` | MongoDB connection string, fallback to this when not set in environment |
| sessionname | `connect.sid` | cookie session name |
| sessionsecret | `secret` | cookie session secret |
| sessionlife | `14 * 24 * 60 * 60 * 1000` | cookie session life |
| sessiontouch | `1 * 3600` | cookie session touch |
| heartbeatinterval | `5000` | socket.io heartbeat interval |
| heartbeattimeout | `10000` | socket.io heartbeat timeout |
| documentmaxlength | `100000` | note max length |
| facebook, twitter, github, dropbox, imgur | multiple values | your own api keys, see source code for details |

Operational Transformation
---
From 0.3.2, we start support operational transformation.  
Which make concurrent editing safe and not break up other users' operations.  
Even more, now can show other clients' selections.  
See more at http://operational-transformation.github.io/

**License under MIT.**