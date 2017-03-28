'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Notes', 'alias', {
      type: Sequelize.STRING
    }).then(function () {
      return queryInterface.addIndex('Notes', ['alias'], {
        indicesType: 'UNIQUE'
      })
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Notes', 'alias').then(function () {
      return queryInterface.removeIndex('Notes', ['alias'])
    })
  }
}
