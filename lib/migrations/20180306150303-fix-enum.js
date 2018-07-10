'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('Notes', 'permission', {
      type: Sequelize.ENUM('freely', 'editable', 'limited', 'locked', 'protected', 'private')
    }).catch(function (error) {
      console.log(error)
    })
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.changeColumn('Notes', 'permission', {type: Sequelize.ENUM('freely', 'editable', 'locked', 'private')})
  }
}
