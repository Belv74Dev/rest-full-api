const { Model, DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

class Comment extends Model { }

Comment.init({
	author: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	comment: {
		type: DataTypes.STRING(255),
		allowNull: false,
		validate: {
			len: [3, 255],
		},
	},
}, {
	sequelize,
	modelName: 'comment',
});

module.exports = Comment;
