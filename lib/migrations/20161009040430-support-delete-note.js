'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Notes', 'deletedAt', Sequelize.DATE).catch(function (error) {
      if (error.message === "ER_DUP_FIELDNAME: Duplicate column name 'deletedAt'") {
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
