// routes/payroll.js
const express = require('express');
const router = express.Router();
const PayrollRecord = require('../models/payroll');

/**
 * POST /api/payroll
 * Create a new payroll record or add to existing user's payroll records
 */
router.post('/api/payroll', async (req, res) => {
  try {
    const { username, name, timePeriod, payrate, netPay, totalTime, workingDays, status = 'Paid' } = req.body;

    if (!username || !name || !timePeriod || payrate === undefined || netPay === undefined || 
        totalTime === undefined || workingDays === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Create the payroll record object
    const payrollRecord = {
      timePeriod,
      payrate,
      netPay,
      totalTime,
      workingDays,
      paidDate: new Date(),
      status
    };

    // Check if a record with the same time period already exists
    let userRecord = await PayrollRecord.findOne({ username });
    
    if (userRecord) {
      // Check if this time period already exists
      const existingRecordIndex = userRecord.payroll.findIndex(
        record => record.timePeriod === timePeriod
      );
      
      if (existingRecordIndex >= 0) {
        // Update the existing record instead of creating a duplicate
        userRecord.payroll[existingRecordIndex] = {
          ...userRecord.payroll[existingRecordIndex],
          ...payrollRecord,
          paidDate: new Date() // Update paid date
        };
      } else {
        // Add new payroll record to existing user
        userRecord.payroll.push(payrollRecord);
      }
      
      await userRecord.save();
    } else {
      // Create new user record with the payroll data
      userRecord = new PayrollRecord({
        username,
        name,
        payroll: [payrollRecord]
      });
      await userRecord.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Payroll record added successfully',
      data: userRecord
    });

  } catch (error) {
    console.error('Error creating payroll record:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred',
      error: error.message
    });
  }
});

/**
 * PUT /api/payroll/:username/:recordId
 * Update an existing payroll record status
 */
router.put('/api/payroll/:username/:recordId', async (req, res) => {
  try {
    const { username, recordId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required for updating a payroll record'
      });
    }
    
    const userRecord = await PayrollRecord.findOne({ username });
    
    if (!userRecord) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find the specific payroll record
    const payrollRecord = userRecord.payroll.id(recordId);
    
    if (!payrollRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found'
      });
    }
    
    // Update the record
    payrollRecord.status = status;
    
    // If updating to Paid, update the paid date
    if (status === 'Paid') {
      payrollRecord.paidDate = new Date();
    }
    
    await userRecord.save();
    
    return res.status(200).json({
      success: true,
      message: 'Payroll record updated successfully',
      data: userRecord
    });
    
  } catch (error) {
    console.error('Error updating payroll record:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred',
      error: error.message
    });
  }
});

/**
 * GET /api/payroll/:username
 * Get all payroll records for a specific user
 */
router.get('/api/payroll/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const userRecord = await PayrollRecord.findOne({ username });
    
    if (!userRecord) {
      return res.status(404).json({
        success: false,
        message: 'No payroll records found for this user'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: userRecord
    });
    
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred',
      error: error.message
    });
  }
});

module.exports = router;