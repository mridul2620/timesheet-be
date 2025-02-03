const express = require('express');
const router = express.Router();
const User = require('../../models/user');

router.post('/api/register', async (req, res) => {
    const { username, password, email, name, designation, role, payrate } = req.body;

    if (!username || !password || !email || !name || !role) {
        return res.status(400).json({ success: false, message: 'Username, password, email, name, and role are required' });
    }

    try {
        const user = new User({ username, email, name, designation, role, payrate, active: true });
        await User.register(user, password);
        res.status(200).json({ success: true, message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
