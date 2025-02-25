const express = require("express");
const router = express.Router();
const Timesheet = require("../../models/userTimesheet");

router.get("/api/timesheet/:username", async (req, res) => {
    try {
        const { username } = req.params;
        // console.log(`Fetching timesheet for: ${username}`);
        const timesheets = await Timesheet.find({ username });
        // console.log("Filtered timesheets:", timesheets);

        if (!timesheets.length) {
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
