const express = require('express');
const router = express.Router();
const Subject = require('../../models/subject');

router.post('/api/addSubject', async (req, res) => {
    const { subjectName } = req.body;

    if (!subjectName) {
        return res.status(400).json({
            success: false,
            message: "Please enter the subject name",
        });
    }

    try {
        let existingSubject = await Subject.findOne({ name: subjectName });

        if (existingSubject) {
            return res.status(400).json({
                success: false,
                message: "A Subject with the same name already exists.",
            });
        }

        const newSubject = new Subject({ name: subjectName });
        await newSubject.save();

        res.status(201).json({
            success: true,
            message: "Subject added successfully",
            subject: newSubject,
        });
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({
            success: false,
            message: "Error adding subject",
            error: error.message,
        });
    }
});

module.exports = router;
