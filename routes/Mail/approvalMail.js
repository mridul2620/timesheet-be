const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

router.post('/api/sendUserStatusEmail', async (req, res) => {
    try {
        // console.log("User status email request received:", req.body);
        
        const { 
            userEmail, 
            userName, 
            leaveType,
            fromDate,
            toDate,
            workingDays,
            reason,
            status,
            rejectionReason
        } = req.body;

        // Validate required fields
        if (!userEmail || !userName || !leaveType || !fromDate || !toDate || !workingDays || !reason || !status) {
            console.error("Missing required fields for user status email");
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields for user status email notification'
            });
        }

        // Validate rejection reason if status is rejected
        if (status === 'rejected' && (!rejectionReason || rejectionReason.trim() === '')) {
            console.error("Rejection reason required for rejected status");
            return res.status(400).json({ 
                success: false, 
                message: 'Rejection reason is required when status is rejected'
            });
        }

        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("Email credentials not configured");
            return res.status(500).json({ 
                success: false, 
                message: 'Email credentials not configured'
            });
        }

        // console.log("Preparing to send status update email to user:", userEmail);

        // Create nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            debug: true,
            logger: true
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

        // Format dates for email
        let formattedFromDate, formattedToDate;
        try {
            const parseDate = (dateString) => {
                const [year, month, day] = dateString.split('-').map(Number);
                return new Date(year, month - 1, day);
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

        // Email subject based on status
        const subject = status === 'approved' 
            ? `✅ Leave Request Approved - ${leaveType}`
            : `❌ Leave Request Rejected - ${leaveType}`;

        // Get status colors and icons
        const getStatusDetails = (status) => {
            switch (status.toLowerCase()) {
                case 'approved': 
                    return { 
                        color: '#22c55e', 
                        bgColor: '#f0fdf4', 
                        icon: '✅', 
                        title: 'Request Approved',
                        message: 'Great news! Your leave request has been approved.'
                    };
                case 'rejected': 
                    return { 
                        color: '#ef4444', 
                        bgColor: '#fef2f2', 
                        icon: '❌', 
                        title: 'Request Rejected',
                        message: 'Unfortunately, your leave request has been rejected.'
                    };
                default: 
                    return { 
                        color: '#fbbf24', 
                        bgColor: '#fffbeb', 
                        icon: '⏳', 
                        title: 'Request Updated',
                        message: 'Your leave request status has been updated.'
                    };
            }
        };

        const statusDetails = getStatusDetails(status);

        // Email body HTML
        const htmlBody = `
            <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 10px;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #0c1e35 0%, #1e3a8a 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">${statusDetails.icon} ${statusDetails.title}</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">Leave Request Status Update</p>
                </div>
                
                <!-- Content -->
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Status Message -->
                    <div style="margin-bottom: 25px; padding: 20px; background-color: ${statusDetails.bgColor}; border-radius: 8px; border-left: 4px solid ${statusDetails.color}; text-align: center;">
                        <h2 style="margin: 0 0 10px 0; color: ${statusDetails.color}; font-size: 20px;">${statusDetails.message}</h2>
                        <div style="margin: 15px 0;">
                            <span style="background-color: ${statusDetails.color}; color: white; padding: 8px 20px; border-radius: 25px; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                                ${status}
                            </span>
                        </div>
                    </div>

                    <!-- Request Details -->
                    <div style="margin-bottom: 25px; padding: 20px; background-color: #f1f5f9; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">📋 Request Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: 600; color: #475569; width: 140px;">Leave Type:</td>
                                <td style="padding: 8px 0;">
                                    <span style="background-color: #f97316; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
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
                                <td style="padding: 8px 0; font-weight: 600; color: #475569;">Your Reason:</td>
                                <td style="padding: 8px 0; color: #1e293b; font-style: italic;">"${reason}"</td>
                            </tr>
                        </table>
                    </div>

                    ${status === 'rejected' && rejectionReason ? `
                        <!-- Rejection Reason -->
                        <div style="margin-bottom: 25px; padding: 20px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
                            <h3 style="margin: 0 0 15px 0; color: #dc2626; font-size: 18px;">📝 Rejection Reason</h3>
                            <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #fecaca; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${rejectionReason}</div>
                        </div>
                    ` : ''}

                    ${status === 'approved' ? `
                        <!-- Next Steps for Approved -->
                        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #22c55e 100%); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #16a34a;">
                            <h3 style="margin: 0 0 10px 0; color: #15803d; font-size: 18px;">🎉 Enjoy Your Time Off!</h3>
                            <p style="margin: 0; color: #15803d; font-weight: 500;">Your leave has been approved. Have a great time!</p>
                        </div>
                    ` : status === 'rejected' ? `
                        <!-- Next Steps for Rejected -->
                        <div style="background: linear-gradient(135deg, #fef2f2 0%, #ef4444 100%); padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #dc2626;">
                            <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 18px;">📞 Need Clarification?</h3>
                            <p style="margin: 0; color: #dc2626; font-weight: 500;">Contact your manager if you have any questions about this decision.</p>
                        </div>
                    ` : ''}
                    
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

        // console.log("Prepared user status email with subject:", subject);

        // Send email to user
        try {
            const info = await transporter.sendMail({
                from: `"ChartsignPPR" <${process.env.EMAIL_USER}>`,
                to: userEmail,
                subject: subject,
                html: htmlBody,
            });
            
            // console.log("User status email sent successfully:", info.messageId);
            return res.status(200).json({ 
                success: true, 
                message: `User status notification email sent successfully (${status})`,
                messageId: info.messageId,
                userEmail: userEmail
            });
        } catch (sendError) {
            console.error("Error sending user status email:", sendError);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send user status notification email',
                error: sendError.message
            });
        }
    } catch (error) {
        console.error('Unexpected error in user status email service:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error in user status email service',
            error: error.message 
        });
    }
});

module.exports = router;