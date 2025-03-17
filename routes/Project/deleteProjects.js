const express = require('express');
const router = express.Router();
const Project = require('../../models/project'); // Ensure correct path

// Force delete all projects
router.delete('/api/deleteAllProjects', async (req, res) => {
    try {
        const result = await Project.deleteMany({});
        
        // Optional: Double-check if deletion worked
        const remainingProjects = await Project.find();
        if (remainingProjects.length > 0) {
            return res.status(500).json({
                success: false,
                message: "Some projects were not deleted. Please try again.",
            });
        }

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} projects successfully.`,
        });
    } catch (error) {
        console.error('Error deleting projects:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting projects",
            error: error.message,
        });
    }
});

// Delete a single project by ID
router.delete('/api/deleteProject/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Project.findByIdAndDelete(id);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Project deleted successfully.",
        });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting project",
            error: error.message,
        });
    }
});

module.exports = router;
