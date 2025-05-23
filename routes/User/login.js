const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../../models/user');

router.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        req.logIn(user, async (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Server error' });
            
            try {
                const loggedInUser = await User.findById(user._id)
                    .select('username name email role designation active allocatedHours financialYears remainingHours')
                    .lean();

                const allocatedHours = loggedInUser.allocatedHours || [];
                const formattedAllocatedHours = allocatedHours.map(item => ({
                    year: item.year,
                    hours: item.hours
                }));
       
                res.status(200).json({
                    success: true,
                    message: 'Logged in successfully',
                    user: {
                        name: loggedInUser.name,
                        username: loggedInUser.username,
                        email: loggedInUser.email,
                        role: loggedInUser.role,
                        designation: loggedInUser.designation,
                        // payrate: loggedInUser.payrate ? parseFloat(loggedInUser.payrate.toString()).toFixed(2) : null,
                        active: loggedInUser.active,
                        allocatedHours: formattedAllocatedHours,
                        remainingHours: loggedInUser.remainingHours
                        // financialYears: financialYears
                    }
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error retrieving user data',
                    error: error.message
                });
            }
        });
    })(req, res, next);
});

module.exports = router;