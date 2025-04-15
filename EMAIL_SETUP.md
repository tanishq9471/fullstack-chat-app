# Email Notification Setup Guide

This guide explains how to set up email notifications for login and signup events in the Chat App.

## Overview

The Chat App now includes email notification functionality that sends emails to users when:
1. They log in to their account
2. They create a new account
3. They log in or sign up using Google OAuth

These notifications enhance security by alerting users about account activity.

## Configuration

### 1. Update Environment Variables

Edit the `.env` file in the backend directory and configure the following email-related variables:

```
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-app-password
SEND_EMAIL_NOTIFICATIONS=true
```

### 2. Gmail App Password Setup

If you're using Gmail as your email service, you'll need to create an "App Password":

1. Go to your Google Account settings: https://myaccount.google.com/
2. Select "Security" from the left menu
3. Under "Signing in to Google," select "2-Step Verification" (you must have this enabled)
4. At the bottom of the page, select "App passwords"
5. Generate a new app password for "Mail" and "Other (Custom name)" - name it "Chat App"
6. Copy the generated 16-character password
7. Paste this password as the `EMAIL_PASSWORD` value in your `.env` file

### 3. Other Email Services

If you want to use a different email service:

1. Change `EMAIL_SERVICE` to one of the supported services (e.g., 'outlook', 'yahoo', etc.)
2. Update `EMAIL_USER` and `EMAIL_PASSWORD` with your credentials for that service

### 4. Disable Email Notifications

If you want to disable email notifications temporarily:

```
SEND_EMAIL_NOTIFICATIONS=false
```

## Customization

### Email Templates

The email templates are defined in `/backend/src/utils/emailService.js`. You can modify the HTML content to customize the appearance and content of the emails.

### Device Information

The app collects basic device information (browser, operating system) to include in the notification emails. This functionality is implemented in `/backend/src/utils/deviceInfo.js`.

## Troubleshooting

If emails are not being sent:

1. Check the server logs for any error messages related to email sending
2. Verify that your email credentials are correct
3. If using Gmail, ensure that "Less secure app access" is enabled or that you're using an App Password
4. Check if your email service provider has any sending limits or restrictions

## Security Considerations

- The app uses environment variables to store sensitive email credentials
- Emails are sent asynchronously to avoid blocking the authentication process
- No sensitive information (like passwords) is included in the notification emails