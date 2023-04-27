const path = require('path');
const fs = require('fs');
const { Router } = require('express');
const { Op } = require('sequelize');
const { uploadImage, deleteUploadedImage, uploadNone } = require('../middlewares/upload');
const { authUserMiddleware, authAdminMiddleware } = require('../middlewares/auth');

const Dish = require('../models/dish');
const User = require('../models/user');
const Tag = require('../models/tag');
const Comment = require('../models/comment');

const router = Router();

router.post('/', [authAdminMiddleware, uploadImage, deleteUploadedImage], async (req, res) => {
	try {
		const { title, anons, text, tags } = req.body;
		const image = req?.file?.filename;

		const dish = await Dish.create({
			title, anons, text, image,
		});

		if (tags) {
			const stringTags = tags.replace(/ /g, '').toLowerCase();
			const arrTags = stringTags === '' ? [] : stringTags.split(',');

			const tagsForAdd = await Promise.all(
				arrTags.map(async (name) => {
					let tag = await Tag.findOne({ where: { name } });
					if (!tag) tag = await Tag.create({ name });
					return tag;
				}),
			);
			await dish.addTags(tagsForAdd);
		}

		return res.status(201).json({
			status: true,
			dishId: dish.id,
		});
	} catch (err) {
		if (err.name === 'SequelizeValidationError') {
			const message = {};
			err.errors.forEach((error) => {
				message[error.path] = error.message;
			});
			return res.status(400).json({
				status: false,
				message,
			});
		}

		return res.status(500).json({
			status: false,
			message: 'server error',
		});
	}
});

router.patch('/:dishId', [authAdminMiddleware, uploadImage, deleteUploadedImage], async (req, res) => {
	try {
		const { dishId } = req.params;
		const { title, anons, text, tags } = req.body;
		const image = req?.file?.filename;

		const dish = await Dish.findOne({
			where: { id: dishId },
			include: {
				model: Tag,
				attributes: ['name'],
				through: { attributes: [] },
			},
		});

		if (!dish) {
			return res.status(404).json({
				status: false,
				message: 'dish not found',
			});
		}

		if (image) {
			const imagePath = path.join(__dirname, '../public/dish_images', dish.image);
			if (fs.existsSync(imagePath)) {
				fs.unlinkSync(imagePath);
			}
		}

		await dish.update({
			title, anons, text, image,
		});

		if (tags !== undefined) {
			const stringTags = tags.replace(/ /g, '').toLowerCase();
			const arrTags = stringTags === '' ? [] : stringTags.split(',');

			const currentTags = dish.tags.map(({ name }) => name);
			if (currentTags && currentTags.length) {
				await Promise.all(
					currentTags.map(async (name) => {
						console.log('name', name);
						const tag = await Tag.findOne({ where: { name } });
						await dish.removeTags(tag);
					}),
				);
			}

			const tagsForAdd = await Promise.all(
				arrTags.map(async (name) => {
					let tag = await Tag.findOne({ where: { name } });
					if (!tag) tag = await Tag.create({ name });
					return tag;
				}),
			);
			await dish.addTags(tagsForAdd);
			await dish.reload({ include: Tag });
		}

		return res.status(200).json({
			status: true,
			dish: {
				...dish.dataValues,
				tags: dish.tags.map((tag) => tag.name),
			},
		});
	} catch (err) {
		if (err.name === 'SequelizeValidationError') {
			const message = {};
			err.errors.forEach((error) => {
				message[error.path] = error.message;
			});
			return res.status(400).json({
				status: false,
				message,
			});
		}

		return res.status(500).json({
			status: false,
			message: 'server error',
		});
	}
});

router.delete('/:dishId', [authAdminMiddleware, uploadNone], async (req, res) => {
	try {
		const { dishId } = req.params;

		const dish = await Dish.findOne({ where: { id: dishId } });

		if (!dish) {
			return res.status(404).json({
				status: false,
				message: 'dish not found',
			});
		}

		dish.destroy();

		return res.status(200).json({ status: true });
	} catch {
		return res.status(500).json({
			status: false,
			message: 'server error',
		});
	}
});

router.get('/', authUserMiddleware, async (req, res) => {
	try {
		const dishes = await Dish.findAll({
			include: {
				model: Tag,
				attributes: ['name'],
				through: { attributes: [] },
			},
		});

		const dishesWithTags = dishes.map((dish) => {
			const tags = dish.tags.map(({ name }) => name);
			return {
				...dish.toJSON(),
				tags,
			};
		});

		return res.status(200).json(dishesWithTags);
	} catch {
		return res.status(500).json({
			status: false,
			message: 'server error',
		});
	}
});

router.get('/:dishId', authUserMiddleware, async (req, res) => {
	try {
		const { dishId } = req.params;

		const dish = await Dish.findOne({
			where: { id: dishId },
			include: [
				{
					model: Comment,
					attributes: {
						exclude: ['dishId'],
					},
				},
				{
					model: Tag,
					attributes: ['name'],
					through: { attributes: [] },
				},
			],
		});

		if (!dish) {
			return res.status(404).json({
				status: false,
				message: 'dish not found',
			});
		}

		const tags = dish.tags.map(({ name }) => name);

		return res.status(200).json({
			...dish.toJSON(),
			tags,
		});
	} catch {
		return res.status(500).json({
			status: false,
			message: 'server error',
		});
	}
});

router.post('/:dishId/comments', [authUserMiddleware, uploadNone], async (req, res) => {
	try {
		const userId = req.id;
		const { dishId } = req.params;
		const { author, comment } = req.body;

		const user = await User.findOne({ where: { id: userId } });
		const dish = await Dish.findOne({ where: { id: dishId } });

		if (!dish) {
			return res.status(404).json({
				status: false,
				message: 'dish not found',
			});
		}

		const commentItem = await Comment.create({
			dishId,
			author: user.role === 'admin' ? `admin ${author}`.trim() : author,
			comment,
		});

		await dish.addComments(commentItem);

		return res.status(201).json({ status: true });
	} catch (err) {
		if (err.name === 'SequelizeValidationError') {
			const message = {};
			err.errors.forEach((error) => {
				message[error.path] = error.message;
			});
			return res.status(400).json({
				status: false,
				message,
			});
		}

		return res.status(500).json({
			status: false,
			message: 'server error',
		});
	}
});

router.delete('/:dishId/comments/:commentId', authAdminMiddleware, async (req, res) => {
	try {
		const { dishId, commentId } = req.params;

		const dish = await Dish.findOne({ where: { id: dishId } });

		if (!dish) {
			return res.status(404).json({
				status: false,
				message: 'dish not found',
			});
		}

		const comment = await Comment.findOne({
			where: {
				id: commentId,
				dishId: dish.id,
			},
		});

		if (!comment) {
			return res.status(404).json({
				status: false,
				message: 'comment not found',
			});
		}

		await comment.destroy();

		return res.status(200).json({ status: true });
	} catch {
		return res.status(500).json({
			status: false,
			message: 'server error',
		});
	}
});

router.get('/tag/search', authUserMiddleware, async (req, res) => {
	try {
		const { tagName } = req.query;

		const dishes = await Dish.findAll({
			include: {
				model: Tag,
				where: {
					name: {
						[Op.like]: `%${tagName}%`,
					},
				},
				attributes: ['name'],
				through: { attributes: [] },
			},
		});

		const dishesWithTags = dishes.map((dish) => {
			const tags = dish.tags.map(({ name }) => name);
			return {
				...dish.toJSON(),
				tags,
			};
		});

		return res.status(200).json(dishesWithTags);
	} catch {
		return res.status(500).json({
			error: 'Internal server error',
		});
	}
});

module.exports = router;
