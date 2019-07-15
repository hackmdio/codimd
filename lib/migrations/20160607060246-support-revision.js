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
    }).catch(function (error) {
      if (error.message === 'SQLITE_ERROR: duplicate column name: savedAt' | error.message === "ER_DUP_FIELDNAME: Duplicate column name 'savedAt'" || error.message === 'column "savedAt" of relation "Notes" already exists') {
        console.log('Migration has already run… ignoring.')
      } else {
        throw error
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Revisions').then(function () {
      return queryInterface.removeColumn('Notes', 'savedAt')
    })
  }
}
