const mongoose = require("mongoose");

const HolidaySchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    leaveType: { type: String, required: true },
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    reason: { type: String, required: true },
    workingDays: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Holiday", HolidaySchema);