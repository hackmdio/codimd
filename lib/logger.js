'use strict'
const winston = require('winston')

class Logger extends winston.Logger {
  // Implement stream.writable.write interface
  write (chunk) {
    this.info(chunk)
  }
}

module.exports = new Logger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: false,
      timestamp: true
    })
  ],
  emitErrs: true,
  exitOnError: false
})
