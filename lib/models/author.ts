// external modules
import * as Sequelize from "sequelize";

export = function (sequelize, DataTypes) {
  const Author = sequelize.define('Author', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    color: {
      type: DataTypes.STRING
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['noteId', 'userId']
      }
    ]
  })

  Author.associate = function (models) {
    Author.belongsTo(models.Note, {
      foreignKey: 'noteId',
      as: 'note',
      constraints: false,
      onDelete: 'CASCADE',
      hooks: true
    })
    Author.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      constraints: false,
      onDelete: 'CASCADE',
      hooks: true
    })
  }

  return Author
}
