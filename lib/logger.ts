import {createLogger, format, transports, Logger} from "winston";

interface CodiMDLogger extends Logger {
  stream: any
}

const logger: CodiMDLogger = createLogger({
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

export = logger
