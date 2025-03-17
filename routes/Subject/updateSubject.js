const express = require('express');
const router = express.Router();
const Subject = require('../../models/subject');

router.put('/api/updateSubject/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, assignedTo } = req.body;

        // Validate assignedTo is an array if provided
        if (assignedTo && !Array.isArray(assignedTo)) {
            return res.status(400).json({
                success: false,
                message: "assignedTo must be an array",
            });
        }

        const result = await Subject.findByIdAndUpdate(
            id,
            { name, assignedTo },
            { new: true, runValidators: true } // Ensure validation rules are enforced
        );
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Subject updated successfully.",
            data: result,
        });
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({
            success: false,
            message: "Error updating subject",
            error: error.message,
        });
    }
});

module.exports = router;
