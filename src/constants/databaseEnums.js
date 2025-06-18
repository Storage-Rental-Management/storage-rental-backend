const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
};

const STORAGE_PROPERTY_STATUS = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    REJECTED: 'rejected',
};

const STORAGE_UNIT_TYPES = {
    SELF_STORAGE: 'Self Storage',
    COLD_STORAGE: 'Cold Storage',
    SPACE: 'Space',
};

const PAYMENT_METHODS = {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
};

const STORAGE_UNIT_STATUS = {
    DRAFT: 'draft',
    AVAILABLE: 'available',
    UNDER_REVIEW: 'under_review',
    RESERVED: 'reserved',
    OCCUPIED: 'occupied',
    MAINTENANCE: 'maintenance',
    INACTIVE: 'inactive'
};

const ROLES = {
    USER: 'User',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
};

const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
};

const BOOKING_STATUS = {
    ACTIVE: 'active',
    FREE: 'free',
    MEETING: 'meeting',
    PROCESSING: 'processing',
    RESERVATION: 'reservation',

    // Meeting-based Flow States
    MEETING_REQUESTED: 'meeting-requested',
    MEETING_SCHEDULED: 'meeting-scheduled',
    MEETING_CONFIRMED: 'meeting-confirmed',
    MEETING_COMPLETED: 'meeting-completed',
    MEETING_REJECTED: 'meeting-rejected',
  
  // Document States
  DOCUMENTS_UPLOADED: 'documents-uploaded',
  DOCUMENTS_UNDER_REVIEW: 'documents-under-review',
  DOCUMENTS_APPROVED: 'documents-approved',
  DOCUMENTS_REJECTED: 'documents-rejected',
  DOCUMENTS_RESUBMITTED: 'documents-resubmitted',
  DOCUMENTS_RESUBMISSION_REQUIRED: 'documents-resubmission-required',
  
  // Payment States
  PAYMENT_PENDING: 'payment-pending',
  PAYMENT_COMPLETED: 'payment-completed',
  PAYMENT_FAILED: 'payment-failed',

};

const MEETING_STATUS = {
    MEETING_REQUESTED: 'meeting-requested',
    MEETING_SCHEDULED: 'meeting-scheduled',
    MEETING_CONFIRMED: 'meeting-confirmed',
    MEETING_COMPLETED: 'meeting-completed',
    MEETING_REJECTED: 'meeting-rejected',
};

const DOCUMENT_STATUS = {
  DOCUMENTS_UPLOADED: 'documents-uploaded',
  DOCUMENTS_UNDER_REVIEW: 'documents-under-review',
  DOCUMENTS_APPROVED: 'documents-approved',
  DOCUMENTS_REJECTED: 'documents-rejected',
  DOCUMENTS_RESUBMITTED: 'documents-resubmitted',
  DOCUMENTS_RESUBMISSION_REQUIRED: 'documents-resubmission-required',
}

const DOCUMENT_TYPES = {
    BUSINESS_LICENSE: 'Business License',
    STORAGE_LICENSE: 'Storage License',
    ID_PROOF: 'ID Proof',
    ADHAR_CARD: 'Aadhar Card',
    PAN_CARD: 'PAN Card',
    INCOME_PROOF: 'Income Proof',
    REFERENCE_LETTER: 'Reference Letter',
};

const AUTH_PROVIDER = {
    LOCAL: 'local',
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
};

module.exports = {
    USER_STATUS,
    STORAGE_PROPERTY_STATUS,
    STORAGE_UNIT_TYPES,
    PAYMENT_METHODS,
    STORAGE_UNIT_STATUS,
    ROLES,
    PAYMENT_STATUS,
    BOOKING_STATUS,
    MEETING_STATUS,
    DOCUMENT_STATUS,
    DOCUMENT_TYPES,
    AUTH_PROVIDER
};

