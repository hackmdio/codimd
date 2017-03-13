module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('Notes', 'authorship', Sequelize.TEXT)
    queryInterface.addColumn('Revisions', 'authorship', Sequelize.TEXT)
    queryInterface.createTable('Authors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      color: Sequelize.STRING,
      noteId: Sequelize.UUID,
      userId: Sequelize.UUID,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('Authors')
    queryInterface.removeColumn('Revisions', 'authorship')
    queryInterface.removeColumn('Notes', 'authorship')
  }
}
