'use strict'

exports.toBooleanConfig = function toBooleanConfig (configValue) {
  if (configValue && typeof configValue === 'string') {
    return (configValue === 'true')
  }
  return configValue
}

exports.toArrayConfig = function toArrayConfig (configValue, separator = ',', fallback) {
  if (configValue && typeof configValue === 'string') {
    return (configValue.split(separator).map(arrayItem => arrayItem.trim()))
  }
  return fallback
}

exports.toIntegerConfig = function toIntegerConfig (configValue) {
  if (configValue && typeof configValue === 'string') {
    return parseInt(configValue)
  }
  return configValue
}
