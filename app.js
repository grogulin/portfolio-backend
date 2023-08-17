var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors'); // Import the 'cors' package
const sequelize = require('./database'); // Import your Sequelize instance

const bodyParser = require('body-parser');

var projectRoutes = require('./routes/projectRoutes');

var sequelizePort = '3002';

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

app.use(bodyParser.json());


app.use(projectRoutes);

sequelize
  .sync()
  .then(() => {
    console.log('Database synced');
    app.listen(sequelizePort, () => {
      console.log(`Server is running on port ${sequelizePort}`);
    });
  })
  .catch(error => {
    console.error('Error syncing database:', error);
  });


module.exports = app;
