'use strict'

module.exports = {
  debug: (process.env.DEBUG === 'true'),
  dburl: process.env.DATABASE_URL,
  urlpath: process.env.URL_PATH,
  port: process.env.PORT
}
