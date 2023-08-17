const Sequelize = require('sequelize');
const { DataTypes } = require('sequelize');
const sequelize = require('../database'); // Import your Sequelize instance

const Project = sequelize.define('Project', {
    // id: {
    //     type: DataTypes.INTEGER,
    //     allowNull: false,
    // },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.JSONB, // JSONB data type to store Delta format content
        allowNull: false,
    },
    tech_stack: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    created_at: {
        type: DataTypes.DATE,
        field: 'created_at',
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
}
,{
    // Other model options
    timestamps: false, // Disable automatic createdAt and updatedAt columns
    tableName: 'projects', // Make sure this matches your actual table name
}
);

module.exports = Project;
