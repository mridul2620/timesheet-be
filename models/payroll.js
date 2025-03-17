// models/PayrollRecord.js
const mongoose = require('mongoose');

// Define the schema for individual payroll records
const payrollRecordSchema = new mongoose.Schema({
  timePeriod: {
    type: String,
    required: true,
    trim: true
  },
  payrate: {
    type: Number,
    required: true
  },
  netPay: {
    type: Number,
    required: true
  },
  totalTime: {
    type: Number,
    required: true
  },
  workingDays: {
    type: Number,
    required: true
  },
  paidDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid'],
    default: 'Paid'
  }
});

// Define the main payroll schema
const payrollSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  payroll: [payrollRecordSchema]
}, {
  timestamps: true
});

const PayrollRecord = mongoose.model('PayrollRecord', payrollSchema);

module.exports = PayrollRecord;