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

const createTransportInstance = (options) => {
    const { user, pass } = getCredentials();
    if (!user || !pass) {
        throw new Error('Email credentials (EMAIL_USER / EMAIL_PASS) are not configured');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        ...options,
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
};

const sendEmail = async (mailOptions) => {
    const { user } = getCredentials();

    if (!mailOptions.from) {
        mailOptions.from = `Chartsign PPR Team <${user}>`;
    }

    // Attempt 1: Primary SMTPS (port 465, secure: true)
    const primaryTransporter = createTransportInstance({ port: 465, secure: true });
    try {
        const info = await primaryTransporter.sendMail(mailOptions);
        primaryTransporter.close();
        return info;
    } catch (primaryError) {
        primaryTransporter.close();
        console.warn(`[Mailer] Primary SMTP attempt failed: ${primaryError.message}. Retrying with fallback (port 587)...`);
        
        // Attempt 2: Fallback STARTTLS (port 587, secure: false)
        const fallbackTransporter = createTransportInstance({ port: 587, secure: false });
        try {
            const info = await fallbackTransporter.sendMail(mailOptions);
            fallbackTransporter.close();
            return info;
        } catch (fallbackError) {
            fallbackTransporter.close();
            console.error('[Mailer] Fallback SMTP attempt also failed:', fallbackError.message || fallbackError);
            throw fallbackError;
        }
    }
};

module.exports = { sendEmail, getCredentials };
