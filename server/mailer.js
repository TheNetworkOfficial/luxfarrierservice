// mailer.js
const sgMail = require('@sendgrid/mail');
const path = require("path");

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Set your API key once
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Optionally set a default "from" address for all your emails
// sgMail.setFrom(process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com');

/**
 * Send an admin notification email when a new appointment is requested.
 * @param {object} appointment - The appointment object from MongoDB.
 */
exports.sendAdminNotification = async (appointment) => {
  try {
    const msg = {
      to: process.env.ADMIN_EMAIL,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject: 'New Appointment Request',
      html: `
        <h2>New Appointment Request</h2>
        <p>From: ${appointment.client.firstName} ${appointment.client.lastName}</p>
        <p>View details: ${process.env.ADMIN_URL}/appointments/${appointment._id}</p>
      `,
    };
    await sgMail.send(msg);
    console.log('Admin notification sent successfully');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

/**
 * Send a confirmation email to the user indicating their request was received.
 * @param {object} appointment - The appointment object from MongoDB.
 */
exports.sendUserConfirmation = async (appointment) => {
  try {
    const msg = {
      to: appointment.client.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
      subject: 'Appointment Request Received',
      html: `
        <h2>Thank you for your request!</h2>
        <p>We'll confirm your appointment within 24 hours.</p>
        <p>Requested times:</p>
        <ul>
          ${appointment.selectedSlots.map(slot =>
            `<li>${new Date(slot.date).toLocaleDateString()} - ${slot.hour}:00</li>`
          ).join('')}
        </ul>
      `,
    };
    await sgMail.send(msg);
    console.log('User confirmation sent successfully');
  } catch (error) {
    console.error('Error sending user confirmation:', error);
  }
};