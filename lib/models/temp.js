'use strict'
// external modules
var shortId = require('shortid')

module.exports = function (sequelize, DataTypes) {
  var Temp = sequelize.define('Temp', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: shortId.generate
    },
    data: {
      type: DataTypes.TEXT
    }
  })

  return Temp
}
