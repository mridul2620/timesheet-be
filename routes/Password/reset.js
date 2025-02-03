const express = require('express');
const router = express.Router();
const User = require('../../models/user');

// Verify token route
router.get('/api/reset/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() } // Check token is not expired
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired' });
        }
        
        res.status(200).json({ success: true, message: 'Token is valid', userIdentifier: user.username || user.email });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Reset password route
router.post("/api/reset/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password reset token is invalid or has expired",
        });
    }

    user.setPassword(req.body.password, async (err) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error resetting password" });
      }

      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();
      res
        .status(200)
        .json({ success: true, message: "Password has been reset" });
    });
  } catch (error) {
    console.error("Server error:", error); // Log the error details
    res
      .status(500)
      .json({
        success: false,
        message: "Error resetting password",
        error: error.message,
      });
  }
});

module.exports = router;