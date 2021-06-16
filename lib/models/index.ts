// external modules
import {Sequelize} from "sequelize";
import {cloneDeep} from "lodash";

// core
import config from "../config";
import {logger} from "../logger";


import {
  BaseModel,
  AuthorAttributes,
  NoteAttributes,
  RevisionAttributes,
  UserAttributes,
  GenericProfile,
  ModelObj
} from "./baseModel";

import {Author} from './author'
import {User} from './user'
import {Revision} from "./revision";
import {Note} from './note'

export {Author, User, Revision, Note}
export {AuthorAttributes, UserAttributes, RevisionAttributes, NoteAttributes, GenericProfile}

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

const db: Partial<ModelObj> = {}

const models: BaseModel[] = [User, Note, Author, Revision]

models.forEach(m => {
  m.initialize(sequelize)
  db[m.name] = m
})
models.forEach(m => {
  if ('associate' in m) {
    m.associate(db as ModelObj)
  }
})

export {sequelize}
