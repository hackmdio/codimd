'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'email', Sequelize.TEXT).then(function () {
      return queryInterface.addColumn('Users', 'password', Sequelize.TEXT)
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'email').then(function () {
      return queryInterface.removeColumn('Users', 'password')
    })
  }
}
