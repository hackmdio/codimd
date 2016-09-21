"use strict";

module.exports = {
    up: function (queryInterface, Sequelize) {
        queryInterface.addColumn('Users', 'shortname', Sequelize.STRING);
        return;
    },

    down: function (queryInterface, Sequelize) {
        queryInterface.removeColumn('Users', 'shortname');
        return;
    }
};
