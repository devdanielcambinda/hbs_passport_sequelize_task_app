const Sequelize = require('sequelize');
const User = require('./user');

const sequelize = require("../database/db");

const Task = sequelize.define("Task",{
    id: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    description: {
      required: true,
      type: Sequelize.STRING,
      unique: false,
      allowNull: false,
    },
    completed: {
      type: Sequelize.BOOLEAN,
      required: true,
      allowNull: false,
      unique: false,
    }
  },{
    timestamps: true,
  }
)

User.hasMany(Task);
Task.belongsTo(User);


module.exports = Task