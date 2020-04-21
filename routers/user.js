const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendGoodBuyEmail } = require('../emails/account');
// creating and saving all users
router.post('/user/signup', async (req, res) => {
	const user = new User(req.body);

	try {
		const token = await user.generateAuthToken();
		await user.save();
		sendWelcomeEmail(user.email, user.name);
		res.status(201).send({ user, token });
	} catch (e) {
		res.status(400).send(e);
	}
});

// login user
router.post('/user/login', async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const token = await user.generateAuthToken();
		res.send({ user, token });
	} catch (e) {
		res.status(400).send();
	}
});

// logout user
router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter(
			token => token.token !== req.token
		);

		await req.user.save();
		res.send();
	} catch (e) {
		res.status(500).send();
	}
});

// logout from all devices
router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (e) {
		res.status(500).send();
	}
});

// sending user profile
router.get('/users/me', auth, (req, res) => {
	res.send(req.user);
});

// // sending single user by ID
// router.get('/user/:id', async (req, res) => {
// 	const _id = req.params.id;

// 	try {
// 		const user = await User.findById(_id);
// 		if (!user) {
// 			return res.status(404).send();
// 		}
// 		res.send(user);
// 	} catch (e) {
// 		res.status(404).send(e);
// 	}
// });

// update user by ID
router.patch('/user/me', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password'];
	const isAllowed = updates.every(update => allowedUpdates.includes(update));

	if (!isAllowed) {
		return res.status(400).send({ error: 'Invalide update request value!' });
	}

	try {
		updates.forEach(update => {
			req.user[update] = req.body[update];
		});
		await req.user.save();
		res.send(req.user);
	} catch (e) {
		res.status(404).send(e);
	}
});

// Delete user
router.delete('/user/me', auth, async (req, res) => {
	await User.deleteOne(req.user);
	// await req.user.deleteOne();
	sendGoodBuyEmail(req.user.email, req.user.name);
	res.send(req.user);
});

// avatar (image upload)
const upload = multer({
	// dest: 'images',
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
			return cb(new Error('Please use jpg, png or jpeg image file!'));
		}

		cb(undefined, true);
	},
});

// Uploading profile pic
router.post(
	'/user/me/avatar',
	auth,
	upload.single('avatar'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize(250, 250)
			.png()
			.toBuffer();
		// req.user.avatar = req.file.buffer;
		req.user.avatar = buffer;
		await req.user.save();
		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);

// removing profile pic.
router.delete('/user/me/avatar', auth, async (req, res) => {
	req.user.avatar = undefined;
	await req.user.save();
	res.send();
});

// getting back image
router.get('/user/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user || !user.avatar) {
			throw new Error();
		}

		res.set('Content-Type', 'image/jpg');
		res.send(user.avatar);
	} catch (e) {
		res.status(404).send();
	}
});

module.exports = router;
