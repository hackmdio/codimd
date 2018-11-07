'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return [
      queryInterface.addColumn('Users', 'displayname', {
        type: Sequelize.STRING
      }),
      queryInterface.addColumn('Users', 'username', {
        type: Sequelize.STRING
      })
    ]
  },

  down: function (queryInterface, Sequelize) {
    return [
      queryInterface.removeColumn('Users', 'displayname'),
      queryInterface.removeColumn('Users', 'username')
    ]
  }
}
