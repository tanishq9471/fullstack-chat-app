import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send login notification email
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @param {Object} loginInfo - Information about the login
 */
export const sendLoginNotification = async (to, name, loginInfo) => {
  try {
    const { ip, device, browser, time } = loginInfo;
    
    const mailOptions = {
      from: `"Chat App Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'New Login to Your Chat App Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a5568;">New Login to Your Account</h2>
          <p>Hello ${name},</p>
          <p>We detected a new login to your Chat App account.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>IP Address:</strong> ${ip}</p>
            <p><strong>Device:</strong> ${device}</p>
            <p><strong>Browser:</strong> ${browser}</p>
          </div>
          
          <p>If this was you, you can ignore this email.</p>
          <p>If you didn't log in recently, please change your password immediately and contact support.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #718096;">
            <p>This is an automated message, please do not reply.</p>
            <p>Chat App Security Team</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Login notification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending login notification email:', error);
    return false;
  }
};

/**
 * Send signup confirmation email
 * @param {string} to - Recipient email address
 * @param {string} name - User's name
 * @param {Object} signupInfo - Information about the signup
 */
export const sendSignupConfirmation = async (to, name, signupInfo) => {
  try {
    const { ip, device, browser, time } = signupInfo;
    
    const mailOptions = {
      from: `"Chat App" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Welcome to Chat App!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a5568;">Welcome to Chat App!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for creating an account with us. We're excited to have you on board!</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p>Your account was created at: ${time}</p>
            <p><strong>Device:</strong> ${device}</p>
            <p><strong>Browser:</strong> ${browser}</p>
          </div>
          
          <p>You can now start chatting with your friends and create group conversations.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #718096;">
            <p>If you didn't create this account, please contact our support team immediately.</p>
            <p>Chat App Team</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Signup confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending signup confirmation email:', error);
    return false;
  }
};