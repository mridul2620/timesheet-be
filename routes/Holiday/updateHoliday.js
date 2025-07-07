
const express = require("express");
const router = express.Router();
const Holiday = require("../../models/holiday");

// Update holiday status (existing endpoint)
router.put("/api/holiday/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["pending", "approved", "rejected"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status is required and must be one of: pending, approved, rejected"
            });
        }

        const updatedHoliday = await Holiday.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedHoliday) {
            return res.status(404).json({
                success: false,
                message: "Holiday request not found"
            });
        }

        res.status(200).json({
            success: true,
            message: `Holiday request status updated to ${status}`,
            data: updatedHoliday
        });

    } catch (error) {
        console.error("Error updating holiday status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Update entire holiday request (new endpoint)
router.put("/api/holiday/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { leaveType, from, to, reason, workingDays } = req.body;

        // Validation
        if (!leaveType || !from || !to || !reason) {
            return res.status(400).json({
                success: false,
                message: "All fields are required: leaveType, from, to, reason"
            });
        }

        // Validate leave type
        const validLeaveTypes = ["casual leave", "sick leave", "half day", "work from home"];
        if (!validLeaveTypes.includes(leaveType.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave type. Must be one of: casual leave, sick leave, half day, work from home"
            });
        }

        // Validate dates
        const fromDate = new Date(from);
        const toDate = new Date(to);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format"
            });
        }

        if (fromDate > toDate) {
            return res.status(400).json({
                success: false,
                message: "From date cannot be after to date"
            });
        }

        // Validate working days
        if (workingDays && (workingDays < 1 || workingDays > 365)) {
            return res.status(400).json({
                success: false,
                message: "Working days must be between 1 and 365"
            });
        }

        // Check if the holiday request exists
        const existingHoliday = await Holiday.findById(id);
        if (!existingHoliday) {
            return res.status(404).json({
                success: false,
                message: "Holiday request not found"
            });
        }

        // Check if the request can be edited (only pending and rejected can be edited)
        if (existingHoliday.status === 'approved') {
            return res.status(403).json({
                success: false,
                message: "Cannot edit an approved holiday request"
            });
        }

        // Prepare update data
        const updateData = {
            leaveType: leaveType.toLowerCase(),
            from: fromDate,
            to: toDate,
            reason: reason.trim(),
            workingDays: workingDays || existingHoliday.workingDays,
            // Reset status to pending if it was rejected and now being edited
            status: existingHoliday.status === 'rejected' ? 'pending' : existingHoliday.status
        };

        const updatedHoliday = await Holiday.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Holiday request updated successfully",
            data: updatedHoliday
        });

    } catch (error) {
        console.error("Error updating holiday request:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: validationErrors
            });
        }

        // Handle cast errors (invalid ObjectId)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid holiday request ID"
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