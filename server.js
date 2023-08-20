require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors'); // Import the 'cors' package
const sequelize = require('./config/database'); // Import your Sequelize instance

const bodyParser = require('body-parser');

const projectRoutes = require('./routes/projectRoutes');
const signupRoutes = require('./routes/signupRoutes');
const loginRoutes = require('./routes/loginRoutes');


var sequelizePort = process.env.SEQUELIZE_PORT;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

const corsOptions = {
  origin: 'http://localhost:3000',
  // Add other CORS options if needed
};

app.use(bodyParser.json());

app.use('/projects', projectRoutes);
app.use('/auth', signupRoutes);
app.use('/auth', loginRoutes);

sequelize
  .sync()
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
