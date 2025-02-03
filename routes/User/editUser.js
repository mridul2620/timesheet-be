const express = require('express');
const router = express.Router();
const User = require('../../models/user');

router.post('/api/edituser', async (req, res) => {
    const { username, newUsername, email, name, payrate, designation, active } = req.body;

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

        await user.save();
        res.status(200).json({ success: true, message: 'User details updated successfully', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
