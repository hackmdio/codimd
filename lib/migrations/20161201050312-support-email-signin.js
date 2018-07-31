'use strict'
module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'email', Sequelize.TEXT).then(function () {
      return queryInterface.addColumn('Users', 'password', Sequelize.TEXT).catch(function (error) {
        if (error.message === "ER_DUP_FIELDNAME: Duplicate column name 'password'") {
          console.log('Migration has already run… ignoring.')
        } else {
          throw error
        }
      })
    }).catch(function (error) {
      if (error.message === "ER_DUP_FIELDNAME: Duplicate column name 'email'") {
        console.log('Migration has already run… ignoring.')
      } else {
        throw error
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'email').then(function () {
      return queryInterface.removeColumn('Users', 'password')
    })
  }
}
