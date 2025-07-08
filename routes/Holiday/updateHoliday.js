const express = require("express");
const router = express.Router();
const Holiday = require("../../models/holiday");

// Update holiday status (enhanced endpoint with rejection reason and email notification)
router.put("/api/holiday/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejectionReason } = req.body;

        const validStatuses = ["pending", "approved", "rejected"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status is required and must be one of: pending, approved, rejected"
            });
        }

        // If status is rejected, rejection reason is required
        if (status === "rejected" && (!rejectionReason || rejectionReason.trim() === "")) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required when rejecting a request"
            });
        }

        // Find the holiday request first to get user details for email
        const existingHoliday = await Holiday.findById(id);
        if (!existingHoliday) {
            return res.status(404).json({
                success: false,
                message: "Holiday request not found"
            });
        }

        // Prepare update data
        const updateData = { status };
        if (status === "rejected") {
            updateData.rejectionReason = rejectionReason.trim();
        } else {
            // Clear rejection reason if status is not rejected
            updateData.rejectionReason = null;
        }

        const updatedHoliday = await Holiday.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        // Send email notification to user
        try {
            const emailResponse = await fetch(process.env.HOLIDAY_USER_MAIL_API || 'http://localhost:3000/api/sendUserStatusEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: updatedHoliday.email,
                    userName: updatedHoliday.username,
                    leaveType: updatedHoliday.leaveType,
                    fromDate: updatedHoliday.from.toISOString().split('T')[0],
                    toDate: updatedHoliday.to.toISOString().split('T')[0],
                    workingDays: updatedHoliday.workingDays,
                    reason: updatedHoliday.reason,
                    status: updatedHoliday.status,
                    rejectionReason: updatedHoliday.rejectionReason
                })
            });

            if (emailResponse.ok) {
                console.log("User notification email sent successfully");
            } else {
                console.error("Failed to send user notification email");
            }
        } catch (emailError) {
            console.error("Error sending user notification email:", emailError);
            // Don't fail the main request if email fails
        }

        res.status(200).json({
            success: true,
            message: `Holiday request status updated to ${status}${status === 'rejected' ? ' with reason provided' : ''}`,
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

// Update entire holiday request (existing endpoint - no changes needed)
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
            status: existingHoliday.status === 'rejected' ? 'pending' : existingHoliday.status,
            // Clear rejection reason when editing
            rejectionReason: null
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