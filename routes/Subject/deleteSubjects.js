const express = require('express');
const router = express.Router();
const Subject = require('../../models/subject');

// Force delete all subjects
router.delete('/api/deleteAllSubjects', async (req, res) => {
    try {
        const result = await Subject.deleteMany({});
        
        // Optional: Double-check if deletion worked
        const remainingSubjects = await Subject.find();
        if (remainingSubjects.length > 0) {
            return res.status(500).json({
                success: false,
                message: "Some subjects were not deleted. Please try again.",
            });
        }

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} subjects successfully.`,
        });
    } catch (error) {
        console.error('Error deleting subjects:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting subjects",
            error: error.message,
        });
    }
});

// Delete a single subject by ID
router.delete('/api/deleteSubject/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Subject.findByIdAndDelete(id);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Subject deleted successfully.",
        });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting subject",
            error: error.message,
        });
    }
});

module.exports = router;
