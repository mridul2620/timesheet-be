const express = require('express');
const router = express.Router();
const Client = require('../../models/client'); // Ensure correct path

// Force delete all clients
router.delete('/api/deleteAllClients', async (req, res) => {
    try {
        const result = await Client.deleteMany({});
        
        // Optional: Double-check if deletion worked
        const remainingClients = await Client.find();
        if (remainingClients.length > 0) {
            return res.status(500).json({
                success: false,
                message: "Some clients were not deleted. Please try again.",
            });
        }

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} clients successfully.`,
        });
    } catch (error) {
        console.error('Error deleting clients:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting clients",
            error: error.message,
        });
    }
});

// Delete a single client by ID
router.delete('/api/deleteClient/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Client.findByIdAndDelete(id);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Client deleted successfully.",
        });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({
            success: false,
            message: "Error deleting client",
            error: error.message,
        });
    }
});

module.exports = router;
