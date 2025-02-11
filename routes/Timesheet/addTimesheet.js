const express = require("express");
const router = express.Router();
const Timesheet = require("../../models/userTimesheet");

// POST API to save timesheet
router.post("/api/timesheet/submit", async (req, res) => {
    try {
        console.log("Received timesheet submission:", {
            username: req.body.username,
            weekStartDate: req.body.weekStartDate,
            entriesCount: req.body.entries?.length,
            hasDescription: !!req.body.workDescription,
            hasDayStatus: !!req.body.dayStatus
        });

        const { username, weekStartDate, entries, workDescription, dayStatus } = req.body;

        // Validate required fields
        if (!username || !weekStartDate || !entries) {
            return res.status(400).json({ 
                message: "Missing required fields",
                received: { username, weekStartDate, entriesCount: entries?.length }
            });
        }

        // Create new timesheet document
        const timesheet = new Timesheet({
            username,
            weekStartDate,
            entries,
            workDescription,
            dayStatus
        });

        // Add debug log before save
        console.log("Attempting to save timesheet:", timesheet);

        // Save and capture the saved document
        const savedTimesheet = await timesheet.save();

        // Verify save was successful
        console.log("Timesheet saved successfully:", savedTimesheet);

        // Verify it exists in the database immediately after save
        const verification = await Timesheet.findById(savedTimesheet._id);
        console.log("Verification query result:", verification);

        res.status(201).json({ 
            message: "Timesheet submitted successfully",
            savedId: savedTimesheet._id
        });

    } catch (error) {
        console.error("Error saving timesheet:", {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
});

module.exports = router;
