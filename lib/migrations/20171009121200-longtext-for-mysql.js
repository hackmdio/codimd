'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.changeColumn('Notes', 'content', {type: Sequelize.TEXT('long')})
    queryInterface.changeColumn('Revisions', 'patch', {type: Sequelize.TEXT('long')})
    queryInterface.changeColumn('Revisions', 'content', {type: Sequelize.TEXT('long')})
    queryInterface.changeColumn('Revisions', 'latContent', {type: Sequelize.TEXT('long')})
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.changeColumn('Notes', 'content', {type: Sequelize.TEXT})
    queryInterface.changeColumn('Revisions', 'patch', {type: Sequelize.TEXT})
    queryInterface.changeColumn('Revisions', 'content', {type: Sequelize.TEXT})
    queryInterface.changeColumn('Revisions', 'latContent', {type: Sequelize.TEXT})
  }
}
