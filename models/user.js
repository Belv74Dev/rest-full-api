const { Model, DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

class User extends Model { }

User.init({
	login: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	password: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	role: {
		type: DataTypes.ENUM('guest', 'admin'),
		defaultValue: 'guest',
		allowNull: false,
	},
}, {
	sequelize,
	modelName: 'user',
});

module.exports = User;
