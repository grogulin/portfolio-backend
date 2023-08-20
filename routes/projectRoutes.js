const express = require('express');
const router = express.Router();
const Project = require('../models/Projects'); // Import your Project model


// Fetch all projects
router.get('/', async (req, res) => {
    console.log('Processing GET request on / ...')

    setTimeout(async() => {
        try {
            const projects = await Project.findAll();
            res.json(projects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }, 2000);
});

router.post('/new', async (req, res, next) => {
    try {
        const { name, description, tech_stack, link, github_link } = req.body;
        // Create a new project record
        const newProject = await Project.create({
            name,
            description,
            tech_stack,
            link,
            github_link
        });

        res.status(201).json(newProject);
    } catch (error) {
        next(error);
    }
    });

router.put('/:id', async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const { name, description, tech_stack, link, github_link } = req.body;

        // Find the project by ID
        const projectToUpdate = await Project.findByPk(projectId);

        if (!projectToUpdate) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Update the project fields
        projectToUpdate.name = name;
        projectToUpdate.description = description;
        projectToUpdate.tech_stack = tech_stack;
        projectToUpdate.link = link;
        projectToUpdate.github_link = github_link;

        // Save the updated project
        await projectToUpdate.save();

        res.json(projectToUpdate);
    } catch (error) {
        next(error);
    }
});
    
// Delete a project
router.delete('/:id', async (req, res, next) => {
    try {
        const projectId = req.params.id;

        // Find the project by ID
        const projectToDelete = await Project.findByPk(projectId);

        if (!projectToDelete) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Delete the project
        await projectToDelete.destroy();

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
