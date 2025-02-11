const mongoose = require("mongoose");

const TimesheetSchema = new mongoose.Schema({
    username: { type: String, required: true },
    weekStartDate: { type: String, required: true },
    entries: { type: Array, required: true },
    workDescription: { type: String, required: true },
    dayStatus: { type: Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Timesheet", TimesheetSchema);

