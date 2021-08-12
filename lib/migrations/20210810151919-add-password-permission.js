'use strict'

// There is a bug that we cannot use changeColumn twice in db migration,
// so we write raw SQL here.
// refer to the issue https://github.com/sequelize/sequelize/issues/2554

module.exports = {
  up: async function (queryInterface, Sequelize) {
    await queryInterface.addColumn('Notes', 'password', Sequelize.TEXT)
    await queryInterface.addColumn('Notes', 'passwordVersion', Sequelize.INTEGER)
    await queryInterface.sequelize.query(`ALTER TYPE "enum_Notes_permission" ADD VALUE 'password'`)
  },

  // XXX: test down
  down: async function (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Notes', 'password')
    await queryInterface.removeColumn('Notes', 'passwordVersion')
    const query = 'DELETE FROM pg_enum ' +
      'WHERE enumlabel = \'password\' ' +
      'AND enumtypid = ( SELECT oid FROM pg_type WHERE typname = \'enum_Notes_permission\')'
    await queryInterface.sequelize.query(query)
  }
}
