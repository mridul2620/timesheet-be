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
        const { timesheetId, status, rejectionReason } = req.body;

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

        // If status is rejected, require rejection reason
        if (status === "rejected" && (!rejectionReason || !rejectionReason.trim())) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required when rejecting a timesheet"
            });
        }

        // Prepare update object
        const updateData = { 
            timesheetStatus: status,
            statusUpdatedAt: new Date()
        };

        // Add rejection reason if status is rejected
        if (status === "rejected") {
            updateData.rejectionReason = rejectionReason.trim();
        } else {
            // Clear rejection reason if status is not rejected
            updateData.$unset = { rejectionReason: "" };
        }

        const timesheet = await Timesheet.findOneAndUpdate(
            { _id: timesheetId, username },
            updateData,
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