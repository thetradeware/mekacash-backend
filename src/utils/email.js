import nodemailer from 'nodemailer';
import { logger } from './logger.js';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  'email-verification': {
    subject: 'Verify your MekaCash account',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your MekaCash account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to MekaCash!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Thank you for signing up with MekaCash! To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${data.verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with MekaCash, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 MekaCash. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  'password-reset': {
    subject: 'Reset your MekaCash password',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your MekaCash password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>We received a request to reset your MekaCash password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${data.resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 MekaCash. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  'booking-confirmation': {
    subject: 'Booking Confirmed - MekaCash',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Your booking has been confirmed! Here are the details:</p>
            <div class="booking-details">
              <h3>Booking Details</h3>
              <p><strong>Booking ID:</strong> ${data.bookingId}</p>
              <p><strong>Service:</strong> ${data.serviceName}</p>
              <p><strong>Date:</strong> ${data.scheduledDate}</p>
              <p><strong>Time:</strong> ${data.scheduledTime}</p>
              <p><strong>Amount:</strong> $${data.amount}</p>
              <p><strong>Status:</strong> ${data.status}</p>
            </div>
            <p>We'll send you updates about your booking status.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 MekaCash. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  'payment-success': {
    subject: 'Payment Successful - MekaCash',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Successful</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .payment-details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Your payment has been processed successfully!</p>
            <div class="payment-details">
              <h3>Payment Details</h3>
              <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
              <p><strong>Amount:</strong> $${data.amount}</p>
              <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
              <p><strong>Date:</strong> ${data.paymentDate}</p>
            </div>
            <p>Thank you for using MekaCash!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 MekaCash. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },
  
  'welcome': {
    subject: 'Welcome to MekaCash!',
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to MekaCash</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to MekaCash!</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Welcome to MekaCash! We're excited to have you on board.</p>
            <p>With MekaCash, you can:</p>
            <ul>
              <li>Book services instantly</li>
              <li>Track your bookings in real-time</li>
              <li>Pay securely through our platform</li>
              <li>Earn rewards and discounts</li>
            </ul>
            <p>Get started by exploring our services!</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 MekaCash. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// Send email function
export const sendEmail = async ({ to, subject, template, data = {}, attachments = [] }) => {
  try {
    const transporter = createTransporter();
    
    // Get template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }
    
    // Prepare email options
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@mekacash.com',
      to,
      subject: emailTemplate.subject,
      html: emailTemplate.html(data),
      attachments
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully to ${to}`, {
      messageId: info.messageId,
      template,
      subject
    });
    
    return info;
    
  } catch (error) {
    logger.error('Email sending failed', {
      to,
      template,
      error: error.message
    });
    throw error;
  }
};

// Send custom email
export const sendCustomEmail = async ({ to, subject, html, text, attachments = [] }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@mekacash.com',
      to,
      subject,
      html,
      text,
      attachments
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Custom email sent successfully to ${to}`, {
      messageId: info.messageId,
      subject
    });
    
    return info;
    
  } catch (error) {
    logger.error('Custom email sending failed', {
      to,
      subject,
      error: error.message
    });
    throw error;
  }
};

// Send bulk emails
export const sendBulkEmails = async (emails) => {
  try {
    const transporter = createTransporter();
    const results = [];
    
    for (const email of emails) {
      try {
        const emailTemplate = emailTemplates[email.template];
        if (!emailTemplate) {
          throw new Error(`Email template '${email.template}' not found`);
        }
        
        const mailOptions = {
          from: process.env.SMTP_FROM || 'noreply@mekacash.com',
          to: email.to,
          subject: emailTemplate.subject,
          html: emailTemplate.html(email.data || {}),
          attachments: email.attachments || []
        };
        
        const info = await transporter.sendMail(mailOptions);
        results.push({ success: true, to: email.to, messageId: info.messageId });
        
      } catch (error) {
        results.push({ success: false, to: email.to, error: error.message });
      }
    }
    
    logger.info(`Bulk email sending completed`, {
      total: emails.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
    return results;
    
  } catch (error) {
    logger.error('Bulk email sending failed', {
      error: error.message
    });
    throw error;
  }
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed', {
      error: error.message
    });
    return false;
  }
}; 