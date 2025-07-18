const express = require('express');
const nodemailer = require('nodemailer');
const moment = require('moment');
const router = express.Router();

router.post('/api/sendTimesheetEmail', async (req, res) => {
    try {
      console.log("Email request received:", req.body);
      
      const { 
        userEmail, 
        userName, 
        status, 
        startDate, 
        endDate, 
        timesheetData,
        adminName,
        rejectionReason
      } = req.body;
  
      // Validate required fields
      if (!userEmail || !userName || !status || !startDate || !endDate || !timesheetData) {
        console.error("Missing required fields:", {
          hasUserEmail: !!userEmail,
          hasUserName: !!userName,
          hasStatus: !!status,
          hasStartDate: !!startDate,
          hasEndDate: !!endDate,
          hasTimesheetData: !!timesheetData
        });
        
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields for email notification',
          missingFields: !userEmail ? 'userEmail' : !userName ? 'userName' : !status ? 'status' : 
                         !startDate ? 'startDate' : !endDate ? 'endDate' : 'timesheetData'
        });
      }

      console.log("Preparing to send email to:", userEmail);
      console.log("Email credentials:", { 
        user: process.env.EMAIL_USER ? 'Set' : 'Missing',
        pass: process.env.EMAIL_PASS ? 'Set' : 'Missing'
      });
  
      // Create nodemailer transporter
      const transporter = nodemailer.createTransporter({
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
        console.log("SMTP connection verified successfully");
      } catch (smtpError) {
        console.error("SMTP verification failed:", smtpError);
        return res.status(500).json({ 
          success: false, 
          message: 'Email server connection failed',
          error: smtpError.message
        });
      }
  
      // Format dates for email
      const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      // Create table HTML from timesheet data
      let tableHtml = "";
      try {
        tableHtml = generateTimesheetTable(timesheetData);
      } catch (tableError) {
        console.error("Error generating timesheet table:", tableError);
        tableHtml = "<p>Error generating timesheet details</p>";
      }
  
      // Email subject
      const subject = `Timesheet ${status === 'approved' ? 'Approved' : 'Rejected'}`;
  
      // Create rejection reason section if timesheet is rejected
      let rejectionReasonHtml = '';
      if (status === 'rejected' && rejectionReason) {
        rejectionReasonHtml = `
          <div style="margin: 20px 0; padding: 15px; border-left: 4px solid #ef4444; background-color: #fef2f2; border-radius: 5px;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">Rejection Reason:</h3>
            <p style="color: #7f1d1d; margin: 0; line-height: 1.5; white-space: pre-wrap;">${rejectionReason}</p>
          </div>
        `;
      }

      // Email body
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #000;">
          <p>Hi ${userName},</p>
          <p>Your timesheet for the period <strong>${formattedStartDate} - ${formattedEndDate}</strong> has been <strong>${status}</strong> by the admin.</p>
          
          ${rejectionReasonHtml}
          
          <p>Please see the details below:</p>
          
          ${tableHtml}
          
          <p>Thank you.</p>
          <p>Best Regards,<br>Chartsign PPR Team</p>
        </div>
      `;
      
      console.log("Prepared email with subject:", subject);
      
      // Send email
      try {
        const info = await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: userEmail,
          subject: subject,
          html: htmlBody,
        });
        
        console.log("Email sent successfully:", info.messageId);
        return res.status(200).json({ 
          success: true, 
          message: 'Email sent successfully',
          messageId: info.messageId
        });
      } catch (sendError) {
        console.error("Error sending email:", sendError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send email',
          error: sendError.message
        });
      }
    } catch (error) {
      console.error('Unexpected error in email service:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error in email service',
        error: error.message 
      });
    }
});

// Fixed helper function to generate Monday-Sunday week dates
function getWeekDatesFromRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate the Monday of the week that contains the start date
  const startDay = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = startDay === 0 ? 6 : startDay - 1;
  
  const monday = new Date(start);
  monday.setDate(start.getDate() - daysToMonday);
  
  // Generate array of 7 dates starting from Monday
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date);
  }
  
  return weekDates;
}

// Helper function to generate timesheet HTML table with Monday-Sunday layout
function generateTimesheetTable(data) {
  try {
    const { entries, weekDates, dayStatus, workDescription } = data;
    
    if (!entries || !weekDates) {
      console.error("Missing entries or weekDates in timesheet data");
      return "<p>Error: Incomplete timesheet data</p>";
    }
    
    // Convert weekDates to proper Date objects and ensure Monday-Sunday order
    let formattedDates;
    if (weekDates.length > 0) {
      // Use the provided weekDates but reorder them to ensure Monday-Sunday
      const firstDate = new Date(weekDates[0]);
      formattedDates = getWeekDatesFromRange(firstDate, firstDate);
    } else {
      console.error("No week dates provided");
      return "<p>Error: No week dates available</p>";
    }
    
    // Format days for display - Monday to Sunday
    const days = formattedDates.map(date => moment(date).format('ddd, MMM D'));
    
    // Create table headers
    let tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Projects</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Subject</th>
            ${days.map(day => `<th style="padding: 10px; border: 1px solid #ddd; text-align: center;">${day}</th>`).join('')}
            <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Total</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // Add entry rows
    entries.forEach(entry => {
      const rowTotal = calculateRowTotal(entry);
      
      tableHtml += `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${entry.project || 'N/A'}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${entry.subject || 'N/A'}</td>
          ${formattedDates.map(date => {
            const dayStr = date.toISOString().split('T')[0];
            const hours = entry.hours && entry.hours[dayStr] ? entry.hours[dayStr] : '';
            return `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${hours}</td>`;
          }).join('')}
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${rowTotal.toFixed(2)}</td>
        </tr>
      `;
    });
    
    // Add total row
    tableHtml += `
      <tr style="background-color: #f9f9f9; font-weight: bold;">
        <td colspan="2" style="padding: 10px; border: 1px solid #ddd;">Total</td>
        ${formattedDates.map(date => {
          const dayTotal = calculateDayTotal(entries, date);
          return `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${dayTotal.toFixed(2)}</td>`;
        }).join('')}
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #f97316;">${calculateWeekTotal(entries).toFixed(2)}</td>
      </tr>
    `;
    
    // Add status row if dayStatus exists
    if (dayStatus) {
      tableHtml += `
        <tr>
          <td colspan="2" style="padding: 10px; border: 1px solid #ddd;">Status</td>
          ${formattedDates.map(date => {
            const dayStr = date.toISOString().split('T')[0];
            const status = dayStatus[dayStr] || '';
            return `<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${status}</td>`;
          }).join('')}
          <td style="padding: 10px; border: 1px solid #ddd;"></td>
        </tr>
      `;
    }
    
    tableHtml += `
        </tbody>
      </table>
    `;
    
    // Add work description
    if (workDescription) {
      tableHtml += `
        <div style="margin-top: 20px;">
          <h3 style="color: #333; margin-bottom: 10px;">Work Description</h3>
          <div style="padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9; white-space: pre-wrap; line-height: 1.5;">
            ${workDescription.replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    }
    
    return tableHtml;
  } catch (error) {
    console.error("Error generating table HTML:", error);
    return "<p>Error generating timesheet details</p>";
  }
}

// Helper functions to calculate totals with improved error handling
function calculateRowTotal(entry) {
  try {
    if (!entry.hours) return 0;
    return Object.values(entry.hours).reduce((total, hours) => {
      return total + Number.parseFloat(hours || '0');
    }, 0);
  } catch (error) {
    console.error("Error calculating row total:", error);
    return 0;
  }
}

function calculateDayTotal(entries, date) {
  try {
    const dayStr = date.toISOString().split('T')[0];
    return entries.reduce((total, entry) => {
      if (!entry.hours) return total;
      const hours = Number.parseFloat(entry.hours[dayStr] || '0');
      return total + hours;
    }, 0);
  } catch (error) {
    console.error("Error calculating day total:", error);
    return 0;
  }
}

function calculateWeekTotal(entries) {
  try {
    return entries.reduce((total, entry) => {
      return total + calculateRowTotal(entry);
    }, 0);
  } catch (error) {
    console.error("Error calculating week total:", error);
    return 0;
  }
}

module.exports = router;