const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

const User = require('../models/user');

dotenv.config();

const { JWT_SECRET } = process.env;

const router = express.Router();

router.post('/', async (req, res) => {
	try {
		const { login, password } = req.body;
		const user = await User.findOne({ where: { login } });

		if (!user) {
			return res.status(401).json({
				status: false,
				message: 'invalid authorization data',
			});
		}

		const isPasswordCorrect = await bcrypt.compare(password, user.password);

		if (!isPasswordCorrect) {
			return res.status(401).json({
				status: false,
				message: 'invalid authorization data',
			});
		}

		const token = jwt.sign({ id: user.id }, JWT_SECRET);

		return res.status(200).json({
			status: true,
			token,
		});
	} catch (err) {
		return res.status(500).json({
			status: false,
			message: 'server error',
		});
	}
});

module.exports = router;
