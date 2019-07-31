'use strict'
module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Notes', 'content', { type: Sequelize.TEXT('long') })
    await queryInterface.changeColumn('Revisions', 'patch', { type: Sequelize.TEXT('long') })
    await queryInterface.changeColumn('Revisions', 'content', { type: Sequelize.TEXT('long') })
    await queryInterface.changeColumn('Revisions', 'lastContent', { type: Sequelize.TEXT('long') })
  },

  down: async function (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Notes', 'content', { type: Sequelize.TEXT })
    await queryInterface.changeColumn('Revisions', 'patch', { type: Sequelize.TEXT })
    await queryInterface.changeColumn('Revisions', 'content', { type: Sequelize.TEXT })
    await queryInterface.changeColumn('Revisions', 'lastContent', { type: Sequelize.TEXT })
  }
}
