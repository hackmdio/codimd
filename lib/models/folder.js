'use strict'
// external modules
var Sequelize = require('sequelize-hierarchy')()

module.exports = function (sequelize, DataTypes) {
  var Folder = sequelize.define('Folder', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    name: {
      type: DataTypes.TEXT,
      validate: {
        len: 1
      },
      get: function () {
        return sequelize.processData(this.getDataValue('name'), '')
      },
      set: function (value) {
        this.setDataValue('name', sequelize.stripNullByte(value))
      }
    },
    ownerId: {
      allowNull: false,
      type: DataTypes.UUID
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    classMethods: {
      associate: function (models) {
        Folder.hasMany(models.Note, {
          foreignKey: 'folderId',
          as: 'notes',
          constraints: false
        })
      }
    }
  })
  Folder.isHierarchy({
    camelThrough: true
  })

  return Folder
}
