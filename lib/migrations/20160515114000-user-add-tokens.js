'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('Users', 'accessToken', Sequelize.STRING)
    queryInterface.addColumn('Users', 'refreshToken', Sequelize.STRING)
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('Users', 'accessToken')
    queryInterface.removeColumn('Users', 'refreshToken')
  }
}
