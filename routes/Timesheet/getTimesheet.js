const express = require("express");
const router = express.Router();
const Timesheet = require("../../models/userTimesheet");

router.get("/api/timesheet/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const { weekStart } = req.query;
        let query = { username };
        if (weekStart) {
            query.weekStartDate = weekStart;
        }
        
        const timesheets = await Timesheet.find(query).sort({ updatedAt: -1 });
        let allDocs = [];
        if (!timesheets.length) {
            allDocs = await Timesheet.find({});
            return res.status(404).json({ 
                message: "No timesheets found for this user.",
                queriedUsername: username,
                weekFilterApplied: !!weekStart,
                queriedWeek: weekStart,
                totalDocumentsInDB: allDocs.length,
                availableUsernames: [...new Set(allDocs.map(t => t.username))]
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

router.post("/api/timesheet/:username/status", async (req, res) => {
    try {
        const { username } = req.params;
        const { timesheetId, status } = req.body;

        if (!timesheetId || !status) {
            return res.status(400).json({
                success: false,
                message: "timesheetId and status are required"
            });
        }

        if (!["unapproved", "approved", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be one of: unapproved, approved, rejected"
            });
        }

        const timesheet = await Timesheet.findOneAndUpdate(
            { _id: timesheetId, username },
            { $set: { timesheetStatus: status } },
            { new: true }
        );

        if (!timesheet) {
            return res.status(404).json({
                success: false,
                message: "Timesheet not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Timesheet status updated successfully",
            timesheet
        });

    } catch (error) {
        console.error("Error updating timesheet status:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
});

module.exports = router;