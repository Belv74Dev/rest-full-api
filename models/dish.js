const { Model, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
const sequelize = require('../utils/database');

const Tag = require('./tag');
const Comment = require('./comment');

class Dish extends Model { }

Dish.init({
	title: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
		validate: {
			customValidator: async (value) => {
				const dish = await Dish.findOne({ where: { title: value } });
				if (dish) throw new Error('dish.title already exists');
			},
		},
	},
	anons: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	text: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	image: {
		type: DataTypes.STRING,
		allowNull: false,
		validate: {
			isImage(value) {
				if (!/\.(png|jpg|jpeg)$/i.test(value)) {
					throw new Error('dish.image invalid file format');
				}
			},
			maxFileSize(value) {
				if (value.size > 2 * 1024 * 1024) {
					throw new Error('dish.image file size should not be greater than 2MB');
				}
			},
		},
	},
}, {
	sequelize,
	modelName: 'dish',
	defaultScope: {
		attributes: { exclude: ['updatedAt'] },
	},
});

Dish.beforeDestroy(async (dish, options) => {
	if (dish.image && fs.existsSync(dish.image)) {
		fs.unlink(
			path.join(__dirname, '../public/dish_images', dish.image),
			(err) => {
				if (err) console.error(err);
			},
		);
	}
});

Dish.belongsToMany(Tag, { through: 'dishTag' });
Tag.belongsToMany(Dish, { through: 'dishTag' });

Dish.hasMany(Comment, { foreignKey: 'dishId' });
Dish.beforeDestroy(async (dish) => {
	await Comment.destroy({ where: { dishId: dish.id } });
});

module.exports = Dish;
