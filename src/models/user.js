const Sequelize = require('sequelize')
const bcrypt = require("bcryptjs")

const sequelize = require('../database/db')

//set user table
const User = sequelize.define(
  "User",
  {
    id: {
      type: Sequelize.INTEGER,
      unique: true,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      required: true,
      type: Sequelize.STRING,
      unique: false,
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING,
      required: true,
      unique: true,
      allowNull: false,
      isEmail: true,
    },
    password: {
      required: true,
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

User.beforeCreate( async (user,options) => {
    user.password =  await bcrypt.hash(user.password,10)
})

//model method
User.prototype.validPassword =function(password){
    return bcrypt.compare(password,this.password)
}

//create all the define tables in the specified database

module.exports = User