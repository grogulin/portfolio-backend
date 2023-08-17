const express = require('express');
const router = express.Router();
const Project = require('../models/Projects'); // Import your Project model

// Fetch all projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await Project.findAll();
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/projects/new', async (req, res, next) => {
    try {
        const { name, description, tech_stack, link } = req.body;
        // Create a new project record
        const newProject = await Project.create({
            name,
            description,
            tech_stack,
            link,
        });

        res.status(201).json(newProject);
    } catch (error) {
        next(error);
    }
    });

module.exports = router;
