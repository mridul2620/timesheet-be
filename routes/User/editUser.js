const express = require('express');
const router = express.Router();
const User = require('../../models/user');

// Update the server-side API handler to handle selective updates better
router.post('/api/edituser', async (req, res) => {
    const { 
        username, 
        newUsername, 
        email, 
        name, 
        payrate, 
        designation, 
        active, 
        role, 
        allocatedHours,
        financialYears 
    } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required' });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update basic fields conditionally
        if (newUsername !== undefined) user.username = newUsername;
        if (email !== undefined) user.email = email;
        if (name !== undefined) user.name = name;
        if (payrate !== undefined) user.payrate = payrate;
        if (designation !== undefined) user.designation = designation;
        if (active !== undefined) user.active = active;
        if (role !== undefined) user.role = role;
        
        // Handle selective allocatedHours updates
        if (allocatedHours !== undefined) {
            // Ensure allocatedHours is an array
            const newAllocatedHours = Array.isArray(allocatedHours) 
                ? allocatedHours 
                : [allocatedHours];
                
            // If user doesn't have allocatedHours yet, create the array
            if (!user.allocatedHours) {
                user.allocatedHours = [];
            }
            
            // Update only the specified years without touching other years
            newAllocatedHours.forEach(newHourEntry => {
                // Only process entries with actual hours specified
                if (newHourEntry.year && newHourEntry.hours && newHourEntry.hours.trim() !== '') {
                    const existingEntryIndex = user.allocatedHours.findIndex(
                        entry => entry.year === newHourEntry.year
                    );
                    
                    if (existingEntryIndex >= 0) {
                        // Update existing entry
                        user.allocatedHours[existingEntryIndex].hours = newHourEntry.hours;
                    } else {
                        // Add new entry
                        user.allocatedHours.push({
                            year: newHourEntry.year,
                            hours: newHourEntry.hours
                        });
                    }
                }
            });
        }

        // Update financial years only if provided
        if (financialYears !== undefined) {
            // Ensure financialYears is an array
            const newFinancialYears = Array.isArray(financialYears) 
                ? financialYears 
                : [financialYears];
                
            // Process only the provided financial years
            newFinancialYears.forEach(newYear => {
                if (!newYear.year) return;
                
                // If user doesn't have financialYears yet, create the array
                if (!user.financialYears) {
                    user.financialYears = [];
                }
                
                const existingYearIndex = user.financialYears.findIndex(
                    entry => entry.year === newYear.year
                );
                
                if (existingYearIndex >= 0) {
                    // Update existing entry
                    user.financialYears[existingYearIndex] = {
                        ...user.financialYears[existingYearIndex],
                        ...newYear
                    };
                } else {
                    // Add new entry
                    user.financialYears.push(newYear);
                }
            });
        }

        await user.save();
        res.status(200).json({ 
            success: true, 
            message: 'User details updated successfully', 
            user 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router;