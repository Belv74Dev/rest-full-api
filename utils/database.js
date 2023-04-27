const Sequelize = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const name = process.env.DB_NAME;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const dialect = process.env.DB_DIALECT;

const sequelize = new Sequelize(name, user, password, { host, dialect });

module.exports = sequelize;
