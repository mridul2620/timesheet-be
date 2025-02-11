const express = require("express");
const router = express.Router();
const Timesheet = require("../../models/userTimesheet");

// GET timesheet data by username
router.get("/api/timesheet/:username", async (req, res) => {
    try {
        const { username } = req.params;
        console.log(`Fetching timesheet for: ${username}`);

        // Add this debug query to see ALL documents in the collection
        const allDocs = await Timesheet.find({});
        console.log("All documents in collection:", allDocs);

        // Your original query
        const timesheets = await Timesheet.find({ username });
        console.log("Filtered timesheets:", timesheets);

        if (!timesheets.length) {
            // Add more debug info in the 404 response
            return res.status(404).json({ 
                message: "No timesheets found for this user.",
                queriedUsername: username,
                totalDocumentsInDB: allDocs.length,
                availableUsernames: allDocs.map(t => t.username)
            });
        }

        res.status(200).json({ success: true, timesheets });

    } catch (error) {
        console.error("Error fetching timesheets:", error);
        res.status(500).json({ 
            message: "Internal Server Error",
            error: error.message 
        });
    }
});
  

module.exports = router;
