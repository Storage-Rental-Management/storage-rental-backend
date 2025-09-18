const DEFAULT_FROM = "qa.dev140@gmail.com";

const EMAIL_SUBJECT = {
  VERIFICATION_EMAIL: "Verification Email From Storage Rental App",
  RESET_PASSWORD: "Reset Your Password",
  PROPERTY_APPROVAL: "New Property Approval Request",
  MEETING_CONFIRMATION: "Your Meeting Has Been Confirmed",
  MEETING_COMPLETED: "Your Meeting Status Update",
  MEETING_REQUEST: "New Meeting Request Received",
  MEETING_DECLINED: "Your Meeting Request Was Declined",
  DOCUMENT_REVIEW_REQUEST: "New Document Review Request",
  DOCUMENT_STATUS_UPDATE: "Document Review Status Update",
  DOCUMENT_RESUBMISSION_REQUEST: "New Document Resubmission Request",
  AD_REVIEW_REQUEST: "New Advertisement Review Request",
  AD_STATUS_UPDATE: "Your Advertisement Status Update",
  AD_PUBLISHED: "Your Advertisement is Now Live",
};

const EMAIL_TEMPLATES = {
  VERIFICATION_EMAIL: "otpVerificationTemplate.ejs",
  RESET_PASSWORD: "resetPasswordTemplate.ejs",
  PROPERTY_APPROVAL: "propertyApprovalRequest.ejs",
  MEETING_CONFIRMATION: "meetingConfirmationTemplate.ejs",
  MEETING_COMPLETED: "meetingCompletedTemplate.ejs",
  MEETING_REQUEST: "meetingRequestTemplate.ejs",
  MEETING_DECLINED: "meetingDeclinedTemplate.ejs",
  DOCUMENT_REVIEW_REQUEST: "documentReviewRequest.ejs",
  DOCUMENT_STATUS_UPDATE: "documentStatusUpdate.ejs",
  DOCUMENT_RESUBMISSION_REQUEST: "documentResubmissionRequest.ejs",
  AD_REVIEW_REQUEST: "adReviewRequest.ejs",
  AD_STATUS_UPDATE: "adStatusUpdate.ejs",
  AD_PUBLISHED: "adPublished.ejs",
};

module.exports = {
  DEFAULT_FROM,
  EMAIL_SUBJECT,
  EMAIL_TEMPLATES,
};
