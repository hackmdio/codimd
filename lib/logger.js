'use strict'
const { createLogger, format, transports } = require('winston')

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.uncolorize(),
    format.timestamp(),
    format.align(),
    format.splat(),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console({
      handleExceptions: true
    })
  ],
  exitOnError: false
})

logger.stream = {
  write: function (message, encoding) {
    logger.info(message)
  }
}

module.exports = logger
