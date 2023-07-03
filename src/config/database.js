require("dotenv").config();

const { Sequelize } = require("sequelize");

// needs to be modified in case we are going to use NODE_ENV production or test
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
    dialect: process.env.DB_DIALECT,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);

module.exports = sequelize;
