'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Notes', 'folderId', Sequelize.UUID).then(function () {
      return queryInterface.createTable('Folders', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true
        },
        name: Sequelize.TEXT,
        parentId: Sequelize.UUID,
        ownerId: Sequelize.UUID,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Folders').then(function () {
      return queryInterface.removeColumn('Notes', 'folderId')
    })
  }
}
