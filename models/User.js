const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('user', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      len: {
        args: [5, 20],
        msg: "Username must be between 5 and 20 characters long",
      },
    },
  },
  password: {
    type: DataTypes.VIRTUAL,
    allowNull: false,
    validate: {
      len: {
        args: [5, 25],
        msg: "Password must be between 5 and 25 characters long",
      }
    },
    set(val) {
      this.setDataValue('password', val);
      if (val) {
        const saltRounds = 10; // You can adjust this according to your needs
        const hashedPassword = bcrypt.hashSync(val, saltRounds);
        this.setDataValue('password_salt', hashedPassword);
      }
    },
  },
  password_salt: {
    type: DataTypes.STRING,
    allowNull: false,
  },
},{
    // Other model options
    timestamps: false, // Disable automatic createdAt and updatedAt columns
    tableName: 'users', // Make sure this matches your actual table name
});

module.exports = User;
