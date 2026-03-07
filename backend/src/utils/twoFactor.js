const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

/**
 * Generate a new TOTP secret for a user
 * @param {string} userEmail 
 * @returns {Promise<{secret: string, otpauthUrl: string, qrCodeDataUrl: string}>}
 */
const generate2FASecret = async (userEmail) => {
    const secret = speakeasy.generateSecret({
        name: `PokedEC (${userEmail})`,
        issuer: 'PokedEC'
    });
    
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    
    return {
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
        qrCodeDataUrl
    };
};

/**
 * Verify a TOTP token against a secret
 * @param {string} token 
 * @param {string} secret 
 * @returns {boolean}
 */
const verify2FAToken = (token, secret) => {
    return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
    });
};

module.exports = {
    generate2FASecret,
    verify2FAToken
};
