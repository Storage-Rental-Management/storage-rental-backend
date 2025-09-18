const { title } = require("process");
const transporter = require("../config/nodeMailer.js");
const {
  DEFAULT_FROM,
  EMAIL_SUBJECT,
  EMAIL_TEMPLATES,
} = require("../constants/emailConstants");
const ejs = require("ejs");
const path = require("path");

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
      title: "Storage Management System",
      from: DEFAULT_FROM,
      to: recipient,
      subject: EMAIL_SUBJECT.VERIFICATION_EMAIL,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
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
      "../templates",
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
      "../templates",
      EMAIL_TEMPLATES.MEETING_CONFIRMATION
    );
    const html = await ejs.renderFile(templatePath, {
      username: meeting.attendeeName || "User",
      title: meeting.title,
      scheduledFor: meeting.scheduledFor,
      location: meeting.location || "TBD",
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
      "../templates",
      EMAIL_TEMPLATES.MEETING_COMPLETED
    );
    const html = await ejs.renderFile(templatePath, {
      username: meeting.username || "User",
      title: meeting.title,
      scheduledFor: meeting.scheduledFor,
      location: meeting.location || "TBD",
      status,
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

const sendMeetingRequestEmail = async (
  recipient,
  meeting,
  organizerName,
  attendeeName
) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates",
      EMAIL_TEMPLATES.MEETING_REQUEST
    );
    const html = await ejs.renderFile(templatePath, {
      username: attendeeName || "User",
      organizerName: organizerName || "Organizer",
      title: meeting.title,
      scheduledFor: meeting.scheduledFor,
      location: meeting.location || "TBD",
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
      "../templates",
      EMAIL_TEMPLATES.MEETING_DECLINED
    );
    const html = await ejs.renderFile(templatePath, {
      username: attendeeName || "User",
      title: meeting.title,
      scheduledFor: meeting.scheduledFor,
      location: meeting.location || "TBD",
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

const sendDocumentReviewRequestEmail = async (adminEmail, documentData) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates",
      EMAIL_TEMPLATES.DOCUMENT_REVIEW_REQUEST
    );
    const html = await ejs.renderFile(templatePath, documentData);

    const mailOptions = {
      from: DEFAULT_FROM,
      to: adminEmail,
      subject: EMAIL_SUBJECT.DOCUMENT_REVIEW_REQUEST,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Document review request email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending document review request email:", error);
    throw error;
  }
};

const sendDocumentStatusUpdateEmail = async (userEmail, documentData) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates",
      EMAIL_TEMPLATES.DOCUMENT_STATUS_UPDATE
    );
    const html = await ejs.renderFile(templatePath, documentData);

    const mailOptions = {
      from: DEFAULT_FROM,
      to: userEmail,
      subject: EMAIL_SUBJECT.DOCUMENT_STATUS_UPDATE,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Document status update email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending document status update email:", error);
    throw error;
  }
};

const sendDocumentResubmissionRequestEmail = async (
  adminEmail,
  documentData
) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates",
      EMAIL_TEMPLATES.DOCUMENT_RESUBMISSION_REQUEST
    );
    const html = await ejs.renderFile(templatePath, documentData);

    const mailOptions = {
      from: DEFAULT_FROM,
      to: adminEmail,
      subject: EMAIL_SUBJECT.DOCUMENT_RESUBMISSION_REQUEST,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Document resubmission request email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending document resubmission request email:", error);
    throw error;
  }
};

const sendAdReviewRequestEmail = async (adminEmail, adData) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates",
      EMAIL_TEMPLATES.AD_REVIEW_REQUEST
    );
    const html = await ejs.renderFile(templatePath, adData);

    const mailOptions = {
      from: DEFAULT_FROM,
      to: adminEmail,
      subject: EMAIL_SUBJECT.AD_REVIEW_REQUEST,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Ad review request email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending ad review request email:", error);
    throw error;
  }
};

const sendAdStatusUpdateEmail = async (userEmail, adData) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates",
      EMAIL_TEMPLATES.AD_STATUS_UPDATE
    );
    const html = await ejs.renderFile(templatePath, adData);

    const mailOptions = {
      from: DEFAULT_FROM,
      to: userEmail,
      subject: EMAIL_SUBJECT.AD_STATUS_UPDATE,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Ad status update email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending ad status update email:", error);
    throw error;
  }
};

const sendAdPublishedEmail = async (userEmail, adData) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates",
      EMAIL_TEMPLATES.AD_PUBLISHED
    );
    const html = await ejs.renderFile(templatePath, adData);

    const mailOptions = {
      from: DEFAULT_FROM,
      to: userEmail,
      subject: EMAIL_SUBJECT.AD_PUBLISHED,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Ad published email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending ad published email:", error);
    throw error;
  }
};

const sendResetPasswordEmail = async (userEmail, resetData) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates",
      EMAIL_TEMPLATES.RESET_PASSWORD
    );

    // resetData = { username, resetLink }
    const html = await ejs.renderFile(templatePath, resetData);
    
    const mailOptions = {
      from: DEFAULT_FROM,
      to: userEmail,
      subject: EMAIL_SUBJECT.RESET_PASSWORD,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Reset password email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending reset password email:", error);
    throw error;
  }
};

module.exports = {
  sendOtpEmail,
  sendResetPasswordEmail,
  sendPropertyApprovalEmail,
  sendMeetingConfirmationEmail,
  sendMeetingCompletedEmail,
  sendMeetingRequestEmail,
  sendMeetingDeclinedEmail,
  sendDocumentReviewRequestEmail,
  sendDocumentStatusUpdateEmail,
  sendDocumentResubmissionRequestEmail,
  sendAdReviewRequestEmail,
  sendAdStatusUpdateEmail,
  sendAdPublishedEmail,
};
