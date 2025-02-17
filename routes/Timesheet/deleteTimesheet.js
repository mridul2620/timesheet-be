const express = require("express");
const router = express.Router();
const Timesheet = require("../../models/userTimesheet");

router.delete("/api/timesheet/:username", async (req, res) => {
    try {
      const { username } = req.params;
      console.log(`Deleting timesheets for: ${username}`);
  
      const result = await Timesheet.deleteMany({ username });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "No timesheets found to delete." });
      }
  
      res.status(200).json({ success: true, message: "Timesheets deleted successfully." });
  
    } catch (error) {
      console.error("Error deleting timesheets:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });
  

module.exports = router;
