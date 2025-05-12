const express = require('express');
const router = express.Router();
const User = require('../../models/user');

router.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username name email role designation payrate active allocatedHours financialYears remainingHours');
        
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

router.get('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username parameter is required'
            });
        }
        
        const user = await User.findOne(
            { username }, 
            'username name email role designation payrate active allocatedHours financialYears remainingHours'
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;