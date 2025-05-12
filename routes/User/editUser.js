const express = require('express');
const router = express.Router();
const User = require('../../models/user');

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
        financialYears,
        remainingHours 
    } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required' });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (newUsername !== undefined) user.username = newUsername;
        if (email !== undefined) user.email = email;
        if (name !== undefined) user.name = name;
        if (payrate !== undefined) user.payrate = payrate;
        if (designation !== undefined) user.designation = designation;
        if (active !== undefined) user.active = active;
        if (role !== undefined) user.role = role;
        if (remainingHours !== undefined) user.remainingHours = remainingHours;
        if (allocatedHours !== undefined) {
            const newAllocatedHours = Array.isArray(allocatedHours) 
                ? allocatedHours 
                : [allocatedHours];
            if (!user.allocatedHours) {
                user.allocatedHours = [];
            }
            newAllocatedHours.forEach(newHourEntry => {
                if (newHourEntry.year && newHourEntry.hours && newHourEntry.hours.trim() !== '') {
                    const existingEntryIndex = user.allocatedHours.findIndex(
                        entry => entry.year === newHourEntry.year
                    );
                    
                    if (existingEntryIndex >= 0) {
                        user.allocatedHours[existingEntryIndex].hours = newHourEntry.hours;
                    } else {
                        user.allocatedHours.push({
                            year: newHourEntry.year,
                            hours: newHourEntry.hours
                        });
                    }
                }
            });
        }
        if (financialYears !== undefined) {
            const newFinancialYears = Array.isArray(financialYears) 
                ? financialYears 
                : [financialYears];
            newFinancialYears.forEach(newYear => {
                if (!newYear.year) return;
                if (!user.financialYears) {
                    user.financialYears = [];
                }
                
                const existingYearIndex = user.financialYears.findIndex(
                    entry => entry.year === newYear.year
                );
                
                if (existingYearIndex >= 0) {
                    user.financialYears[existingYearIndex] = {
                        ...user.financialYears[existingYearIndex],
                        ...newYear
                    };
                } else {
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