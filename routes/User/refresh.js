const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/user');

router.post('/api/refresh', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ 
            success: false, 
            message: 'Refresh token is missing' 
        });
    }

    try {
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, payload) => {
            if (err) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Invalid or expired refresh token' 
                });
            }

            // Optional: verify that user still exists and is active in MongoDB
            const user = await User.findById(payload.id).lean();
            if (!user || !user.active) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'User account is inactive or does not exist' 
                });
            }

            // Verify the token hasn't been revoked
            if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
                return res.status(403).json({
                    success: false,
                    message: 'Refresh token has been revoked or is invalid'
                });
            }

            // Generate new access token
            const tokenPayload = {
                id: user._id,
                username: user.username,
                role: user.role
            };

            const accessToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

            res.status(200).json({
                success: true,
                accessToken
            });
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during token refresh' 
        });
    }
});

module.exports = router;
