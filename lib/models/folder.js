'use strict'
// external modules
var Sequelize = require('sequelize')

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
    parentId: {
      type: DataTypes.UUID
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
        Folder.belongsTo(models.User, {
          foreignKey: 'ownerId',
          as: 'owner',
          constraints: false
        })
        Folder.hasMany(models.Note, {
          foreignKey: 'folderId',
          as: 'notes',
          constraints: false
        })
        Folder.belongsTo(models.Folder, {
          foreignKey: 'parentId',
          as: 'parent',
          constraints: false
        })
        Folder.hasMany(models.Folder, {
          foreignKey: 'parentId',
          as: 'folders',
          constraints: false
        })
      }
    },
    hooks: {
      beforeCreate: function (folder, options, callback) {
        if (!folder.parentId) {
          folder.parentId = '00000000-0000-0000-0000-000000000000'
        }
        return callback(null, folder)
      }
    }
  })

  return Folder
}
