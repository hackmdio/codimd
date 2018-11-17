'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Notes', 'shortid', {
      type: Sequelize.STRING,
      defaultValue: '0000000000',
      allowNull: false
    }).then(function () {
      return queryInterface.addIndex('Notes', ['shortid'], {
        indicesType: 'UNIQUE'
      })
    }).then(function () {
      return queryInterface.addColumn('Notes', 'permission', {
        type: Sequelize.STRING,
        defaultValue: 'private',
        allowNull: false
      })
    }).then(function () {
      return queryInterface.addColumn('Notes', 'viewcount', {
        type: Sequelize.INTEGER,
        defaultValue: 0
      })
    }).catch(function (error) {
      if (error.message === 'SQLITE_ERROR: duplicate column name: shortid' || error.message === "ER_DUP_FIELDNAME: Duplicate column name 'shortid'" || error.message === 'column "shortid" of relation "Notes" already exists') {
        console.log('Migration has already run… ignoring.')
      } else {
        throw error
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Notes', 'viewcount')
      .then(function () {
        return queryInterface.removeColumn('Notes', 'permission')
      })
      .then(function () {
        return queryInterface.removeIndex('Notes', ['shortid'])
      })
      .then(function () {
        return queryInterface.removeColumn('Notes', 'shortid')
      })
  }
}
