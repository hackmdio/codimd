'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Temp')
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Temp', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      date: Sequelize.TEXT,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    })
  }
}
