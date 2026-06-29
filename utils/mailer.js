const nodemailer = require('nodemailer');

let primaryTransporter = null;
let fallbackTransporter = null;
let cachedCredentials = null;

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

const getTransporters = () => {
    const { user, pass } = getCredentials();
    if (!user || !pass) {
        throw new Error('Email credentials (EMAIL_USER / EMAIL_PASS) are not configured');
    }

    const currentCredsKey = `${user}:${pass}`;
    if (!primaryTransporter || cachedCredentials !== currentCredsKey) {
        cachedCredentials = currentCredsKey;
        
        // Primary connection on SMTPS (465) with IPv4 forced
        primaryTransporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            family: 4, // Force IPv4 to prevent IPv6 DNS routing failures on Render/cloud providers
            auth: { user, pass },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 20000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
        });

        // Fallback connection on STARTTLS (587)
        fallbackTransporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            family: 4,
            auth: { user, pass },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 20000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
        });
    }

    return { primaryTransporter, fallbackTransporter };
};

const sendEmail = async (mailOptions) => {
    const { primaryTransporter, fallbackTransporter } = getTransporters();
    const { user } = getCredentials();

    if (!mailOptions.from) {
        mailOptions.from = `Chartsign PPR Team <${user}>`;
    }

    try {
        return await primaryTransporter.sendMail(mailOptions);
    } catch (primaryError) {
        console.warn(`[Mailer] Primary SMTP (port 465) attempt failed: ${primaryError.message}. Retrying with fallback (port 587)...`);
        try {
            return await fallbackTransporter.sendMail(mailOptions);
        } catch (fallbackError) {
            console.error('[Mailer] Fallback SMTP (port 587) attempt also failed:', fallbackError.message || fallbackError);
            throw fallbackError;
        }
    }
};

module.exports = { sendEmail, getCredentials };
