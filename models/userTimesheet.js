const mongoose = require("mongoose");

const TimesheetSchema = new mongoose.Schema({
    username: { type: String, required: true },
    weekStartDate: { type: String, required: true },
    entries: { type: Array, required: true },
    workDescription: { 
        type: String, 
        required: [true, "Work description is required"] 
    },
    dayStatus: { type: Object, required: true },
    timesheetStatus: { 
        type: String, 
        default: "unapproved", 
        enum: ["unapproved", "approved", "rejected"] 
    },
    rejectionReason: {
        type: String,
        required: function() {
            return this.timesheetStatus === "rejected";
        },
        validate: {
            validator: function(value) {
                if (this.timesheetStatus === "rejected") {
                    return value && value.trim().length > 0;
                }
                return true;
            },
            message: "Rejection reason is required when timesheet status is rejected"
        }
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

TimesheetSchema.pre('save', function(next) {
    if (this.timesheetStatus === 'rejected' && (!this.rejectionReason || !this.rejectionReason.trim())) {
        return next(new Error('Rejection reason is required when rejecting a timesheet'));
    }
    
    if (this.timesheetStatus !== 'rejected' && this.rejectionReason) {
        this.rejectionReason = undefined;
    }
    
    next();
});

TimesheetSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    
    if (update.timesheetStatus === 'rejected' && (!update.rejectionReason || !update.rejectionReason.trim())) {
        return next(new Error('Rejection reason is required when rejecting a timesheet'));
    }
    
    next();
});

module.exports = mongoose.model("Timesheet", TimesheetSchema);