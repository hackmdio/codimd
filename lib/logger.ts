// Do not require any relative module in this file, will caused circular dependencies.
import {createLogger, format, transports, Logger} from "winston";


type CodiMDLogger = Logger & {
  morganLog?: {
    write: (message: string) => void
  }
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

export const logger: CodiMDLogger = createLogger({
  format: defaultFormatter,
  transports: [
    new transports.Console({
      handleExceptions: true
    })
  ],
  exitOnError: false
})

// for morgan used
logger.morganLog = {
  write: buffer => {
    logger.http(buffer.trim())
  }
}

logger.setLevel = function (level) {
  logger.level = level
}

export default logger
