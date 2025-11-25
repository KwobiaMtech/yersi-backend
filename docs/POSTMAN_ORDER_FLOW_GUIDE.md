# Yersi Order Flow - Postman Collection Guide

## Overview
This Postman collection provides complete API documentation for the Yersi laundry service order flow, from vendor search to checkout completion.

## Import Instructions

### Option 1: Import from File
1. Open Postman
2. Click **Import** button
3. Select `yersi-order-flow-complete.postman_collection.json`
4. Collection will appear in your workspace

### Option 2: Import from URL (if hosted)
```
https://your-api-docs-url/yersi-order-flow-complete.postman_collection.json
```

## Setup

### 1. Configure Environment Variables

Set these collection variables before testing:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `base_url` | API base URL | `http://localhost:3000` |
| `jwt_token` | JWT authentication token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `order_id` | Current order ID (auto-set) | `ORD-1732528929882` |
| `vendor_id` | Selected vendor ID | `507f1f77bcf86cd799439011` |
| `service_id` | Selected service ID | `507f1f77bcf86cd799439020` |
| `payment_method_id` | Payment method ID (auto-set) | `mm_1732528929882` |

### 2. Authentication

All endpoints require JWT Bearer token authentication:

1. **Login** (use your auth endpoint):
   ```bash
   POST /auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Copy JWT token** from response

3. **Set `jwt_token` variable** in collection variables

## Complete Order Flow

### Step 1: Search Vendors
**Endpoint:** `GET /vendors/search`

Find vendors near user location with distance calculations.

**Query Parameters:**
- `latitude` - User's latitude (e.g., 5.6037)
- `longitude` - User's longitude (e.g., -0.1870)
- `serviceId` - Filter by service type
- `radius` - Search radius in km (default: 10)
- `includeDistance` - Calculate distance (true/false)
- `sortBy` - Sort by: distance, rating, name

**Response:**
```json
{
  "vendors": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Quick Wash",
      "rating": 4.6,
      "deliveryFee": 8,
      "distance": 2.3,
      "distanceText": "2.3 km",
      "duration": 8,
      "durationText": "8 mins"
    }
  ],
  "total": 2
}
```

---

### Step 2: Calculate Pricing

#### 2a. Calculate Base Pricing (No Vendor)
**Endpoint:** `POST /orders/calculate`

Get pricing using base service rates.

**Request:**
```json
{
  "serviceId": "507f1f77bcf86cd799439020",
  "items": [
    {
      "itemId": "shirt001",
      "name": "Cotton Shirt",
      "category": "Shirts",
      "categoryId": "cat001",
      "quantity": 2,
      "weight": 0.5
    }
  ]
}
```

**Response:**
```json
{
  "totalWeight": 1.8,
  "totalItems": 3,
  "subtotal": 45,
  "deliveryFee": 5,
  "estimatedMinTotal": 40,
  "estimatedMaxTotal": 60,
  "currency": "GHS",
  "minimumOrderMet": false
}
```

#### 2b. Calculate Vendor Pricing
**Endpoint:** `POST /orders/calculate` (with vendorId)

Compare pricing with specific vendor.

**Request:** Same as above + `"vendorId": "507f1f77bcf86cd799439011"`

**Response includes:**
```json
{
  "subtotal": 36,
  "deliveryFee": 8,
  "vendorPricing": {
    "vendor": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Quick Wash",
      "deliveryFee": 8
    },
    "itemBreakdown": [...],
    "comparedToBase": 6
  }
}
```

---

### Step 3: Create Draft Order
**Endpoint:** `POST /orders`

Create order with items, addresses, and optional vendor.

**Request:**
```json
{
  "serviceId": "507f1f77bcf86cd799439020",
  "vendorId": "507f1f77bcf86cd799439011",
  "items": [...],
  "pickupAddress": {
    "street": "123 Main Street",
    "city": "Accra",
    "region": "Greater Accra",
    "phone": "+233555000001",
    "placeId": "ChIJXxxx",
    "latitude": 5.6037,
    "longitude": -0.1870
  },
  "deliveryAddress": {...},
  "preferredPickupTime": "2025-11-26T10:00:00Z"
}
```

**Response:**
```json
{
  "id": "ORD-1732528929882",
  "orderNumber": "YRS929882",
  "status": "draft",
  "total": 53,
  "createdAt": "2025-11-25T09:22:09.882Z"
}
```

**Note:** `order_id` is automatically saved to collection variables.

---

### Step 4: Update Order (Optional)
**Endpoint:** `PUT /orders/:id`

Modify draft order (vendor, items, addresses).

**Request:**
```json
{
  "vendorId": "507f1f77bcf86cd799439012"
}
```

**Restrictions:**
- Only draft orders can be updated
- Confirmed orders return 400 error

---

### Step 5: Preview Alternative Vendor (Optional)
**Endpoint:** `POST /orders/:id/preview-vendor-pricing`

Compare pricing without updating order.

**Request:**
```json
{
  "vendorId": "507f1f77bcf86cd799439012"
}
```

---

### Step 6: Get Confirmation Details
**Endpoint:** `GET /orders/:id/confirmation-details`

Review order before confirmation.

**Response:**
```json
{
  "order": {...},
  "vendor": {...},
  "service": {...},
  "pricingBreakdown": {...},
  "canConfirm": true,
  "isLocked": false
}
```

---

### Step 7: Confirm Order & Lock Pricing
**Endpoint:** `POST /orders/:id/confirm`

**Critical Step:** Locks vendor and pricing permanently.

**Request:**
```json
{
  "confirmPricing": true,
  "customerNotes": "Please handle with care"
}
```

**Response:**
```json
{
  "status": "confirmed",
  "confirmedAt": "2025-11-25T09:30:00.000Z",
  "lockedPricing": {
    "vendorId": "507f1f77bcf86cd799439011",
    "vendorName": "Quick Wash",
    "servicePrice": 20,
    "deliveryFee": 8,
    "total": 53
  },
  "message": "Order confirmed successfully!",
  "nextSteps": [...]
}
```

**After confirmation:**
- ✅ Pricing is locked
- ✅ Vendor is notified
- ❌ Cannot update order
- ❌ Cannot change vendor

---

### Step 8: Add Payment Method
**Endpoint:** `POST /payment-methods/mobile-money`

Add mobile money payment method.

**Request:**
```json
{
  "phoneNumber": "+233555000006",
  "accountName": "John Doe",
  "provider": "mtn",
  "setAsDefault": true,
  "nickname": "My MTN Account"
}
```

**Supported Providers:**
- `mtn` - MTN Mobile Money
- `telecel` - Telecel Cash
- `airteltigo` - AirtelTigo Money

**Response:**
```json
{
  "id": "mm_1732528929882",
  "type": "mobile_money",
  "displayName": "MTN Mobile Money",
  "maskedDetails": "+233**5***06",
  "isVerified": false
}
```

---

### Step 9: Verify Payment Method
**Endpoint:** `POST /payment-methods/:id/verify`

Verify with OTP code.

**Request:**
```json
{
  "otp": "123456"
}
```

**Response:**
```json
{
  "isVerified": true
}
```

---

### Step 10: Get Checkout Options
**Endpoint:** `GET /orders/:id/checkout`

Get delivery and payment options.

**Response:**
```json
{
  "order": {...},
  "deliveryOptions": [
    {
      "type": "self_service",
      "name": "Self Service",
      "fee": 0,
      "estimatedTime": "2-3 hours"
    },
    {
      "type": "delivery_service",
      "name": "Delivery Service",
      "fee": 8,
      "estimatedTime": "30-45 minutes"
    }
  ],
  "paymentMethods": [...]
}
```

---

### Step 11: Process Checkout
**Endpoint:** `POST /orders/checkout`

Complete order with delivery and payment selection.

#### Option A: Delivery Service + Mobile Money
```json
{
  "orderId": "ORD-1732528929882",
  "checkoutOptions": {
    "deliveryType": "delivery_service",
    "paymentMethod": "mtn_mobile_money",
    "paymentDetails": "+233555000006"
  },
  "customerNotes": "Please call before pickup"
}
```

**Response:**
```json
{
  "orderNumber": "YRS929882",
  "status": "pending_payment",
  "totalAmount": 53,
  "paymentUrl": "https://payment-gateway.com/pay/...",
  "paymentReference": "PAY_1732528929882",
  "nextSteps": [
    "Complete payment using the provided link",
    "Track your order in the app"
  ]
}
```

#### Option B: Self Service + Cash on Delivery
```json
{
  "orderId": "ORD-1732528929882",
  "checkoutOptions": {
    "deliveryType": "self_service",
    "paymentMethod": "cash_on_delivery"
  }
}
```

**Response:**
```json
{
  "status": "confirmed",
  "totalAmount": 36,
  "nextSteps": [
    "Visit the vendor location for drop-off and pickup"
  ]
}
```

**Pricing Differences:**
- **Delivery Service:** Full total with delivery fee (GH₵53)
- **Self Service:** Subtotal only, no delivery fee (GH₵36)

---

## Payment Methods

### Supported Payment Types

| Type | Enum Value | Description |
|------|------------|-------------|
| MTN Mobile Money | `mtn_mobile_money` | MTN MoMo payments |
| Telecel Cash | `vodafone_cash` | Telecel mobile money |
| AirtelTigo Money | `airteltigo_money` | AirtelTigo payments |
| Visa Card | `visa_card` | Visa card payments |
| Mastercard | `mastercard` | Mastercard payments |
| Cash on Delivery | `cash_on_delivery` | Pay on delivery |

---

## Delivery Types

| Type | Enum Value | Fee | Description |
|------|------------|-----|-------------|
| Self Service | `self_service` | GH₵0 | Customer drops off and picks up |
| Delivery Service | `delivery_service` | Vendor-specific | Full pickup and delivery |

---

## Order Status Lifecycle

```
draft → confirmed → pending_payment → pending → picked_up → 
in_wash → ready_for_pickup → delivering → completed
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Cannot update confirmed order. Contact support for changes.",
  "error": "Bad Request"
}
```

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Order with ID xxx not found",
  "error": "Not Found"
}
```

---

## Testing Tips

### 1. Sequential Testing
Run requests in order:
1. Search Vendors
2. Calculate Pricing
3. Create Order (saves `order_id`)
4. Confirm Order
5. Add Payment Method (saves `payment_method_id`)
6. Verify Payment
7. Checkout

### 2. Auto-Save Variables
These requests automatically save IDs:
- **Create Order** → saves `order_id`
- **Add Payment Method** → saves `payment_method_id`

### 3. Test Different Scenarios

**Scenario 1: Budget-Conscious Customer**
- Calculate base pricing
- Compare multiple vendors
- Select cheapest vendor
- Use self-service delivery

**Scenario 2: Premium Customer**
- Select premium vendor
- Use delivery service
- Pay with card

**Scenario 3: Price Comparison**
- Create order with Vendor A
- Preview pricing with Vendor B
- Update to Vendor B if better
- Confirm order

### 4. Validation Testing

**Test Order Update Protection:**
1. Create and confirm order
2. Try to update → Should fail with 400

**Test Vendor Validation:**
1. Calculate with invalid vendor ID → Should fail with 404
2. Create order with vendor not offering service → Should fail with 400

**Test Payment Verification:**
1. Add payment method
2. Try checkout without verification → Should work but mark as unverified
3. Verify with wrong OTP → Should fail with 400

---

## Quick Reference

### Base URLs
- **Development:** `http://localhost:3000`
- **Staging:** `https://staging-api.yersi.com`
- **Production:** `https://api.yersi.com`

### Test Credentials
```
Email: test@yersi.com
Password: Test123!
```

### Sample IDs
```
Service ID: 507f1f77bcf86cd799439020
Vendor ID 1: 507f1f77bcf86cd799439011 (Quick Wash)
Vendor ID 2: 507f1f77bcf86cd799439012 (Premium Clean)
```

### Test Phone Numbers (Ghana)
```
+233555000001
+233555000002
+233555000006
```

---

## Support

For issues or questions:
- **Email:** support@yersi.com
- **Docs:** https://docs.yersi.com
- **API Status:** https://status.yersi.com

---

## Changelog

### Version 1.0.0 (2025-11-25)
- Initial release
- Complete order flow documentation
- All 6 workflow sections
- Sample requests and responses
- Error handling examples
