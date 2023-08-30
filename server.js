// modules import
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var sequelizePort = process.env.SEQUELIZE_PORT;
var app = express();

require('dotenv').config();

const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');

// routes import

const projectRoutes = require('./routes/projectRoutes');
const loginRoutes = require('./routes/signupRoutes');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.json());

// Assigning routes to endpoints
app.use('/projects', projectRoutes);
app.use('/auth', loginRoutes);

// Assign 405 error for unspecified methods
app.use('/', (req, res, next) => {
	res.status(405).json({ message: 'Method Not Allowed' });
});

sequelize.sync()
	.then(() => {
		console.log('Database synced');
		app.listen(sequelizePort, () => {
			console.log(`Sequelize server is running on port ${sequelizePort}`);
		});
	})
	.catch(error => {
		console.error('Error syncing database:', error);
	});

module.exports = app;
