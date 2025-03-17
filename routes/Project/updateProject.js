const express = require('express');
const router = express.Router();
const Project = require('../../models/project');

router.put('/api/updateProject/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, assignedTo } = req.body;

        const updateData = {};
        
        if (name) {
            updateData.name = name;
        }
        
        if (assignedTo) {
            updateData.assignedTo = assignedTo;
        }

        const result = await Project.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Project updated successfully.",
            data: result,
        });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({
            success: false,
            message: "Error updating project",
            error: error.message,
        });
    }
});

module.exports = router;