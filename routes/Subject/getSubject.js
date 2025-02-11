const express = require('express');
const router = express.Router();
const Subject = require('../../models/subject'); // Ensure correct path

router.get('/api/getSubjects', async (req, res) => {
    try {
        const subjects = await Subject.find();
        console.log("Fetched Subjects:", subjects); 
        const subjectList = subjects.map(subject => ({
            _id: subject._id,
            name: subject.name,
          }));
      
          res.status(200).json({ subjects: subjectList });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching subjects",
            error: error.message,
        });
    }
});

module.exports = router;
