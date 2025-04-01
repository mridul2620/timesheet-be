// models/draftTimesheet.js
const mongoose = require("mongoose");

const DraftTimesheetSchema = new mongoose.Schema({
    username: { type: String, required: true },
    weekStartDate: { type: String, required: true },
    entries: { type: Array, required: true },
    workDescription: { type: String, default: "Draft" },
    dayStatus: { type: Object, default: {} },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("DraftTimesheet", DraftTimesheetSchema);