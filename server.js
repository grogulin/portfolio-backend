
// modules import

require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const sequelize = require('./config/database');
const bodyParser = require('body-parser');

// routes import

const projectRoutes = require('./routes/projectRoutes');
const loginRoutes = require('./routes/signupRoutes');

var sequelizePort = process.env.SEQUELIZE_PORT;


var app = express();
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
};

app.use(bodyParser.json());

app.use('/projects', projectRoutes);
app.use('/auth', loginRoutes);
app.use('/', (req, res, next) => {
  // Unsupported HTTP method
  res.status(405).json({ message: 'Method Not Allowed' });
});


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
