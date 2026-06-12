const express = require('express');
const router = express.Router();
const User = require('../../models/user');

router.post('/api/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
        // Revoke token in the database
        try {
            await User.updateOne(
                { refreshTokens: refreshToken },
                { $pull: { refreshTokens: refreshToken } }
            );
        } catch (error) {
            console.error('Error revoking refresh token:', error);
        }
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });
    
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

module.exports = router;
