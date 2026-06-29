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

    // Create standard Gmail transporter using Nodemailer's native well-known config
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('[Mailer] Email sending failed:', error.message || error);
        throw error;
    }
};

module.exports = { sendEmail, getCredentials };
