'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Notes', 'title', {
      type: Sequelize.TEXT
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Notes', 'title', {
      type: Sequelize.STRING
    })
  }
}
