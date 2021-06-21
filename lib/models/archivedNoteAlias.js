'use strict'
// external modules
const Sequelize = require('sequelize')

module.exports = function (sequelize, DataTypes) {
  const ArchivedNoteAlias = sequelize.define('ArchivedNoteAlias', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    noteId: {
      type: DataTypes.UUID
    },
    alias: {
      type: DataTypes.STRING,
      unique: true
    }
  })

  ArchivedNoteAlias.associate = function (models) {
    ArchivedNoteAlias.belongsTo(models.Note, {
      foreignKey: 'noteId',
      as: 'note',
      constraints: false
    })
  }

  return ArchivedNoteAlias
}
