const express = require("express");
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

const Holiday = require("../../models/holiday");
const User = require("../../models/user");
const { sendHolidayAdminEmail } = require("../Mail/holidayMail");

router.post("/api/holiday/:username", authenticateToken, async (req, res) => {
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

        // Notify the admin about the new request. A mail failure must not fail the request itself.
        let adminNotified = false;
        try {
            const user = await User.findOne({ username }).select("name").lean();
            await sendHolidayAdminEmail({
                userEmail: savedHoliday.email,
                userName: (user && user.name) || savedHoliday.username,
                leaveType: savedHoliday.leaveType,
                fromDate: from,
                toDate: to,
                workingDays: savedHoliday.workingDays,
                reason: savedHoliday.reason,
                status: savedHoliday.status
            });
            adminNotified = true;
        } catch (mailError) {
            console.error("Failed to send admin notification for holiday request:", mailError);
        }

        res.status(201).json({
            success: true,
            message: "Holiday request created successfully",
            data: savedHoliday,
            adminNotified
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