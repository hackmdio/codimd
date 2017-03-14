'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('Notes', 'deletedAt', Sequelize.DATE)
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('Notes', 'deletedAt')
  }
}
