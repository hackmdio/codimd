'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.changeColumn('Notes', 'permission', { type: Sequelize.ENUM('freely', 'editable', 'limited', 'locked', 'protected', 'private') })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.changeColumn('Notes', 'permission', { type: Sequelize.ENUM('freely', 'editable', 'locked', 'private') })
  }
}
