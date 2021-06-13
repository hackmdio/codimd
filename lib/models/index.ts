// external modules
import * as fs from "fs";
import * as path from "path";
import {Model, Sequelize} from "sequelize";
import {cloneDeep} from "lodash";

// core
import config from "../config";
import {logger} from "../logger";


import {BaseModel} from "./baseModel";

import {Author, AuthorAttributes} from './author'
import {User, UserAttributes} from './user'
import {Revision, RevisionAttributes} from "./revision";
import {Note, NoteAttributes} from './note'

export {Author, User, Revision, Note}
export {AuthorAttributes, UserAttributes, RevisionAttributes, NoteAttributes}

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

const models: BaseModel<Model>[] = [User, Note, Author, Revision]

models.forEach(m => {
  m.initialize(sequelize)
  db[m.name] = m
})
models.forEach(m => {
  if ('associate' in m) {
    m.associate(db)
  }
})

export {sequelize}
