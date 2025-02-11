const express = require('express');
const router = express.Router();
const Project = require('../../models/project'); // Ensure correct path

// Get all projects
router.get('/api/getProjects', async (req, res) => {
    try {
        const projects = await Project.find({});
        res.status(200).json({
            success: true,
            message: "Projects retrieved successfully",
            projects,
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching projects",
            error: error.message,
        });
    }
});

module.exports = router;