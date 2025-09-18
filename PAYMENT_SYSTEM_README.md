# Payment System Documentation

## Overview

This payment system integrates Stripe payment processing for storage unit rentals. It handles payment intents, confirmations, webhooks, and provides comprehensive payment management for both customers and property owners.

## Features

- **Stripe Integration**: Full Stripe payment processing with Payment Intents
- **Multi-currency Support**: Primarily INR (Indian Rupees) with support for other currencies
- **Fee Management**: Automatic calculation of platform fees and Stripe processing fees
- **Webhook Handling**: Real-time payment status updates via Stripe webhooks
- **Payment Tracking**: Comprehensive payment history and status tracking
- **Security**: Proper authentication and authorization for all payment operations
- **Notifications**: Automatic notifications for payment events

## Database Schema

### Payment Model (`src/models/payment.js`)

```javascript
{
  paymentId: String,                    // Internal payment ID (PAY-XXXXXXX)
  stripePaymentIntentId: String,        // Stripe Payment Intent ID
  stripeChargeId: String,              // Stripe Charge ID (after capture)
  
  // Related Entities
  bookingId: ObjectId,                 // Reference to Booking
  customerId: ObjectId,                // Customer making payment
  propertyOwnerId: ObjectId,           // Admin/Property Owner receiving payment
  unitId: ObjectId,                    // Storage Unit
  propertyId: ObjectId,                // Storage Property
  
  // Payment Details
  amount: Number,                      // Amount in paise (Stripe standard)
  currency: String,                    // Currency code (default: 'inr')
  paymentMethod: String,               // 'monthly' or 'yearly'
  paymentPeriod: String,               // 'monthly' or 'yearly'
  
  // Fee Structure
  baseAmount: Number,                  // Original amount before fees
  platformFee: Number,                 // Platform commission
  stripeFee: Number,                   // Stripe processing fee
  netAmount: Number,                   // Amount after all fees
  
  // Status
  status: String,                      // 'pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'
  
  // Stripe Details
  paymentMethodType: String,           // 'card', 'upi', 'netbanking', etc.
  paymentMethodDetails: Object,        // Payment method specific details
  
  // Metadata
  description: String,                 // Payment description
  metadata: Object,                    // Additional metadata
  
  // Timestamps
  paymentDate: Date,                   // When payment was made
  expiresAt: Date,                     // Payment intent expiry
  refundedAt: Date,                    // When refund was processed
  
  // Error Handling
  failureReason: String,               // Failure reason
  failureCode: String,                 // Failure code
  
  // Soft Delete
  isDeleted: Boolean,                  // Soft delete flag
  
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### 1. Create Payment Intent
**POST** `/payments/create-intent`

Creates a new payment intent for a booking.

**Request Body:**
```json
{
  "bookingId": "booking_id_here",
  "paymentMethod": "monthly", // or "yearly"
  "amount": 5000, // Optional - will be calculated from storage unit pricing
  "currency": "inr", // Optional - defaults to "inr"
  "description": "Storage unit rental payment", // Optional
  "metadata": {} // Optional additional data
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "paymentId": "PAY-ABC12345",
    "stripePaymentIntentId": "pi_1234567890",
    "clientSecret": "pi_1234567890_secret_abc123",
    "amount": 5000,
    "currency": "inr",
    "status": "pending",
    "expiresAt": "2024-01-01T12:00:00.000Z",
    "paymentMethod": "monthly",
    "fees": {
      "platformFee": 250,
      "stripeFee": 175,
      "netAmount": 4575
    },
    "booking": {
      "id": "booking_id",
      "unitName": "Unit A1",
      "propertyName": "Storage Solutions",
      "startDate": "2024-01-01",
      "endDate": "2024-02-01"
    }
  }
}
```

### 2. Confirm Payment (Server-side)
**POST** `/payments/confirm`

Confirms a payment with a payment method (server-side confirmation).

**Request Body:**
```json
{
  "paymentIntentId": "pi_1234567890",
  "paymentMethodId": "pm_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "paymentId": "PAY-ABC12345",
    "status": "succeeded",
    "amount": 5000,
    "currency": "inr",
    "paymentMethod": "card",
    "paymentDate": "2024-01-01T12:00:00.000Z",
    "bookingStatus": "active",
    "requiresAction": false
  }
}
```

### 3. Confirm Payment (Client-side)
**POST** `/payments/confirm-client`

Confirms a payment after client-side processing with Stripe (recommended for web/mobile apps).

**Request Body:**
```json
{
  "paymentIntentId": "pi_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment completed successfully",
  "data": {
    "paymentId": "PAY-ABC12345",
    "status": "succeeded",
    "amount": 5000,
    "currency": "inr",
    "paymentDate": "2024-01-01T12:00:00.000Z",
    "bookingStatus": "active",
    "stripeStatus": "succeeded",
    "requiresAction": false
  }
}
```

### 4. Get Payment Details
**GET** `/payments/:paymentId`

Retrieves detailed information about a specific payment.

**Response:**
```json
{
  "success": true,
  "message": "Payment details retrieved successfully",
  "data": {
    "paymentId": "PAY-ABC12345",
    "stripePaymentIntentId": "pi_1234567890",
    "status": "succeeded",
    "amount": 5000,
    "currency": "inr",
    "paymentMethod": "monthly",
    "paymentPeriod": "monthly",
    "paymentMethodType": "card",
    "paymentDate": "2024-01-01T12:00:00.000Z",
    "fees": {
      "baseAmount": 5000,
      "platformFee": 250,
      "stripeFee": 175,
      "netAmount": 4575
    },
    "booking": {
      "id": "booking_id",
      "startDate": "2024-01-01",
      "endDate": "2024-02-01",
      "bookingStatus": "active",
      "paymentStatus": "completed"
    },
    "storageUnit": {
      "id": "unit_id",
      "name": "Unit A1",
      "unitType": "Self Storage",
      "size": "5x10"
    },
    "property": {
      "id": "property_id",
      "companyName": "Storage Solutions",
      "address": "123 Main St"
    },
    "customer": {
      "id": "customer_id",
      "username": "john_doe",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "paymentMethodDetails": {
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025
      }
    },
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 5. Get Payments by Booking
**GET** `/payments/booking/:bookingId`

Retrieves all payments for a specific booking.

**Response:**
```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": {
    "bookingId": "booking_id",
    "payments": [
      {
        "paymentId": "PAY-ABC12345",
        "status": "succeeded",
        "amount": 5000,
        "currency": "inr",
        "paymentMethod": "monthly",
        "paymentPeriod": "monthly",
        "paymentDate": "2024-01-01T12:00:00.000Z",
        "fees": {
          "baseAmount": 5000,
          "platformFee": 250,
          "stripeFee": 175,
          "netAmount": 4575
        },
        "storageUnit": {
          "name": "Unit A1",
          "unitType": "Self Storage",
          "size": "5x10"
        },
        "property": {
          "companyName": "Storage Solutions"
        },
        "createdAt": "2024-01-01T12:00:00.000Z",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "totalPayments": 1
  }
}
```

### 6. Get Payments by User
**GET** `/payments/user/payments?userId=user_id&status=succeeded&page=1&limit=10`

Retrieves payments for a user with filtering and pagination.

**Query Parameters:**
- `userId` (optional): Specific user ID (admin only)
- `status` (optional): Payment status filter
- `startDate` (optional): Start date for date range filter
- `endDate` (optional): End date for date range filter
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": {
    "payments": [
      {
        "paymentId": "PAY-ABC12345",
        "status": "succeeded",
        "amount": 5000,
        "currency": "inr",
        "paymentMethod": "monthly",
        "paymentPeriod": "monthly",
        "paymentDate": "2024-01-01T12:00:00.000Z",
        "fees": {
          "baseAmount": 5000,
          "platformFee": 250,
          "stripeFee": 175,
          "netAmount": 4575
        },
        "booking": {
          "id": "booking_id",
          "startDate": "2024-01-01",
          "endDate": "2024-02-01",
          "bookingStatus": "active"
        },
        "customer": {
          "id": "customer_id",
          "username": "john_doe",
          "email": "john@example.com"
        },
        "propertyOwner": {
          "id": "owner_id",
          "username": "owner_name",
          "email": "owner@example.com"
        },
        "storageUnit": {
          "id": "unit_id",
          "name": "Unit A1",
          "unitType": "Self Storage",
          "size": "5x10"
        },
        "property": {
          "id": "property_id",
          "companyName": "Storage Solutions"
        },
        "createdAt": "2024-01-01T12:00:00.000Z",
        "updatedAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 7. Cancel Payment
**POST** `/payments/cancel`

Cancels a pending payment.

**Request Body:**
```json
{
  "paymentIntentId": "pi_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment cancelled successfully",
  "data": {
    "paymentId": "PAY-ABC12345",
    "status": "cancelled"
  }
}
```

### 8. Stripe Webhook
**POST** `/payments/webhook`

Handles Stripe webhook events for real-time payment status updates.

**Headers:**
- `stripe-signature`: Stripe webhook signature for verification

**Events Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `charge.succeeded`
- `charge.failed`
- `charge.refunded`

### 9. Payment Statistics (Admin Only)
**GET** `/payments/stats/overview?startDate=2024-01-01&endDate=2024-12-31`

Retrieves payment statistics for admin dashboard.

**Query Parameters:**
- `startDate` (optional): Start date for statistics
- `endDate` (optional): End date for statistics

**Response:**
```json
{
  "success": true,
  "message": "Payment statistics retrieved successfully",
  "data": {
    "totalPayments": 100,
    "successfulPayments": 95,
    "failedPayments": 3,
    "pendingPayments": 2,
    "successRate": "95.00",
    "totalAmount": 500000,
    "totalPlatformFees": 25000,
    "totalStripeFees": 17500,
    "dateRange": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  }
}
```

## Configuration

### Environment Variables

Add these environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Platform Fee Configuration
PLATFORM_FEE_PERCENTAGE=5
```

### Stripe Setup

1. **Create Stripe Account**: Sign up at [stripe.com](https://stripe.com)
2. **Get API Keys**: 
   - Test keys for development
   - Live keys for production
3. **Configure Webhooks**:
   - Go to Stripe Dashboard > Webhooks
   - Add endpoint: `https://your-domain.com/payments/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, etc.
   - Copy webhook secret to environment variables

## Fee Structure

The system automatically calculates fees:

1. **Platform Fee**: Configurable percentage (default: 5%)
2. **Stripe Fee**: 2.9% + 30 paise for cards
3. **Net Amount**: Base amount minus all fees

Example:
- Base Amount: ₹5,000
- Platform Fee (5%): ₹250
- Stripe Fee (2.9% + 30p): ₹175
- Net Amount: ₹4,575

## Security Features

1. **Authentication**: All payment endpoints require valid JWT tokens
2. **Authorization**: Users can only access their own payments (except admins)
3. **Webhook Verification**: Stripe webhook signatures are verified
4. **Input Validation**: All inputs are validated using Joi schemas
5. **Error Handling**: Comprehensive error handling and logging

## Payment Flow

### Server-side Payment Flow
1. **Booking Creation**: Customer creates a booking
2. **Document Approval**: Admin approves customer documents
3. **Payment Intent**: Customer creates payment intent
4. **Payment Confirmation**: Customer confirms payment with payment method (server-side)
5. **Webhook Processing**: Stripe webhook updates payment status
6. **Booking Activation**: Booking is activated upon successful payment
7. **Notifications**: Both customer and property owner receive notifications

### Client-side Payment Flow (Recommended)
1. **Booking Creation**: Customer creates a booking
2. **Document Approval**: Admin approves customer documents
3. **Payment Intent**: Customer creates payment intent (gets client_secret)
4. **Client-side Payment**: Customer processes payment using Stripe.js/Stripe SDK
5. **Payment Confirmation**: Customer confirms payment status with backend
6. **Booking Activation**: Booking is activated upon successful payment
7. **Notifications**: Both customer and property owner receive notifications

### Client-side Implementation Example

```javascript
// 1. Create payment intent
const response = await fetch('/payments/create-intent', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    bookingId: 'booking_id',
    paymentMethod: 'monthly'
  })
});
const { data } = await response.json();
const { clientSecret } = data;

// 2. Process payment with Stripe
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: 'Customer Name' }
  }
});

// 3. Confirm payment with backend
if (paymentIntent.status === 'succeeded') {
  await fetch('/payments/confirm-client', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      paymentIntentId: paymentIntent.id
    })
  });
}
```

## Error Handling

The system handles various payment scenarios:

- **Payment Success**: Booking activated, notifications sent
- **Payment Failure**: Booking remains pending, failure notification sent
- **Payment Cancellation**: Payment cancelled, booking remains pending
- **Webhook Failures**: Logged for manual review
- **Network Issues**: Retry mechanisms and fallback handling

## Testing

### Test Cards (Stripe Test Mode)

Use these test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`

### Test UPI IDs

- **Success**: `success@upi`
- **Failure**: `failure@upi`

## Monitoring and Logging

1. **Payment Logs**: All payment events are logged
2. **Error Tracking**: Failed payments are tracked with reasons
3. **Webhook Monitoring**: Webhook delivery status is monitored
4. **Performance Metrics**: Payment processing times are tracked

## Support

For payment-related issues:

1. Check Stripe Dashboard for payment status
2. Review application logs for error details
3. Verify webhook configuration
4. Check environment variables
5. Contact Stripe support for payment-specific issues

## Future Enhancements

1. **Recurring Payments**: Support for automatic recurring payments
2. **Multiple Payment Methods**: Support for more payment methods
3. **Refund Management**: Automated refund processing
4. **Payment Analytics**: Advanced payment analytics and reporting
5. **Multi-currency**: Support for multiple currencies
6. **Payment Plans**: Flexible payment plan options 