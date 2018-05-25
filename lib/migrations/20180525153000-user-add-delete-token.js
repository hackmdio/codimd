'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'deleteToken', {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'deleteToken')
  }
}
