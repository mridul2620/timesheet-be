const nodemailer = require('nodemailer');

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

const sendEmail = async (mailOptions) => {
    const { user, pass } = getCredentials();

    if (!user || !pass) {
        throw new Error('Email credentials (EMAIL_USER / EMAIL_PASS) are not configured');
    }

    if (!mailOptions.from) {
        mailOptions.from = `Chartsign PPR Team <${user}>`;
    }

    // Try standard submission port 587 first across primary and alternate Gmail hosts, then legacy 465.
    const transportConfigs = [
        { host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true },
        { host: 'smtp.gmail.com', port: 465, secure: true },
        { host: 'smtp.googlemail.com', port: 587, secure: false, requireTLS: true },
        { host: 'smtp.googlemail.com', port: 465, secure: true }
    ];

    let lastError = null;

    for (let i = 0; i < transportConfigs.length; i++) {
        const config = transportConfigs[i];
        console.log(`[Mailer] Attempt ${i + 1}/${transportConfigs.length}: Connecting to ${config.host}:${config.port} (secure: ${config.secure})...`);
        
        const transporter = nodemailer.createTransport({
            ...config,
            auth: { user, pass },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 25000,
            greetingTimeout: 20000,
            socketTimeout: 30000,
        });

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`[Mailer] Success on attempt ${i + 1} (${config.host}:${config.port})! MessageID: ${info.messageId}`);
            transporter.close();
            return info;
        } catch (error) {
            lastError = error;
            console.warn(`[Mailer] Attempt ${i + 1} (${config.host}:${config.port}) failed:`, error.message || error);
            transporter.close();
        }
    }

    console.error('[Mailer] All SMTP attempts failed. Last error:', lastError);
    throw lastError;
};

module.exports = { sendEmail, getCredentials };
