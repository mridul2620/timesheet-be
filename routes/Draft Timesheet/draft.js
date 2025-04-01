// routes/api/draftTimesheet.js
const express = require("express");
const router = express.Router();
const DraftTimesheet = require("../../models/draftTimesheet");
const mongoose = require("mongoose");

// Save/update a draft entry
router.post("/api/draft/save", async (req, res) => {
    try {
        const { username, weekStartDate, entry, workDescription, dayStatus } = req.body;

        if (!username || !weekStartDate || !entry) {
            return res.status(400).json({ 
                success: false,
                message: "Missing required fields"
            });
        }

        // Find existing draft for this user and week
        let draftTimesheet = await DraftTimesheet.findOne({
            username,
            weekStartDate
        });

        if (draftTimesheet) {
            // Check if entry with same ID exists
            const entryIndex = draftTimesheet.entries.findIndex(e => e.id === entry.id);
            
            if (entryIndex >= 0) {
                // Update existing entry
                draftTimesheet.entries[entryIndex] = entry;
            } else {
                // Add new entry
                draftTimesheet.entries.push(entry);
            }
            
            // Update other fields if provided
            if (workDescription) draftTimesheet.workDescription = workDescription;
            if (dayStatus) draftTimesheet.dayStatus = dayStatus;
            
            draftTimesheet.lastUpdated = new Date();
            await draftTimesheet.save();
            
            return res.status(200).json({
                success: true,
                message: "Draft entry updated",
                draftId: draftTimesheet._id.toString()
            });
        } else {
            // Create new draft
            const newDraft = new DraftTimesheet({
                username,
                weekStartDate,
                entries: [entry],
                workDescription: workDescription || "Draft",
                dayStatus: dayStatus || {},
                lastUpdated: new Date()
            });
            
            const savedDraft = await newDraft.save();
            
            return res.status(201).json({
                success: true,
                message: "Draft entry saved",
                draftId: savedDraft._id.toString()
            });
        }
    } catch (error) {
        console.error("Error saving draft entry:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Delete a draft entry
router.delete("/api/draft/entry", async (req, res) => {
    try {
        const { username, weekStartDate, entryId } = req.body;
        
        if (!username || !weekStartDate || !entryId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }
        
        const draftTimesheet = await DraftTimesheet.findOne({
            username,
            weekStartDate
        });
        
        if (!draftTimesheet) {
            return res.status(404).json({
                success: false,
                message: "Draft not found"
            });
        }
        
        // Remove the entry with the given ID
        draftTimesheet.entries = draftTimesheet.entries.filter(entry => entry.id !== entryId);
        
        // If no entries left, delete the entire draft
        if (draftTimesheet.entries.length === 0) {
            await DraftTimesheet.findByIdAndDelete(draftTimesheet._id);
            return res.status(200).json({
                success: true,
                message: "Draft entry deleted and draft removed",
                draftDeleted: true
            });
        } else {
            await draftTimesheet.save();
            return res.status(200).json({
                success: true,
                message: "Draft entry deleted"
            });
        }
    } catch (error) {
        console.error("Error deleting draft entry:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Get all draft entries for a week
router.get("/api/draft/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const { weekStart } = req.query;
        
        if (!username || !weekStart) {
            return res.status(400).json({
                success: false,
                message: "Username and weekStart are required"
            });
        }
        
        const draftTimesheet = await DraftTimesheet.findOne({
            username,
            weekStartDate: weekStart
        });
        
        if (!draftTimesheet) {
            return res.status(404).json({
                success: false,
                message: "No draft found for this week"
            });
        }
        
        return res.status(200).json({
            success: true,
            draft: draftTimesheet
        });
    } catch (error) {
        console.error("Error fetching draft:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Submit draft to final timesheet
router.post("/api/draft/submit/:draftId", async (req, res) => {
    try {
        const { draftId } = req.params;
        const { username } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(draftId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid draft ID"
            });
        }
        
        const draftTimesheet = await DraftTimesheet.findById(draftId);
        
        if (!draftTimesheet) {
            return res.status(404).json({
                success: false,
                message: "Draft not found"
            });
        }
        
        if (draftTimesheet.username !== username) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to submit this draft"
            });
        }
        
        // Forward the draft data to the main timesheet API
        // This would be a call to your existing submitTimesheet endpoint
        // Implement the logic to convert draft to final timesheet
        
        // After successful submission, delete the draft
        await DraftTimesheet.findByIdAndDelete(draftId);
        
        return res.status(200).json({
            success: true,
            message: "Draft submitted successfully and converted to timesheet"
        });
    } catch (error) {
        console.error("Error submitting draft:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;