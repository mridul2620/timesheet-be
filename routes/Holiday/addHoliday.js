const express = require("express");
const router = express.Router();
const Holiday = require("../../models/holiday");

router.post("/api/holiday/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const { email, leaveType, from, to, reason, workingDays } = req.body;

        if (!email || !leaveType || !from || !to || !reason || !workingDays) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: email, leaveType, from, to, reason, workingDays"
            });
        }

        // Validate workingDays is a positive number
        if (workingDays < 1 || !Number.isInteger(workingDays)) {
            return res.status(400).json({
                success: false,
                message: "Working days must be a positive integer"
            });
        }

        const newHoliday = new Holiday({
            username,
            email,
            leaveType,
            from: new Date(from),
            to: new Date(to),
            reason,
            workingDays,
            status: "pending"
        });

        const savedHoliday = await newHoliday.save();

        res.status(201).json({
            success: true,
            message: "Holiday request created successfully",
            data: savedHoliday
        });

    } catch (error) {
        console.error("Error creating holiday request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;