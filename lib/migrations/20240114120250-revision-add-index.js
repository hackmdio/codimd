'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('Revisions', ['noteId'], {})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('Revisions', 'noteId')
  }
}
