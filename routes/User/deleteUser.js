const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

const User = require('../../models/user');

router.delete('/api/deleteUser', authenticateToken, async (req, res) => {
    const { username } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }

    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required' });
    }

    try {
        const result = await User.deleteOne({ username });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
