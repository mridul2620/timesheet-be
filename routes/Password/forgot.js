const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../../models/user');

router.post('/api/forgot', async (req, res) => {
    const { identifier } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User with the given email or username does not exist' });
        }

        const token = crypto.randomBytes(20).toString('hex');

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 1800000; 

        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `Chartsign PPR Team <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset',
            text: `Hi ${user.name},\n\nYou are receiving this because you (or someone else) have requested the reset of the password for your account. Please click on the following link, or paste this into your browser to complete the process:\n` +
                  `http://localhost:3000/reset-password/${token}\n` +
                  `If you did not request this, please ignore this email and your password will remain unchanged.\n\n` +
                  `Thank You!\n\nBest Regards,\nChartsign PPR Team`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending email', error: error.message });
    }
});



module.exports = router;
