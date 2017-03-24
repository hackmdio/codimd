'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'accessToken', Sequelize.STRING).then(function () {
      return queryInterface.addColumn('Users', 'refreshToken', Sequelize.STRING)
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'accessToken').then(function () {
      return queryInterface.removeColumn('Users', 'refreshToken')
    })
  }
}
