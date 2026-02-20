const nodemailer = require('nodemailer');

/**
 * Email Service for sending verification codes and notifications
 * Uses SMTP configuration from environment variables
 */

// Create reusable transporter
const createTransporter = () => {
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };

    if (!config.auth.user || !config.auth.pass) {
        console.warn('[Email Service] SMTP credentials not configured. Email sending will fail.');
    }

    return nodemailer.createTransport(config);
};

/**
 * Send verification code email
 * @param {string} email - Recipient email address
 * @param {string} code - 4-digit verification code
 * @returns {Promise} - Resolves when email is sent
 */
const sendVerificationCode = async (email, code) => {
    const transporter = createTransporter();

    const fromName = process.env.SMTP_FROM_NAME || "PokedEC - Communauté Pokémon GO";
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: '🔐 Votre code de vérification PokedEC',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                    .code { font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #667eea; font-family: 'Courier New', monospace; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Vérification de votre email</h1>
                    </div>
                    <div class="content">
                        <p>Bonjour,</p>
                        <p>Merci de vous inscrire sur <strong>PokedEC</strong>, la communauté Pokémon GO !</p>
                        <p>Voici votre code de vérification :</p>
                        
                        <div class="code-box">
                            <div class="code">${code}</div>
                        </div>
                        
                        <p style="text-align: center; color: #666;">Entrez ce code dans l'application pour activer votre compte.</p>
                        
                        <div class="warning">
                            <strong>⏱️ Attention :</strong> Ce code expire dans <strong>5 minutes</strong>.
                        </div>
                        
                        <p><strong>Vérifiez votre dossier SPAM</strong> si vous ne voyez pas cet email dans votre boîte de réception.</p>
                        
                        <p>Si vous n'avez pas demandé ce code, ignorez simplement cet email.</p>
                        
                        <div class="footer">
                            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                            <p>© ${new Date().getFullYear()} PokedEC - Communauté Pokémon GO</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
Bonjour,

Merci de vous inscrire sur PokedEC, la communauté Pokémon GO !

Votre code de vérification : ${code}

Ce code expire dans 5 minutes.

Si vous n'avez pas demandé ce code, ignorez cet email.

Vérifiez votre dossier SPAM si vous ne voyez pas cet email.

© ${new Date().getFullYear()} PokedEC
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Verification code sent to ${email}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[Email Service] Failed to send verification code to ${email}:`, error);
        throw new Error('Failed to send verification email');
    }
};

/**
 * Generate a 4-digit verification code
 * @returns {string} - Random 4-digit code
 */
const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

module.exports = {
    sendVerificationCode,
    generateVerificationCode
};
