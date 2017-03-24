'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Notes', 'savedAt', Sequelize.DATE).then(function () {
      return queryInterface.createTable('Revisions', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true
        },
        noteId: Sequelize.UUID,
        patch: Sequelize.TEXT,
        lastContent: Sequelize.TEXT,
        content: Sequelize.TEXT,
        length: Sequelize.INTEGER,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Revisions').then(function () {
      return queryInterface.removeColumn('Notes', 'savedAt')
    })
  }
}
