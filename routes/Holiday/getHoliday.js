const express = require("express");
const router = express.Router();
const Holiday = require("../../models/holiday");

router.get("/api/holiday", async (req, res) => {
    try {
        const holidays = await Holiday.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: "Holiday requests retrieved successfully",
            data: holidays,
            count: holidays.length
        });

    } catch (error) {
        console.error("Error fetching holiday requests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

router.get("/api/holiday/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const holidays = await Holiday.find({ username }).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: `Holiday requests for ${username} retrieved successfully`,
            data: holidays,
            count: holidays.length
        });

    } catch (error) {
        console.error("Error fetching user holiday requests:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;