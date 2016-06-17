'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('Notes', 'savedAt', Sequelize.DATE);
    queryInterface.createTable('Revisions', {
      id: Sequelize.UUID,
      noteId: Sequelize.UUID,
      patch: Sequelize.TEXT,
      lastContent: Sequelize.TEXT,
      content: Sequelize.TEXT,
      length: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
    return;
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('Revisions');
    queryInterface.removeColumn('Notes', 'savedAt');
    return;
  }
};
