'use strict'

exports.toBooleanConfig = function toBooleanConfig (configValue) {
  if (configValue && typeof configValue === 'string') {
    return (configValue === 'true')
  }
  return configValue
}
