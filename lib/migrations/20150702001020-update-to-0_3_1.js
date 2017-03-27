'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Notes', 'shortid', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    }).then(function () {
      return queryInterface.addColumn('Notes', 'permission', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 0
      })
    }).then(function () {
      return queryInterface.addColumn('Notes', 'viewcount', {
        type: Sequelize.INTEGER
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Notes', 'viewcount')
      .then(function () {
        return queryInterface.removeColumn('Notes', 'permission')
      })
      .then(function () {
        return queryInterface.removeColumn('Notes', 'shortid')
      })
  }
}
