'use strict'

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Notes', 'permission', { type: Sequelize.ENUM('freely', 'editable', 'limited', 'locked', 'protected', 'private') })
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Notes', 'permission', { type: Sequelize.ENUM('freely', 'editable', 'locked', 'private') })
  }
}
