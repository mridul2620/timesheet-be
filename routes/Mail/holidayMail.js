const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { sendEmail } = require('../../utils/mailer');

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const toDateString = (d) => {
  if (!d) return d;
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d).split('T')[0];
};

const formatLongDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const dt = new Date(year, month - 1, day);
  if (isNaN(dt.getTime())) throw new Error(`Invalid date: ${dateString}`);
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const getStatusColor = (status) => {
  switch (String(status).toLowerCase()) {
    case 'approved': return '#22c55e';
    case 'rejected': return '#ef4444';
    default: return '#fbbf24';
  }
};

/**
 * Send the "new leave request" notification to the admin(s) in HOLIDAY_MAIL.
 * HOLIDAY_MAIL may contain several addresses separated by commas.
 * Throws on failure so callers can decide how to handle it.
 */
async function sendHolidayAdminEmail({ userEmail, userName, leaveType, fromDate, toDate, workingDays, reason, status = 'pending', isResubmission = false }) {
  const missing = ['userEmail', 'userName', 'leaveType', 'fromDate', 'toDate', 'workingDays', 'reason']
    .filter((k) => !({ userEmail, userName, leaveType, fromDate, toDate, workingDays, reason })[k]);
  if (missing.length) {
    const err = new Error(`Missing required fields for holiday email notification: ${missing.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const adminEmails = (process.env.HOLIDAY_MAIL || '').split(',').map((e) => e.trim()).filter(Boolean);
  if (!adminEmails.length) {
    throw new Error('Admin email not configured - HOLIDAY_MAIL environment variable missing');
  }

  fromDate = toDateString(fromDate);
  toDate = toDateString(toDate);
  const formattedFromDate = formatLongDate(fromDate);
  const formattedToDate = formatLongDate(toDate);

  const isSingleDay = fromDate === toDate;
  const dateRangeText = isSingleDay ? formattedFromDate : `${formattedFromDate} - ${formattedToDate}`;

  const subject = `${isResubmission ? 'Updated' : 'New'} Leave Request - ${userName} (${leaveType})`;

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
                <td style="padding: 8px 0; color: #1e293b;">${esc(userName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Email:</td>
                <td style="padding: 8px 0; color: #1e293b;">${esc(userEmail)}</td>
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
                    ${esc(leaveType)}
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
            <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #d1fae5; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${esc(reason)}</div>
          </div>
          
          <!-- Action Required -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #f59e0b; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">⚡ Action Required</h3>
            <p style="margin: 0 0 15px 0; color: #92400e; font-weight: 500;">Please review and approve/reject this leave request in the admin panel.</p>
            
            <!-- Action Button -->
            <a href="https://chartsignppr.vercel.app/approvals" 
               style="display: inline-block; background: linear-gradient(135deg, #0c1e35 0%, #1e3a8a 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(12, 30, 53, 0.3); transition: all 0.3s ease;"
               onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(12, 30, 53, 0.4)';"
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(12, 30, 53, 0.3)';">
              🔗 Click here to view the request
            </a>
            
            
            <div style="margin-top: 15px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                If the button above doesn't work, copy and paste this link:<br>
                <a href="https://chartsignppr.vercel.app/approvals" style="color: #0c1e35; font-weight: 600;">
                  https://chartsignppr.vercel.app/approvals
                </a>
              </p>
            </div>
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

  const results = [];
  for (const to of adminEmails) {
    const info = await sendEmail({
      from: `"ChartsignPPR" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlBody,
    });
    results.push({ to, messageId: info && info.messageId });
  }
  return results;
}

// Kept for backwards compatibility (the backend now sends this automatically on submission)
router.post('/api/sendHolidayEmail', authenticateToken, async (req, res) => {
  try {
    const results = await sendHolidayAdminEmail(req.body || {});
    return res.status(200).json({
      success: true,
      message: 'Holiday notification email sent to admin successfully',
      results,
    });
  } catch (error) {
    console.error('Error sending holiday email:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 400 ? error.message : 'Failed to send holiday notification email',
      error: error.message,
    });
  }
});

module.exports = router;
module.exports.sendHolidayAdminEmail = sendHolidayAdminEmail;
