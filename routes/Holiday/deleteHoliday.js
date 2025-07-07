const express = require("express");
const router = express.Router();
const Holiday = require("../../models/holiday");

router.delete("/api/holiday/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedHoliday = await Holiday.findByIdAndDelete(id);

        if (!deletedHoliday) {
            return res.status(404).json({
                success: false,
                message: "Holiday request not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Holiday request deleted successfully",
            data: deletedHoliday
        });

    } catch (error) {
        console.error("Error deleting holiday request:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

module.exports = router;