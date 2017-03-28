'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Notes', 'title', {
      type: Sequelize.TEXT
    }).then(function () {
      // manual added index will be removed in sqlite
      return queryInterface.addIndex('Notes', ['shortid'])
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Notes', 'title', {
      type: Sequelize.STRING
    }).then(function () {
      return queryInterface.addIndex('Notes', ['shortid'])
    })
  }
}
