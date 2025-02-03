const express = require('express');
const router = express.Router();
const User = require('../../models/user');

router.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username name email role designation payrate active');
        
        res.status(200).json({
            success: true,
            users: users
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;
