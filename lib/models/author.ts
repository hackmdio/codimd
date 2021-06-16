// external modules

import {Model, DataTypes} from "sequelize";
import {MySequelize, AuthorAttributes, ModelObj, UserModel} from "./baseModel";

export class Author extends Model<AuthorAttributes> implements AuthorAttributes {
  color: string;
  id: string;

  userId?: string
  user?: UserModel

  static initialize(sequelize: MySequelize): void {
    Author.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        color: {
          type: DataTypes.STRING
        }
      },
      {
        sequelize,
        indexes: [
          {
            unique: true,
            fields: ['noteId', 'userId']
          }
        ]
      })
  }

  static associate(models: ModelObj): void {
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
}
