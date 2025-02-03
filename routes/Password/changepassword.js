const express = require('express');
const router = express.Router();
const User = require('../../models/user');

router.post('/api/changepassword', async (req, res) => {
    const { _id, oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirm password do not match' });
    }

    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.authenticate(oldPassword, async (err, authenticated) => {
            if (err || !authenticated) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            user.setPassword(newPassword, async (err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error setting new password', error: err.message });
                }

                await user.save();
                res.status(200).json({ success: true, message: 'Password changed successfully' });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
