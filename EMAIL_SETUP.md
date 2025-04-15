# Email Notification Setup Guide

This guide explains how to set up email notifications for login and signup events in the Chat App.

## Overview

The Chat App now includes email notification functionality that sends emails to users when:
1. They log in to their account (regular login)
2. They create a new account (signup)
3. They log in or sign up using Google OAuth

These notifications enhance security by alerting users about account activity and helping detect unauthorized access.

## Configuration

### 1. Update Environment Variables

Edit the `.env` file in the backend directory and configure the following email-related variables:

```
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your.actual.email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
SEND_EMAIL_NOTIFICATIONS=true
```

**Important**: You must replace the placeholder values with your actual email credentials for the notifications to work.

### 2. Gmail App Password Setup (Recommended)

If you're using Gmail as your email service, you'll need to create an "App Password" (not your regular Gmail password):

1. Go to your Google Account settings: https://myaccount.google.com/
2. Select "Security" from the left menu
3. Make sure "2-Step Verification" is enabled (required for app passwords)
4. At the bottom of the 2-Step Verification page, select "App passwords"
5. Click "Select app" and choose "Mail"
6. Click "Select device" and choose "Other (Custom name)" - name it "Chat App"
7. Click "Generate"
8. Copy the generated 16-character password (spaces will be removed automatically)
9. Paste this password as the `EMAIL_PASSWORD` value in your `.env` file

### 3. Other Email Services

If you want to use a different email service:

1. Change `EMAIL_SERVICE` to one of the supported services:
   - 'gmail' (default)
   - 'outlook'
   - 'yahoo'
   - 'hotmail'
   - 'aol'
   - And others supported by Nodemailer

2. Update `EMAIL_USER` and `EMAIL_PASSWORD` with your credentials for that service

### 4. Enable/Disable Email Notifications

To enable email notifications:
```
SEND_EMAIL_NOTIFICATIONS=true
```

To disable email notifications:
```
SEND_EMAIL_NOTIFICATIONS=false
```

## Testing Your Configuration

After setting up your email configuration:

1. Restart the backend server
2. Check the server logs for messages like:
   - "Email service initialized with gmail for your.email@gmail.com"
   - "Preparing login notification email data"
   - "Login notification email sent successfully"

3. Try logging in or signing up to test if emails are being sent

## Customization

### Email Templates

The email templates are defined in `/backend/src/utils/emailService.js`. You can modify the HTML content to customize the appearance and content of the emails:

- Login notification template: Lines 66-92
- Signup confirmation template: Lines 125-149

### Device Information

The app collects basic device information (browser, operating system) to include in the notification emails. This functionality is implemented in `/backend/src/utils/deviceInfo.js`.

## Troubleshooting

If emails are not being sent:

1. Check the server logs for detailed error messages
2. Verify that your email credentials are correct and not the placeholder values
3. For Gmail:
   - Make sure you're using an App Password, not your regular password
   - Ensure 2-Step Verification is enabled on your Google account
   - Check if your Google account has any security restrictions

4. Try a different email service if one isn't working
5. Make sure `SEND_EMAIL_NOTIFICATIONS` is set to `true`
6. Check your spam/junk folder for the notification emails

## Security Considerations

- The app uses environment variables to store sensitive email credentials
- Emails are sent asynchronously to avoid blocking the authentication process
- No sensitive information (like passwords) is included in the notification emails
- The app validates email configuration before attempting to send emails
- Detailed error logging helps diagnose issues without exposing sensitive information