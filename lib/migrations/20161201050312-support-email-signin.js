'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('Users', 'email', Sequelize.TEXT);
    queryInterface.addColumn('Users', 'password', Sequelize.TEXT);
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('Users', 'email');
    queryInterface.removeColumn('Users', 'password');
  }
};
