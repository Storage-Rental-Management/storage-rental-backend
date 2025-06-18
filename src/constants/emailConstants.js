const DEFAULT_FROM = "zaranachothani90@gmail.com";

const EMAIL_SUBJECT = {
  VERIFICATION_EMAIL: "Verification Email From Chat App",
  PROPERTY_APPROVAL: "New Property Approval Request",
  MEETING_CONFIRMATION: "Your Meeting Has Been Confirmed",
  MEETING_COMPLETED: "Your Meeting Status Update",
  MEETING_REQUEST: "New Meeting Request Received",
  MEETING_DECLINED: "Your Meeting Request Was Declined",
};

const EMAIL_TEMPLATES = {
  VERIFICATION_EMAIL: "otpVerificationTemplate.ejs",
  PROPERTY_APPROVAL: "propertyApprovalRequest.ejs",
  MEETING_CONFIRMATION: "meetingConfirmationTemplate.ejs",
  MEETING_COMPLETED: "meetingCompletedTemplate.ejs",
  MEETING_REQUEST: "meetingRequestTemplate.ejs",
  MEETING_DECLINED: "meetingDeclinedTemplate.ejs",
};

module.exports = {
  DEFAULT_FROM,
  EMAIL_SUBJECT,
  EMAIL_TEMPLATES,
};
