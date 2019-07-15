'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Notes', 'alias', {
      type: Sequelize.STRING
    }).then(function () {
      return queryInterface.addIndex('Notes', ['alias'], {
        indicesType: 'UNIQUE'
      })
    }).catch(function (error) {
      if (error.message === 'SQLITE_ERROR: duplicate column name: alias' || error.message === "ER_DUP_FIELDNAME: Duplicate column name 'alias'" || error.message === 'column "alias" of relation "Notes" already exists') {
        console.log('Migration has already run… ignoring.')
      } else {
        throw error
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Notes', 'alias').then(function () {
      return queryInterface.removeIndex('Notes', ['alias'])
    })
  }
}
