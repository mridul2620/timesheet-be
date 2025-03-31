const express = require('express');
const router = express.Router();
const Client = require('../../models/client');

router.post('/api/addClient', async (req, res) => {
    const { clientName } = req.body;

    if (!clientName) {
        return res.status(400).json({
            success: false,
            message: "Please enter the client name",
        });
    }

    try {
        let existingclient = await Client.findOne({ name: clientName });

        if (existingclient) {
            return res.status(400).json({
                success: false,
                message: "A Client with the same name already exists.",
            });
        }

        const newClient = new Client({ name: clientName });
        await newClient.save();

        res.status(201).json({
            success: true,
            message: "Client added successfully",
            client: newClient,
        });
    } catch (error) {
        console.error('Error adding Client:', error);
        res.status(500).json({
            success: false,
            message: "Error adding Client",
            error: error.message,
        });
    }
});

module.exports = router;
