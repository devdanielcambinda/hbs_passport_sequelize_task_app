const path = require('path')
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, "../config/.env") });

const Sequelize = require("sequelize");

const sequelize = new Sequelize(process.env.DB_URL_LOCAL);

// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//   host: process.env.DB_HOST,
//   dialect:'postgres',
// })

module.exports = sequelize;
