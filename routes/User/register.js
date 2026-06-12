const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

const User = require('../../models/user');

router.post('/api/register', authenticateToken, async (req, res) => {
    const { username, password, email, name, designation, role, payrate, allocatedHours, remainingHours} = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Admins only can register users' });
    }

    if (!username || !password || !email || !name || !role) {
        return res.status(400).json({ success: false, message: 'Username, password, email, name, and role are required' });
    }

    try {
        const user = new User({ username, email, name, designation, role, payrate, active: true, allocatedHours, remainingHours});
        await User.register(user, password);
        res.status(200).json({ success: true, message: 'User registered successfully'});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
