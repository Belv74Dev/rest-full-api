const { Model, DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

class Tag extends Model { }

Tag.init({
	name: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
}, {
	sequelize,
	modelName: 'tag',
});

module.exports = Tag;
