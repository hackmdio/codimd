'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Users', 'accessToken', {
      type: Sequelize.TEXT
    }).then(function () {
      return queryInterface.changeColumn('Users', 'refreshToken', {
        type: Sequelize.TEXT
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Users', 'accessToken', {
      type: Sequelize.STRING
    }).then(function () {
      return queryInterface.changeColumn('Users', 'refreshToken', {
        type: Sequelize.STRING
      })
    })
  }
}
