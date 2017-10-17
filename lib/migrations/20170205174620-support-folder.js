'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'folderId', Sequelize.UUID).then(function () {
      return queryInterface.addColumn('Notes', 'folderId', Sequelize.UUID)
    }).then(function () {
      return queryInterface.createTable('Folders', {
        id: {
          type: Sequelize.UUID,
          primaryKey: true
        },
        name: Sequelize.TEXT,
        ownerId: Sequelize.UUID,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,

        hierarchyLevel: Sequelize.INTEGER,
        parentId: Sequelize.UUID
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('Folders').then(function () {
      return queryInterface.removeColumn('Notes', 'folderId')
    }).then(function () {
      return queryInterface.removeColumn('Users', 'folderId')
    })
  }
}
