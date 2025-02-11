const express = require('express');
const router = express.Router();
const Project = require('../../models/project');

router.post('/api/addProject', async (req, res) => {
    const { projectName } = req.body;

    if (!projectName) {
        return res.status(400).json({
            success: false,
            message: "Please enter the project name",
        });
    }

    try {
        let existingProject = await Project.findOne({ name: projectName });

        if (existingProject) {
            return res.status(400).json({
                success: false,
                message: "A Project with the same name already exists.",
            });
        }

        const newProject = new Project({ name: projectName });
        await newProject.save();

        res.status(201).json({
            success: true,
            message: "Project added successfully",
            project: newProject,
        });
    } catch (error) {
        console.error('Error adding Project:', error);
        res.status(500).json({
            success: false,
            message: "Error adding Project",
            error: error.message,
        });
    }
});

module.exports = router;
