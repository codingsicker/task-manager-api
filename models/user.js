const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true,
			required: true,
			minlength: 3,
		},
		email: {
			type: String,
			trim: true,
			lowercase: true,
			required: true,
			unique: true,
			validate(value) {
				if (!validator.isEmail(value)) {
					throw new Error('Please provide a valide email!');
				}
			},
		},
		password: {
			type: String,
			trim: true,
			minlength: 7,
			required: true,
			validate(value) {
				if (value.toLowerCase().includes('password')) {
					throw new Error('Password could not contains "password"');
				}
			},
		},
		tokens: [
			{
				token: {
					type: String,
					required: true,
				},
			},
		],
		avatar: {
			type: Buffer,
		},
	},
	{
		timestamps: true,
	}
);

// Virtual relation between task and user
userSchema.virtual('tasks', {
	ref: 'Task',
	localField: '_id',
	foreignField: 'owner',
});

// filtering user profile data.
userSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.tokens;
	delete userObject.avatar;

	return userObject;
};

// Creating and storing json web tokens
userSchema.methods.generateAuthToken = async function () {
	const token = jwt.sign({ _id: this._id.toString() }, process.env.JWT_SECRET, {
		expiresIn: '7 days',
	});
	this.tokens = this.tokens.concat({ token });
	await this.save();
	return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
	const user = await User.findOne({ email });
	if (!user) {
		throw new Error('Unable to login!');
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error('Unable to login!');
	}

	return user;
};

userSchema.pre('save', async function (next) {
	if (this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 8);
	}
	next();
});

// deleting related tasks to user
userSchema.pre('deleteOne', async function (next) {
	const user = this;
	await Task.deleteMany({ owner: user._conditions._id });
	// console.log(user);
	// await Task.deleteMany({ owner: user._id });
	next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
