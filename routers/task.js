const express = require('express');
const Task = require('../models/task');
const router = express.Router();
const auth = require('../middleware/auth');

// creating and saving task
router.post('/task', auth, async (req, res) => {
	const task = new Task({
		...req.body,
		owner: req.user._id,
	});

	try {
		await task.save();
		res.status(201).send(task);
	} catch (e) {
		res.status(400).send(e);
	}
});

// fetching all tasks
router.get('/tasks', auth, async (req, res) => {
	const match = {};
	const sort = {};

	if (req.query.completed) {
		match.completed = req.query.completed === 'true';
	}

	if (req.query.sortBy) {
		const value = req.query.sortBy.split(':');
		sort[value[0]] = value[1] === 'desc' ? -1 : 1;
	}

	try {
		// const tasks = await Task.find({ owner: req.user._id });
		await req.user
			.populate({
				path: 'tasks',
				match,
				options: {
					limit: parseInt(req.query.limit),
					skip: parseInt(req.query.skip),
					sort,
				},
			})
			.execPopulate();
		const tasks = req.user.tasks;
		if (tasks.length === 0) {
			return res.status(204).send({ error: 'Empty tasks!' });
		}
		res.send(tasks);
	} catch (e) {
		res.status(500).send(e);
	}
});

// fetching single task using ID
router.get('/task/:id', auth, async (req, res) => {
	const _id = req.params.id;
	try {
		// const task = await Task.findById(_id);
		const task = await Task.findOne({ _id, owner: req.user._id });
		if (!task) {
			return res.status(404).send();
		}
		res.send(task);
	} catch (e) {
		res.status(500).send(e);
	}
});

// update task
router.patch('/task/:id', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['description', 'completed'];
	const isAllowed = updates.every(update => allowedUpdates.includes(update));

	if (!isAllowed) {
		return res.status(400).send({ error: 'Invalide update request value!' });
	}

	try {
		const task = await Task.findOne({
			_id: req.params.id,
			owner: req.user._id,
		});

		if (!task) {
			return res.status(404).send({ error: 'Task not found!' });
		}

		updates.forEach(update => {
			task[update] = req.body[update];
		});
		await task.save();

		res.send(task);
	} catch (e) {
		res.status(500).send(e);
	}
});

// Delete task
router.delete('/task/:id', auth, async (req, res) => {
	const task = await Task.findOneAndDelete({
		_id: req.params.id,
		owner: req.user._id,
	});

	if (!task) {
		return res.status(404).send({ error: 'Can not delete, task not found!' });
	}

	res.send(task);
});

module.exports = router;
