'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Notes', 'deletedAt', Sequelize.DATE).catch(function (error) {
      if (error.message === 'SQLITE_ERROR: duplicate column name: deletedAt' || error.message === "ER_DUP_FIELDNAME: Duplicate column name 'deletedAt'" || error.message === 'column "deletedAt" of relation "Notes" already exists') {
        console.log('Migration has already run… ignoring.')
      } else {
        throw error
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Notes', 'deletedAt')
  }
}
