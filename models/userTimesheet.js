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
    timesheetStatus: { type: String, default: "unapproved", enum: ["unapproved", "approved", "rejected"] }
}, { timestamps: true });

module.exports = mongoose.model("Timesheet", TimesheetSchema);