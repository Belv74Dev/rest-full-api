const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './public/dish_images');
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		const extension = path.extname(file.originalname);
		cb(null, uniqueSuffix + extension);
	},
});

const fileFilter = (req, file, cb) => {
	if (file.mimetype.includes('image')) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const uploadImage = multer({ storage, fileFilter }).single('image');

const deleteUploadedImage = (req, res, next) => {
	res.on('finish', () => {
		if (res.statusCode >= 400) {
			const filePath = req.file && req.file.path;
			if (filePath) {
				fs.unlink(filePath, (err) => {
					if (err) {
						console.error(`Error deleting file ${filePath}: ${err}`);
					} else {
						console.log(`Deleted file ${filePath}`);
					}
				});
			}
		}
	});
	next();
};

const upload = multer();

const uploadNone = upload.none();

module.exports = { uploadImage, deleteUploadedImage, uploadNone };
