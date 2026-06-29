const nodemailer = require('nodemailer');
const https = require('https');

const getCredentials = () => {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (
        process.env.EMAIL_PASS ||
        process.env.EMAIL_PASSWORD_ADMIN_CHARTSIGN ||
        process.env.EMAIL_PASSWORD_CLAIRE_CHARTSIGN ||
        ''
    ).replace(/\s+/g, '');

    return { user, pass };
};

// Helper to make zero-dependency HTTPS POST requests over Port 443 (bypasses cloud SMTP port blocks)
const sendHttpsPost = (urlStr, headers, bodyObj) => {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const data = JSON.stringify(bodyObj);

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            timeout: 15000
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => { responseBody += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(responseBody || '{}'));
                    } catch (e) {
                        resolve({ data: responseBody });
                    }
                } else {
                    reject(new Error(`HTTP API Error (${res.statusCode}): ${responseBody}`));
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('HTTP API Request timed out after 15 seconds'));
        });

        req.write(data);
        req.end();
    });
};

const sendEmail = async (mailOptions) => {
    const { user, pass } = getCredentials();

    const fromAddress = mailOptions.from || `Chartsign PPR Team <${user || 'noreply@chartsignppr.com'}>`;
    const toAddress = Array.isArray(mailOptions.to) ? mailOptions.to[0] : mailOptions.to;
    const subject = mailOptions.subject || 'Notification';
    const textContent = mailOptions.text || (mailOptions.html ? mailOptions.html.replace(/<[^>]*>?/gm, '') : '');
    const htmlContent = mailOptions.html || `<p>${textContent.replace(/\n/g, '<br>')}</p>`;

    // 1. Check for Brevo API Key (Free tier: 300 emails/day over HTTPS port 443)
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
        console.log('[Mailer] Sending email via Brevo HTTP API (Port 443)...');
        const match = fromAddress.match(/<([^>]+)>/);
        const senderEmail = match ? match[1] : (user || 'noreply@chartsignppr.com');
        const senderName = fromAddress.replace(/<[^>]+>/, '').trim() || 'Chartsign PPR Team';

        const brevoBody = {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: toAddress }],
            subject: subject,
            htmlContent: htmlContent,
            textContent: textContent
        };

        const result = await sendHttpsPost('https://api.brevo.com/v3/smtp/email', {
            'api-key': brevoKey.trim(),
            'accept': 'application/json'
        }, brevoBody);

        console.log('[Mailer] Brevo HTTP email sent successfully:', result);
        return { messageId: result.messageId || 'brevo-http-id' };
    }

    // 2. Check for Resend API Key (Free tier: 3,000 emails/month over HTTPS port 443)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
        console.log('[Mailer] Sending email via Resend HTTP API (Port 443)...');
        const resendBody = {
            from: fromAddress.includes('<') ? fromAddress : `Chartsign PPR Team <onboarding@resend.dev>`,
            to: [toAddress],
            subject: subject,
            html: htmlContent,
            text: textContent
        };

        const result = await sendHttpsPost('https://api.resend.com/emails', {
            'Authorization': `Bearer ${resendKey.trim()}`
        }, resendBody);

        console.log('[Mailer] Resend HTTP email sent successfully:', result);
        return { messageId: result.id || 'resend-http-id' };
    }

    // 3. Fallback to Nodemailer SMTP (for local dev or if API keys aren't configured yet)
    console.log('[Mailer] No HTTP API key detected. Using Nodemailer SMTP fallback...');
    if (!user || !pass) {
        throw new Error('Email credentials (EMAIL_USER / EMAIL_PASS or HTTP API key) are not configured');
    }

    const transportConfigs = [
        { host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true },
        { host: 'smtp.gmail.com', port: 465, secure: true },
        { host: 'smtp.googlemail.com', port: 587, secure: false, requireTLS: true },
        { host: 'smtp.googlemail.com', port: 465, secure: true }
    ];

    let lastError = null;
    for (let i = 0; i < transportConfigs.length; i++) {
        const config = transportConfigs[i];
        console.log(`[Mailer] SMTP Attempt ${i + 1}/${transportConfigs.length}: Connecting to ${config.host}:${config.port}...`);
        
        const transporter = nodemailer.createTransport({
            ...config,
            auth: { user, pass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 20000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
        });

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[Mailer] SMTP Success on attempt ${i + 1}! MessageID: ${info.messageId}`);
            transporter.close();
            return info;
        } catch (error) {
            lastError = error;
            console.warn(`[Mailer] SMTP Attempt ${i + 1} failed:`, error.message || error);
            transporter.close();
        }
    }

    throw lastError;
};

module.exports = { sendEmail, getCredentials };
