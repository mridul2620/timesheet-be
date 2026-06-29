const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../../models/user');
const { sendEmail } = require('../../utils/mailer');

router.post('/api/forgot', async (req, res) => {
    try {
        const { identifier } = req.body;
        
        if (!identifier) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email or username is required' 
            });
        }

        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User with the given email or username does not exist' 
            });
        }

        const token = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 1800000; // 30 minutes

        await user.save();

        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
            throw new Error('Missing FRONTEND_URL in environment — cannot generate reset link');
        }
        const resetUrl = `${frontendUrl}/reset-password/${token}`;
        console.log(`Password reset requested for: ${user.email}`);

        const mailOptions = {
            to: user.email,
            subject: 'Password Reset',
            text: `Hi ${user.name},\n\nYou are receiving this because you (or someone else) have requested the reset of the password for your account. Please click on the following link, or paste this into your browser to complete the process:\n` +
                  `${resetUrl}\n` +
                  `If you did not request this, please ignore this email and your password will remain unchanged.\n\n` +
                  `Thank You!\n\nBest Regards,\nChartsign PPR Team`
        };

        await sendEmail(mailOptions);

        res.status(200).json({ 
            success: true, 
            message: 'Password reset email sent to your email address' 
        });
    } catch (error) {
        console.error('Password reset error:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        res.status(500).json({ 
            success: false, 
            message: 'Error sending password reset email. Please try again later.', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;