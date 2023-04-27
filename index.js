const express = require('express');
const bodyParser = require('body-parser');

const dotenv = require('dotenv');

const sequelize = require('./utils/database');

const authRoutes = require('./routes/auth');
const dishesRoutes = require('./routes/dishes');

dotenv.config();

const { HOSTNAME, PORT } = process.env;

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/dishes', dishesRoutes);

const start = async () => {
	try {
		await sequelize.sync();
		app.listen(PORT, () => {
			console.log(`Server is running at http://${HOSTNAME}:${PORT}`);
		});
	} catch (e) {
		console.log(e);
	}
};

start();
