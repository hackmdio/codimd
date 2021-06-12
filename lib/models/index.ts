// external modules
import * as fs from "fs";
import * as path from "path";
import {Sequelize} from "sequelize";
import {cloneDeep} from "lodash";

// core
import * as config from "../config";
import * as logger from "../logger";

const dbconfig = cloneDeep(config.db)
dbconfig.logging = config.debug ? (data) => {
  logger.info(data)
} : false

let sequelize = null

// Heroku specific
if (config.dbURL) {
  sequelize = new Sequelize(config.dbURL, dbconfig)
} else {
  sequelize = new Sequelize(dbconfig.database, dbconfig.username, dbconfig.password, dbconfig)
}

// [Postgres] Handling NULL bytes
// https://github.com/sequelize/sequelize/issues/6485
function stripNullByte(value) {
  value = '' + value
  // eslint-disable-next-line no-control-regex
  return value ? value.replace(/\u0000/g, '') : value
}

sequelize.stripNullByte = stripNullByte

function processData(data, _default, process) {
  if (data === undefined) return data
  else return data === null ? _default : (process ? process(data) : data)
}

sequelize.processData = processData

const db: any = {}

fs.readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js') && file.endsWith('.js')
  })
  .forEach(function (file) {
    const model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(function (modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

export = db
