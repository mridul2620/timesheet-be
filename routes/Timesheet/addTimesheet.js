const express = require("express");
const router = express.Router();
const Timesheet = require("../../models/userTimesheet");
const mongoose = require("mongoose");

router.post("/api/timesheet/submit", async (req, res) => {
    try {
        const { username, weekStartDate, entries, workDescription, dayStatus } = req.body;

        // Check for all required fields
        if (!username || !weekStartDate || !entries) {
            return res.status(400).json({ 
                message: "Missing required fields",
                received: { username, weekStartDate, entriesCount: entries?.length }
            });
        }
        
        // Specifically check for work description
        if (!workDescription || workDescription.trim() === '') {
            return res.status(400).json({ 
                message: "Please add a work description"
            });
        }
        
        // Check if a timesheet already exists for this week to prevent duplicates
        const existingTimesheet = await Timesheet.findOne({
            username,
            weekStartDate
        });
        
        if (existingTimesheet) {
            return res.status(409).json({
                message: "A timesheet for this week already exists",
                existingId: existingTimesheet._id
            });
        }
        
        const timesheet = new Timesheet({
            username,
            weekStartDate,
            entries,
            workDescription,
            dayStatus: dayStatus || {}, // Ensure dayStatus is saved, default to empty object
            timesheetStatus: "unapproved"
        });

        const savedTimesheet = await timesheet.save();

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
        
        if (error.name === 'ValidationError' && error.errors && error.errors.workDescription) {
            return res.status(400).json({ 
                message: "Please add a work description"
            });
        }
        
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
});

router.put("/api/timesheet/update/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { username, entries, workDescription, dayStatus } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid timesheet ID format"
            });
        }

        if (!workDescription || workDescription.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Please add a work description"
            });
        }

        const timesheet = await Timesheet.findById(id);
        
        if (!timesheet) {
            return res.status(404).json({
                success: false,
                message: "Timesheet not found"
            });
        }
        
        if (timesheet.username !== username) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this timesheet"
            });
        }

        if (timesheet.timesheetStatus !== "rejected") {
            return res.status(400).json({
                success: false,
                message: "Only rejected timesheets can be updated"
            });
        }
        
        const updatedTimesheet = await Timesheet.findByIdAndUpdate(
            id,
            {
                entries,
                workDescription,
                dayStatus: dayStatus || {},
                timesheetStatus: "unapproved",
                updatedAt: new Date()
            },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: "Timesheet updated successfully",
            timesheet: updatedTimesheet
        });
        
    } catch (error) {
        console.error("Error updating timesheet:", error);
        if (error.name === 'ValidationError' && error.errors && error.errors.workDescription) {
            return res.status(400).json({
                success: false,
                message: "Please add a work description"
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;