'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.changeColumn('Notes', 'authorship', {type: Sequelize.TEXT('long')})
    queryInterface.changeColumn('Revisions', 'authorship', {type: Sequelize.TEXT('long')})
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.changeColumn('Notes', 'authorship', {type: Sequelize.TEXT})
    queryInterface.changeColumn('Revisions', 'authorship', {type: Sequelize.TEXT})
  }
}
