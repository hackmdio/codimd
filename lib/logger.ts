import {createLogger, format, transports, Logger} from "winston";

type CodiMDLogger = Logger & {
  stream: any
  setLevel?: (string) => void
}

let logger: CodiMDLogger = createLogger({
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

logger.setLevel = function (level) {
  logger.level = level
}

export = logger
