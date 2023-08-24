require('dotenv').config();

const express = require('express');
const router = express.Router();
const Project = require('../models/Project'); // Import your Project model
const protectRoute = require('../middlewares/authMiddleware');

const methodNotAllowed = (req, res, next) => res.status(405).json({ message: 'Method Not Allowed' });

// Fetch all projects
router.get('/', async (req, res) => {
    console.log('Processing GET request on / ...')

    setTimeout(async() => {
        try {
            const projects = await Project.findAll();
            res.json(projects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ message: 'Internal server error.' });
        }
    }, 2000);
});

router.post('/new', protectRoute, async (req, res, next) => {

    try {
        const { name, description, tech_stack, link, github_link } = req.body;

        // check if Project object is valid
        const expectedParams = ['name', 'description', 'tech_stack', 'link', 'github_link'];
        for (const param of expectedParams) {
            if (!(param in req.body) || req.body[param] === null) {
            return res.status(401).json({ message: 'Malformed or Corrupted Request.' });
            }
        }

        // Create a new project record
        await Project.create({
            name,
            description,
            tech_stack,
            link,
            github_link
        });
        res.status(201).json({ message: 'New project was created.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error.', error: error });
    }
});

router.all('/new', methodNotAllowed);

router.put('/:id', protectRoute, async (req, res, next) => {
    try {
        const projectId = req.params.id;
        const { name, description, tech_stack, link, github_link } = req.body;

        // check if Project object is valid
        const expectedParams = ['name', 'description', 'tech_stack', 'link', 'github_link'];
        for (const param of expectedParams) {
            if (!(param in req.body) || req.body[param] === null) {
            return res.status(401).json({ message: 'Malformed or Corrupted Request.' });
            }
        }

        // Find the project by ID
        const projectToUpdate = await Project.findByPk(projectId);

        if (!projectToUpdate) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Update the project fields
        projectToUpdate.name = name;
        projectToUpdate.description = description;
        projectToUpdate.tech_stack = tech_stack;
        projectToUpdate.link = link;
        projectToUpdate.github_link = github_link;

        // Save the updated project
        await projectToUpdate.save();

        return res.status(201).json({ message: 'Project was updated.', project: projectToUpdate });
    } catch (error) {
        next(error);
    }
});
    
// Delete a project
router.delete('/:id', protectRoute, async (req, res, next) => {
    try {
        const projectId = req.params.id;

        // Find the project by ID
        const projectToDelete = await Project.findByPk(projectId);

        if (!projectToDelete) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Delete the project
        await projectToDelete.destroy();

        return res.status(200).json({ message: 'Project deleted successfully.' });
    } catch (error) {
        next(error)
    }
});

router.all('/:id', methodNotAllowed);

module.exports = router;
