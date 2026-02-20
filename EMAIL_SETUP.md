# 📧 Email Service Configuration Guide

## Quick Start for Development

This application requires an email service to send verification codes during user registration. The easiest solution is **Gmail with App Password**.

---

## Option 1: Gmail (Recommended for Development)

### Prerequisites
- A Gmail account (existing or create `pokedec.noreply@gmail.com`)
- 5 minutes for setup

### Setup Steps

1. **Enable 2-Step Verification** (if not already done)
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"

2. **Create an App Password**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Under "2-Step Verification" → "App passwords"
   - Select "Other (Custom name)" → Type: `PokedEC`
   - Click "Generate"
   - **Copy the 16-character password** (remove spaces)

3. **Configure Environment Variables**

   Edit `.env.local` (for local development):
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcdefghijklmnop  # 16-char App Password (no spaces)
   SMTP_FROM=your-email@gmail.com
   SMTP_FROM_NAME=PokedEC - Communauté Pokémon GO
   ```

4. **Restart the backend container**
   ```bash
   docker-compose restart backend
   ```

### Limitations
- **500 emails per day** (sufficient for most use cases)
- Gmail may flag suspicious activity if sending many emails rapidly

---

## Option 2: SendGrid (Recommended for Production)

### Prerequisites
- SendGrid account (free tier: 100 emails/day)
- No credit card required for free tier

### Setup Steps

1. **Create SendGrid Account**
   - Go to [SendGrid](https://sendgrid.com/)
   - Sign up for free account
   - Verify your email

2. **Create API Key**
   - Settings → API Keys → Create API Key
   - Name: `PokedEC Verification`
   - Permissions: "Mail Send" → Full Access
   - Copy the API key

3. **Configure Environment Variables**
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Your SendGrid API key
   SMTP_FROM=your-verified-sender@yourdomain.com
   SMTP_FROM_NAME=PokedEC - Communauté Pokémon GO
   ```

### Advantages
- Better deliverability
- Email analytics
- Higher daily limits

---

## Option 3: Other SMTP Providers

The application works with any SMTP server. Configure accordingly:

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

### Office 365 / Outlook
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Custom SMTP Server
```bash
SMTP_HOST=smtp.yourserver.com
SMTP_PORT=587  # or 465 for SSL
SMTP_SECURE=false  # or true for SSL
SMTP_USER=your-username
SMTP_PASS=your-password
```

---

## Testing Email Configuration

After configuration, test email sending:

1. Create a new account through the signup form
2. Check your email inbox (and spam folder!)
3. You should receive a 4-digit verification code within seconds

### Troubleshooting

**Emails not arriving?**
- Check spam/junk folder
- Verify SMTP credentials in `.env.local`
- Check backend logs: `docker-compose logs backend`
- Ensure Gmail "Less secure app access" is NOT required (use App Password instead)

**"Failed to send verification email" error?**
- Check SMTP configuration values
- Ensure App Password is correct (no spaces)
- Gmail: Check 2FA is enabled
- Check internet connection

**Still not working?**
- Check backend logs for detailed error messages
- Try a different SMTP port (587 or 465)
- For Gmail: Ensure "Allow less secure apps" is OFF (use App Password)

---

## Security Notes

### For GitHub Publication
- ✅ Never commit `.env.local` or `.env.synology` (already in `.gitignore`)
- ✅ Use `.env.example` with placeholder values
- ✅ Document setup in this file
- ✅ Each deployment uses its own SMTP credentials

### Best Practices
- Use App Passwords instead of account passwords
- Rotate API keys/passwords regularly
- Monitor email sending quotas
- Use a dedicated email account for production

---

## Environment Files

### `.env.local` (Local Development)
- **Location:** `/path/to/ng-PokedEC/.env.local`
- **Purpose:** Local Docker development
- **Not committed to Git**

### `.env.synology` (Production - Synology NAS)
- **Location:** `/path/to/ng-PokedEC/.env.synology`
- **Purpose:** Production deployment
- **Not committed to Git**

### `.env.example` (Template)
- **Location:** `/path/to/ng-PokedEC/.env.example`
- **Purpose:** Template with placeholder values
- **Committed to Git** (no real credentials)

---

## Support

If you need help configuring email:
1. Check the troubleshooting section above
2. Review backend logs
3. Verify SMTP credentials with your provider
4. Test SMTP connection using an online SMTP tester

---

## Summary

1. Choose a provider (Gmail recommended for dev)
2. Get SMTP credentials (App Password for Gmail)
3. Add credentials to `.env.local`
4. Restart backend
5. Test signup flow
