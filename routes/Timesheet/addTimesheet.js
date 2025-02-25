const express = require("express");
const router = express.Router();
const Timesheet = require("../../models/userTimesheet");

router.post("/api/timesheet/submit", async (req, res) => {
    try {
        // console.log("Received timesheet submission:", {
        //     username: req.body.username,
        //     weekStartDate: req.body.weekStartDate,
        //     entriesCount: req.body.entries?.length,
        //     hasDescription: !!req.body.workDescription,
        //     hasDayStatus: !!req.body.dayStatus
        // });

        const { username, weekStartDate, entries, workDescription, dayStatus } = req.body;

        if (!username || !weekStartDate || !entries) {
            return res.status(400).json({ 
                message: "Missing required fields",
                received: { username, weekStartDate, entriesCount: entries?.length }
            });
        }
        const timesheet = new Timesheet({
            username,
            weekStartDate,
            entries,
            workDescription,
            dayStatus
        });

        const savedTimesheet = await timesheet.save();
        const verification = await Timesheet.findById(savedTimesheet._id);

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
