const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

router.post('/api/sendHolidayEmail', async (req, res) => {
    try {
      // console.log("Holiday email request received:", req.body);
      
      const { 
        userEmail, 
        userName, 
        leaveType,
        fromDate,
        toDate,
        workingDays,
        reason,
        status = 'pending'
      } = req.body;
  
      // Validate required fields
      if (!userEmail || !userName || !leaveType || !fromDate || !toDate || !workingDays || !reason) {
        console.error("Missing required fields:", {
          hasUserEmail: !!userEmail,
          hasUserName: !!userName,
          hasLeaveType: !!leaveType,
          hasFromDate: !!fromDate,
          hasToDate: !!toDate,
          hasWorkingDays: !!workingDays,
          hasReason: !!reason
        });
        
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields for holiday email notification',
          missingFields: !userEmail ? 'userEmail' : !userName ? 'userName' : !leaveType ? 'leaveType' : 
                         !fromDate ? 'fromDate' : !toDate ? 'toDate' : !workingDays ? 'workingDays' : 'reason'
        });
      }

      // Check if admin email is configured
      if (!process.env.HOLIDAY_MAIL) {
        console.error("HOLIDAY_MAIL environment variable not configured");
        return res.status(500).json({ 
          success: false, 
          message: 'Admin email not configured - HOLIDAY_MAIL environment variable missing'
        });
      }

      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Email credentials not configured:", {
          EMAIL_USER: !!process.env.EMAIL_USER,
          EMAIL_PASS: !!process.env.EMAIL_PASS
        });
        return res.status(500).json({ 
          success: false, 
          message: 'Email credentials not configured'
        });
      }

      // console.log("Preparing to send holiday email to admin:", process.env.HOLIDAY_MAIL);
      // console.log("Email credentials:", { 
      //   user: process.env.EMAIL_USER ? 'Set' : 'Missing',
      //   pass: process.env.EMAIL_PASS ? 'Set' : 'Missing'
      // });
  
      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        debug: true, // Enable debugging
        logger: true // Log to console
      });
      
      // Test the connection
      try {
        await transporter.verify();
        // console.log("SMTP connection verified successfully");
      } catch (smtpError) {
        console.error("SMTP verification failed:", smtpError);
        return res.status(500).json({ 
          success: false, 
          message: 'Email server connection failed',
          error: smtpError.message
        });
      }
  
      // Format dates for email - Fix timezone issues completely
      let formattedFromDate, formattedToDate;
      try {
        // Parse date string manually to avoid timezone issues
        const parseDate = (dateString) => {
          const [year, month, day] = dateString.split('-').map(Number);
          return new Date(year, month - 1, day); // month is 0-indexed
        };
        
        const fromDateObj = parseDate(fromDate);
        const toDateObj = parseDate(toDate);
        
        formattedFromDate = fromDateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
        
        formattedToDate = toDateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      } catch (dateError) {
        console.error("Date formatting error:", dateError);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid date format provided'
        });
      }
      
      // Determine if it's a single day or date range
      const isSingleDay = fromDate === toDate;
      const dateRangeText = isSingleDay 
        ? formattedFromDate 
        : `${formattedFromDate} - ${formattedToDate}`;
      
      // Email subject
      const subject = `New Leave Request - ${userName} (${leaveType})`;
  
      // Create status badge color
      const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
          case 'approved': return '#22c55e';
          case 'rejected': return '#ef4444';
          default: return '#fbbf24';
        }
      };

      // Email body HTML
      const htmlBody = `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 10px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0c1e35 0%, #1e3a8a 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🏖️ New Leave Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">Employee Holiday Application</p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Employee Info -->
            <div style="margin-bottom: 25px; padding: 20px; background-color: #f1f5f9; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">👤 Worker Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #475569;">Email:</td>
                  <td style="padding: 8px 0; color: #1e293b;">${userEmail}</td>
                </tr>
              </table>
            </div>
            
            <div style="margin-bottom: 25px; padding: 20px; background-color: #fef7ed; border-radius: 8px; border-left: 4px solid #f97316;">
              <h3 style="margin: 0 0 15px 0; color: #ea580c; font-size: 18px;">📅 Request Detail</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 120px;">Request Type:</td>
                  <td style="padding: 8px 0;">
                    <span style="background-color: #f97316; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      ${leaveType}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #475569;">Date${isSingleDay ? '' : 's'}:</td>
                  <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${dateRangeText}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #475569;">Working Days:</td>
                  <td style="padding: 8px 0;">
                    <span style="background-color: #0c1e35; color: white; padding: 4px 12px; border-radius: 15px; font-weight: 600;">
                      ${workingDays} day${workingDays > 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #475569;">Status:</td>
                  <td style="padding: 8px 0;">
                    <span style="background-color: ${getStatusColor(status)}; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      ${status}
                    </span>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Reason -->
            <div style="margin-bottom: 25px; padding: 20px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
              <h3 style="margin: 0 0 15px 0; color: #16a34a; font-size: 18px;">📝 Reason</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #d1fae5; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${reason}</div>
            </div>
            
            <!-- Action Required -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #f59e0b;">
              <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">⚡ Action Required</h3>
              <p style="margin: 0; color: #92400e; font-weight: 500;">Please review and approve/reject leave request in the admin panel.</p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                This is an automated notification from the <strong>Chartsign PPR System</strong>
              </p>
              <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px;">
                Sent on ${new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      `;
      
      // console.log("Prepared holiday email with subject:", subject);
      
      // Send email to admin
      try {
        const info = await transporter.sendMail({
          from: `"ChartsignPPR" <${process.env.EMAIL_USER}>`,
          to: process.env.HOLIDAY_MAIL,
          subject: subject,
          html: htmlBody,
        });
        
        // console.log("Holiday email sent successfully to admin:", info.messageId);
        return res.status(200).json({ 
          success: true, 
          message: 'Holiday notification email sent to admin successfully',
          messageId: info.messageId,
          adminEmail: process.env.HOLIDAY_MAIL
        });
      } catch (sendError) {
        console.error("Error sending holiday email:", sendError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send holiday notification email',
          error: sendError.message
        });
      }
    } catch (error) {
      console.error('Unexpected error in holiday email service:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error in holiday email service',
        error: error.message 
      });
    }
});

module.exports = router;