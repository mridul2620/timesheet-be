const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');

router.post('/api/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, async (err, user, info) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        
        try {
            const loggedInUser = await User.findById(user._id)
                .select('username name email role designation active allocatedHours financialYears remainingHours')
                .lean();

            if (!loggedInUser.active) {
                return res.status(403).json({ success: false, message: 'User account is deactivated' });
            }

            const payload = {
                id: loggedInUser._id,
                username: loggedInUser.username,
                role: loggedInUser.role
            };

            const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
            const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

            // Save refresh token in DB for server-side revocation
            await User.findByIdAndUpdate(loggedInUser._id, {
                $push: { refreshTokens: refreshToken }
            });

            const isProd = process.env.NODE_ENV === 'production';
            // Set refresh token in HttpOnly cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            const allocatedHours = loggedInUser.allocatedHours || [];
            const formattedAllocatedHours = allocatedHours.map(item => ({
                year: item.year,
                hours: item.hours
            }));
   
            res.status(200).json({
                success: true,
                message: 'Logged in successfully',
                accessToken,
                user: {
                    name: loggedInUser.name,
                    username: loggedInUser.username,
                    email: loggedInUser.email,
                    role: loggedInUser.role,
                    designation: loggedInUser.designation,
                    active: loggedInUser.active,
                    allocatedHours: formattedAllocatedHours,
                    remainingHours: loggedInUser.remainingHours,
                    financialYears: loggedInUser.financialYears
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
    })(req, res, next);
});

module.exports = router;