const USER_STATUS = {
  ACTIVE: "Active",
  BLOCKED: "Blocked",
};

const STORAGE_PROPERTY_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  REJECTED: "rejected",
};

const STORAGE_UNIT_TYPES = {
  SELF_STORAGE: "Self Storage",
  COLD_STORAGE: "Cold Storage",
  RV_SPACE: "RV Space",
  CAR_SPACE: "Car Space",
  BOAT_SPACE: "Boat Space",
};

const PAYMENT_METHODS = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

const STORAGE_UNIT_STATUS = {
  DRAFT: "draft",
  AVAILABLE: "available",
  UNDER_REVIEW: "under_review",
  RESERVED: "reserved",
  OCCUPIED: "occupied",
  MAINTENANCE: "maintenance",
  INACTIVE: "inactive",
};

const ROLES = {
  USER: "User",
  ADMIN: "Admin",
  SUPER_ADMIN: "SuperAdmin",
};

const PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  REQUESTED: "requested",
  REJECTED: "rejected",
  PAID: "paid",
};

const PAYMENT_TYPE = {
  PAYMENT: "payment",
  PAYOUT: "payout",
};

const CASH_PAYMENT_TYPE = {
  CASH: "cash",
  CHEQUE: "cheque",
  ETRANSFER: "eTransfer",
};

const PAYMENT_PERIOD = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
};

const BOOKING_STATUS = {
  ACTIVE: "active",
  FREE: "free",
  MEETING: "meeting",
  PROCESSING: "processing",
  RESERVATION: "reservation",
  BOOKING_CANCELLED: "booking-cancelled",
  BOOKING_CONFIRMED: "booking-confirmed",
  BOOKING_EXPIRED: "booking-expired",

  // Meeting-based Flow States
  MEETING_REQUESTED: "meeting-requested",
  MEETING_SCHEDULED: "meeting-scheduled",
  MEETING_CONFIRMED: "meeting-confirmed",
  MEETING_COMPLETED: "meeting-completed",
  MEETING_REJECTED: "meeting-rejected",

  // Document States
  DOCUMENTS_UPLOADED: "documents-uploaded",
  DOCUMENTS_UNDER_REVIEW: "documents-under-review",
  DOCUMENTS_APPROVED: "documents-approved",
  DOCUMENTS_REJECTED: "documents-rejected",
  DOCUMENTS_RESUBMITTED: "documents-resubmitted",
  DOCUMENTS_RESUBMISSION_REQUIRED: "documents-resubmission-required",

  // Payment States
  PAYMENT_PENDING: "payment-pending",
  PAYMENT_COMPLETED: "payment-completed",
  PAYMENT_FAILED: "payment-failed",
};

const MEETING_STATUS = {
  MEETING_REQUESTED: "meeting-requested",
  MEETING_SCHEDULED: "meeting-scheduled",
  MEETING_CONFIRMED: "meeting-confirmed",
  MEETING_COMPLETED: "meeting-completed",
  MEETING_REJECTED: "meeting-rejected",
};

const MEETING_TYPES = {
  GOOGLE_MEET: "google-meet",
  WHATSAPP_CALL: "whatsApp-call",
  IN_PERSON: "In Person",
};

const DOCUMENT_STATUS = {
  DOCUMENTS_UPLOADED: "documents-uploaded",
  DOCUMENTS_UNDER_REVIEW: "documents-under-review",
  DOCUMENTS_APPROVED: "documents-approved",
  DOCUMENTS_REJECTED: "documents-rejected",
  DOCUMENTS_RESUBMITTED: "documents-resubmitted",
  DOCUMENTS_RESUBMISSION_REQUIRED: "documents-resubmission-required",
};

const DOCUMENT_TYPES = {
  BUSINESS_LICENSE: "business-license",
  STORAGE_LICENSE: "storage-license",
  ID_PROOF: "id-proof",
  AADHAR_CARD: "aadhar-card",
  PAN_CARD: "pan-card",
  INCOME_PROOF: "income-proof",
  REFERENCE_LETTER: "reference-letter",
  PASSPORT: "user-passport",
  DRIVING_LICENSE: "driving-license",
};

const AUTH_PROVIDER = {
  LOCAL: "local",
  GOOGLE: "google",
  FACEBOOK: "facebook",
  APPLE: "apple",
};

const AD_STATUS = {
  AD_DRAFT: "ad-draft",
  AD_UNDER_REVIEW: "ad-under-review",
  AD_APPROVED: "ad-approved",
  AD_REJECTED: "ad-rejected",
};

const BOOKING_ACTIONS = {
  NOTIFY_PAYMENT: "notify-payment",
  BOOKING_CANCELLED: "booking-cancelled",
  COLLECT_PAYMENT: "collect-payment",
};

const CASH_PAYMENT_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const RECOMMENDED_STATUS = {
  // PROPERTY_DRAFT: "property-draft",
  UNDER_REVIEW: "under-review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const RECOMMENDED_FOR = {
  PROPERTY: "property",
  UNIT: "unit",
};

module.exports = {
  USER_STATUS,
  STORAGE_PROPERTY_STATUS,
  STORAGE_UNIT_TYPES,
  PAYMENT_METHODS,
  STORAGE_UNIT_STATUS,
  ROLES,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  PAYMENT_PERIOD,
  BOOKING_STATUS,
  MEETING_STATUS,
  MEETING_TYPES,
  DOCUMENT_STATUS,
  DOCUMENT_TYPES,
  AUTH_PROVIDER,
  AD_STATUS,
  CASH_PAYMENT_REQUEST_STATUS,
  RECOMMENDED_STATUS,
  RECOMMENDED_FOR,
  CASH_PAYMENT_TYPE,
  BOOKING_ACTIONS,
};
