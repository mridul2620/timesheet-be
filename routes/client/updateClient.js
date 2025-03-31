const express = require('express');
const router = express.Router();
// Change this line - make sure the model name matches your usage
const Client = require('../../models/client'); // Changed to uppercase Client

router.put('/api/updateClient/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, assignedTo } = req.body;

        const updateData = {};
        
        if (name) {
            updateData.name = name;
        }
        
        if (assignedTo) {
            updateData.assignedTo = assignedTo;
        }

        const result = await Client.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Client updated successfully.",
            data: result,
        });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({
            success: false,
            message: "Error updating client",
            error: error.message,
        });
    }
});

module.exports = router;