require('./database/mongoose'); // connecting to the mongoose db
const express = require('express');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
	console.log(`App is running on port ${port}`);
});

// // Example mongoose populate
// const Task = require('./models/task');
// const User = require('./models/user');
// const main = async () => {
// 	// const task = await Task.findById('5e9d486a697df623e003a491');
// 	// await task.populate('owner').execPopulate();
// 	// console.log(task.owner);

// 	const user = await User.findById('5e9d4851697df623e003a48f');
// 	await user.populate('tasks').execPopulate();
// 	console.log(user.tasks);
// };

// main();
