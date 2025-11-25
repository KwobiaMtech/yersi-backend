# Order Flow Documentation - Summary

## Created Files

### 1. Postman Collection
**File:** `yersi-order-flow-complete.postman_collection.json` (14KB)

Complete Postman collection with:
- ✅ 6 workflow sections (Vendor Search → Checkout)
- ✅ 20+ API endpoints
- ✅ Auto-save variables for order_id and payment_method_id
- ✅ Collection-level JWT authentication
- ✅ Pre-configured environment variables

**Import to Postman:**
```bash
File → Import → yersi-order-flow-complete.postman_collection.json
```

### 2. Comprehensive Guide
**File:** `POSTMAN_ORDER_FLOW_GUIDE.md` (11KB)

Detailed documentation including:
- ✅ Step-by-step order flow (11 steps)
- ✅ Sample requests and responses for all endpoints
- ✅ Error handling examples
- ✅ Testing scenarios and tips
- ✅ Payment methods and delivery types reference
- ✅ Quick reference section

---

## Order Flow Overview

### Complete Flow (11 Steps)

```
1. Search Vendors (by location)
   ↓
2. Calculate Pricing (base vs vendor)
   ↓
3. Create Draft Order
   ↓
4. Update Order (optional - change vendor/items)
   ↓
5. Preview Alternative Vendor (optional)
   ↓
6. Get Confirmation Details
   ↓
7. Confirm Order (LOCKS PRICING)
   ↓
8. Add Payment Method
   ↓
9. Verify Payment Method (OTP)
   ↓
10. Get Checkout Options
   ↓
11. Process Checkout (complete payment)
```

---

## API Endpoints Documented

### Vendor Search (1 endpoint)
- `GET /vendors/search` - Search by location with distance

### Pricing Calculation (1 endpoint)
- `POST /orders/calculate` - Base or vendor-specific pricing

### Order Management (5 endpoints)
- `POST /orders` - Create draft order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get order by ID
- `PUT /orders/:id` - Update draft order
- `POST /orders/:id/preview-vendor-pricing` - Preview pricing

### Order Confirmation (2 endpoints)
- `GET /orders/:id/confirmation-details` - Get confirmation details
- `POST /orders/:id/confirm` - Confirm and lock pricing

### Payment Methods (4 endpoints)
- `GET /payment-methods` - Get saved methods
- `POST /payment-methods/mobile-money` - Add mobile money
- `POST /payment-methods/:id/verify` - Verify with OTP
- `DELETE /payment-methods/:id` - Delete method

### Checkout (2 endpoints)
- `GET /orders/:id/checkout` - Get checkout options
- `POST /orders/checkout` - Process checkout

**Total: 15 endpoints**

---

## Key Features Documented

### 1. Weight-Based Pricing
- Items priced by weight (kg)
- Vendor-specific pricing per kg
- Automatic total calculation
- Estimated min/max totals (±20%)

### 2. Vendor Comparison
- Compare base vs vendor pricing
- Item-level breakdown
- Savings calculation
- Preview without committing

### 3. Price Locking
- Pricing locked at confirmation
- Prevents price changes
- Stored in `lockedPricing` object
- Cannot modify after confirmation

### 4. Flexible Delivery
- **Self Service**: No delivery fee
- **Delivery Service**: Vendor-specific fee
- Adjusts final total automatically

### 5. Multiple Payment Methods
- Mobile Money (MTN, Telecel, AirtelTigo)
- Card payments (Visa, Mastercard)
- Cash on Delivery
- OTP verification for mobile money

### 6. Location Integration
- Google Places API support
- Distance and duration calculations
- Geocoding for addresses
- Coordinate-based search

---

## Sample Request/Response Examples

### Calculate Vendor Pricing
**Request:**
```json
POST /orders/calculate
{
  "serviceId": "507f1f77bcf86cd799439020",
  "vendorId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "itemId": "shirt001",
      "name": "Cotton Shirt",
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
  "subtotal": 36,
  "deliveryFee": 8,
  "estimatedMaxTotal": 53,
  "vendorPricing": {
    "vendor": {
      "name": "Quick Wash",
      "deliveryFee": 8
    },
    "comparedToBase": 6
  }
}
```

### Confirm Order
**Request:**
```json
POST /orders/:id/confirm
{
  "confirmPricing": true,
  "customerNotes": "Handle with care"
}
```

**Response:**
```json
{
  "status": "confirmed",
  "lockedPricing": {
    "vendorName": "Quick Wash",
    "servicePrice": 20,
    "deliveryFee": 8,
    "total": 53
  },
  "message": "Order confirmed successfully!"
}
```

### Process Checkout
**Request:**
```json
POST /orders/checkout
{
  "orderId": "ORD-1732528929882",
  "checkoutOptions": {
    "deliveryType": "delivery_service",
    "paymentMethod": "mtn_mobile_money",
    "paymentDetails": "+233555000006"
  }
}
```

**Response:**
```json
{
  "orderNumber": "YRS929882",
  "status": "pending_payment",
  "totalAmount": 53,
  "paymentUrl": "https://payment-gateway.com/pay/...",
  "nextSteps": [
    "Complete payment using the provided link",
    "Track your order in the app"
  ]
}
```

---

## Testing Scenarios

### Scenario 1: Budget-Conscious Customer
1. Search vendors near location
2. Calculate base pricing
3. Compare 2-3 vendors
4. Select cheapest vendor
5. Create order
6. Confirm order
7. Choose self-service delivery (no fee)
8. Pay cash on delivery

**Result:** Minimum cost (subtotal only)

### Scenario 2: Premium Customer
1. Search vendors by rating
2. Select highest-rated vendor
3. Create order immediately
4. Confirm order
5. Add card payment method
6. Choose delivery service
7. Complete card payment

**Result:** Premium service with convenience

### Scenario 3: Price Comparison
1. Create order with Vendor A
2. Preview pricing with Vendor B
3. Preview pricing with Vendor C
4. Update order to best vendor
5. Confirm order
6. Complete checkout

**Result:** Best price after comparison

---

## Environment Setup

### Collection Variables
```
base_url: http://localhost:3000
jwt_token: (set after login)
order_id: (auto-set after order creation)
vendor_id: 507f1f77bcf86cd799439011
service_id: 507f1f77bcf86cd799439020
payment_method_id: (auto-set after adding payment)
```

### Authentication
All endpoints require JWT Bearer token:
```
Authorization: Bearer {{jwt_token}}
```

---

## Error Handling

### Common Errors Documented

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Cannot update confirmed order | Trying to modify locked order |
| 400 | Please select a vendor | Confirming without vendor |
| 400 | Invalid Ghana phone number | Wrong phone format |
| 400 | Invalid OTP code | Wrong verification code |
| 404 | Vendor not found | Invalid vendor ID |
| 404 | Order not found | Invalid order ID |
| 401 | Unauthorized | Missing/invalid JWT token |

---

## Quick Start

### 1. Import Collection
```bash
Postman → Import → yersi-order-flow-complete.postman_collection.json
```

### 2. Set Variables
- Set `base_url` to your API URL
- Login and set `jwt_token`

### 3. Run Sequential Test
Execute requests in order:
1. Search Vendors
2. Calculate Vendor Pricing
3. Create Draft Order (saves order_id)
4. Confirm Order
5. Add Mobile Money (saves payment_method_id)
6. Verify Payment Method
7. Process Checkout

### 4. Verify Results
- Check order status: `confirmed` or `pending_payment`
- Verify locked pricing in response
- Confirm payment URL generated (if applicable)

---

## Documentation Structure

```
docs/
├── yersi-order-flow-complete.postman_collection.json
│   └── Complete Postman collection (14KB)
│
├── POSTMAN_ORDER_FLOW_GUIDE.md
│   └── Comprehensive guide (11KB)
│
└── ORDER_FLOW_DOCUMENTATION_SUMMARY.md
    └── This summary file
```

---

## Next Steps

### For Developers
1. Import Postman collection
2. Read POSTMAN_ORDER_FLOW_GUIDE.md
3. Test each endpoint sequentially
4. Integrate into frontend application

### For QA/Testing
1. Use collection for API testing
2. Follow testing scenarios in guide
3. Validate error handling
4. Test edge cases

### For Frontend Integration
1. Reference request/response examples
2. Implement order flow UI
3. Handle payment redirects
4. Display order status updates

---

## Support Resources

- **Postman Collection:** `yersi-order-flow-complete.postman_collection.json`
- **Detailed Guide:** `POSTMAN_ORDER_FLOW_GUIDE.md`
- **API Endpoints:** 15 endpoints across 6 sections
- **Sample Data:** Included in all requests
- **Error Examples:** Documented for all endpoints

---

## Version Information

- **Collection Version:** 1.0.0
- **Created:** 2025-11-25
- **Format:** Postman Collection v2.1.0
- **Total Endpoints:** 15
- **Total Sections:** 6

---

## Changelog

### v1.0.0 (2025-11-25)
- ✅ Initial release
- ✅ Complete order flow (11 steps)
- ✅ All 15 endpoints documented
- ✅ Sample requests and responses
- ✅ Error handling examples
- ✅ Testing scenarios
- ✅ Auto-save variables
- ✅ JWT authentication setup
