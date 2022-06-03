const Sequelize = require('sequelize')
const Op = Sequelize.Op
const Task = require('./task.js')
const bcrypt = require("bcryptjs")

const sequelize = require('../database/db');

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

User.beforeSave( async (user,options) => {

  if(user.changed('password')){
    user.password =  await bcrypt.hash(user.password,10)
  }

})

User.beforeDestroy( async (user,options)=>{

  await Task.destroy({where:{UserId: user.id}})

})

//instance method
User.prototype.validPassword =function(password){
    return bcrypt.compare(password,this.password)
}

module.exports = User