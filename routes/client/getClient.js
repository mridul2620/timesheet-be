const express = require('express');
const router = express.Router();
const Client = require('../../models/client'); // Ensure correct path

// Get all clients
router.get('/api/getClients', async (req, res) => {
    try {
        const clients = await Client.find({});
        res.status(200).json({
            success: true,
            message: "Clients retrieved successfully",
            clients,
        });
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching clients",
            error: error.message,
        });
    }
});

module.exports = router;