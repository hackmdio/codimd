'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('ArchivedNoteAliases', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      noteId: Sequelize.UUID,
      alias: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    })
      .then(
        () => queryInterface.addIndex(
          'ArchivedNoteAliases',
          ['alias'], {
          indicesType: 'UNIQUE'
        })
      )
  },

  down: function (queryInterface) {
    return queryInterface.dropTable('Users');
  }
}
