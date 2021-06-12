import {createLogger, format, transports, Logger} from "winston";

type CodiMDLogger = Logger & {
  stream: any
  setLevel?: (string) => void
}

let defaultFormatter = format.combine(
  format.timestamp(),
  format.splat(),
  format.json()
)
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  defaultFormatter = format.combine(
    format.timestamp(),
    format.align(),
    format.splat(),
    format.prettyPrint(),
    format.colorize(),
    format.errors({stack: true}),
    format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  )
}

const logger: CodiMDLogger = createLogger({
  level: 'debug',
  format: defaultFormatter,
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
