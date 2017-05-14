'use strict'

const {toBooleanConfig} = require('./utils')

module.exports = {
  debug: toBooleanConfig(process.env.DEBUG),
  dburl: process.env.DATABASE_URL,
  urlpath: process.env.URL_PATH,
  port: process.env.PORT
}
