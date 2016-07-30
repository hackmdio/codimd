"use strict";

// external modules
var Sequelize = require("sequelize");

// core
var logger = require("../logger.js");

module.exports = function (sequelize, DataTypes) {
    var Author = sequelize.define("Author", {
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
        ],
        classMethods: {
            associate: function (models) {
                Author.belongsTo(models.Note, {
                    foreignKey: "noteId",
                    as: "note",
                    constraints: false
                });
                Author.belongsTo(models.User, {
                    foreignKey: "userId",
                    as: "user",
                    constraints: false
                });
            }
        }
    });
    
    return Author;
};