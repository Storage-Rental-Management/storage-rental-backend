const transporter = require('../config/nodeMailer.js');
const {
  DEFAULT_FROM,
  EMAIL_SUBJECT,
  EMAIL_TEMPLATES,
} = require('../constants/emailConstants'); 
const ejs = require('ejs'); 
const path = require('path'); 

const sendOtpEmail = async (recipient, otp, username = "User") => {
  try {
    // Render EJS template
    const templatePath = path.join(
      __dirname,
      "../templates",
      EMAIL_TEMPLATES.VERIFICATION_EMAIL
    );
    const html = await ejs.renderFile(templatePath, { otp, username });

    const mailOptions = {
      from: DEFAULT_FROM,
      to: recipient,
      subject: EMAIL_SUBJECT.VERIFICATION_EMAIL,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};

const sendPropertyApprovalEmail = async (recipient, propertyData) => {
  try {
    const templatePath = path.join(
      __dirname,
      '../templates',
      EMAIL_TEMPLATES.PROPERTY_APPROVAL
    );
    
    const html = await ejs.renderFile(templatePath, propertyData);

    const mailOptions = {
      from: DEFAULT_FROM,
      to: recipient,
      subject: EMAIL_SUBJECT.PROPERTY_APPROVAL,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (err) {
    console.error("Error sending property approval email:", err);
    throw err;
  }
};

const sendMeetingConfirmationEmail = async (recipient, meeting) => {
  try {
    const templatePath = path.join(
      __dirname,
      '../templates',
      EMAIL_TEMPLATES.MEETING_CONFIRMATION
    );
    const html = await ejs.renderFile(templatePath, {
      username: meeting.attendeeName || 'User',
      title: meeting.title,
      scheduledFor: meeting.scheduledFor,
      location: meeting.location || 'TBD'
    });
    const mailOptions = {
      from: DEFAULT_FROM,
      to: recipient,
      subject: EMAIL_SUBJECT.MEETING_CONFIRMATION,
      html,
    };
    const result = await transporter.sendMail(mailOptions);
    console.log("Meeting confirmation email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending meeting confirmation email:", error);
    throw error;
  }
};

const sendMeetingCompletedEmail = async (recipient, meeting, status) => {
  try {
    const templatePath = path.join(
      __dirname,
      '../templates',
      EMAIL_TEMPLATES.MEETING_COMPLETED
    );
    const html = await ejs.renderFile(templatePath, {
      username: meeting.username || 'User',
      title: meeting.title,
      scheduledFor: meeting.scheduledFor,
      location: meeting.location || 'TBD',
      status
    });
    const mailOptions = {
      from: DEFAULT_FROM,
      to: recipient,
      subject: EMAIL_SUBJECT.MEETING_COMPLETED,
      html,
    };
    const result = await transporter.sendMail(mailOptions);
    console.log("Meeting completed email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending meeting completed email:", error);
    throw error;
  }
};

const sendMeetingRequestEmail = async (recipient, meeting, organizerName, attendeeName) => {
  try {
    const templatePath = path.join(
      __dirname,
      '../templates',
      EMAIL_TEMPLATES.MEETING_REQUEST
    );
    const html = await ejs.renderFile(templatePath, {
      username: attendeeName || 'User',
      organizerName: organizerName || 'Organizer',
      title: meeting.title,
      scheduledFor: meeting.scheduledFor,
      location: meeting.location || 'TBD'
    });
    const mailOptions = {
      from: DEFAULT_FROM,
      to: recipient,
      subject: EMAIL_SUBJECT.MEETING_REQUEST,
      html,
    };
    const result = await transporter.sendMail(mailOptions);
    console.log("Meeting request email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending meeting request email:", error);
    throw error;
  }
};

const sendMeetingDeclinedEmail = async (recipient, meeting, attendeeName) => {
  try {
    const templatePath = path.join(
      __dirname,
      '../templates',
      EMAIL_TEMPLATES.MEETING_DECLINED
    );
    const html = await ejs.renderFile(templatePath, {
      username: attendeeName || 'User',
      title: meeting.title,
      scheduledFor: meeting.scheduledFor,
      location: meeting.location || 'TBD'
    });
    const mailOptions = {
      from: DEFAULT_FROM,
      to: recipient,
      subject: EMAIL_SUBJECT.MEETING_DECLINED,
      html,
    };
    const result = await transporter.sendMail(mailOptions);
    console.log("Meeting declined email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending meeting declined email:", error);
    throw error;
  }
};


module.exports = {
  sendOtpEmail,
  sendPropertyApprovalEmail,
  sendMeetingConfirmationEmail,
  sendMeetingCompletedEmail,
  sendMeetingRequestEmail,
  sendMeetingDeclinedEmail,
};