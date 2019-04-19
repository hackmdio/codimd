'use strict'

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Notes', 'authorship', { type: Sequelize.TEXT('long') })
    await queryInterface.changeColumn('Revisions', 'authorship', { type: Sequelize.TEXT('long') })
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Notes', 'authorship', { type: Sequelize.TEXT })
    await queryInterface.changeColumn('Revisions', 'authorship', { type: Sequelize.TEXT })
  }
}
