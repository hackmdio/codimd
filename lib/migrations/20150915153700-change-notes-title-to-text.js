'use strict'
const isSQLite = require('../utils').isSQLite
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Notes', 'title', {
      type: Sequelize.TEXT
    }).then(function () {
      if (isSQLite(queryInterface.sequelize)) {
        // manual added index will be removed in sqlite
        return queryInterface.addIndex('Notes', ['shortid'])
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Notes', 'title', {
      type: Sequelize.STRING
    }).then(function () {
      if (isSQLite(queryInterface.sequelize)) {
        // manual added index will be removed in sqlite
        return queryInterface.addIndex('Notes', ['shortid'])
      }
    })
  }
}
