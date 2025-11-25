# Yersi Order Flow - Complete API Documentation

## 📦 What's Included

This documentation package provides everything you need to understand and test the Yersi order flow API:

### 1. **Postman Collection** (16KB)
`yersi-order-flow-complete.postman_collection.json`
- ✅ 17 API endpoints across 6 workflow sections
- ✅ Pre-configured authentication (JWT Bearer)
- ✅ Auto-save variables (order_id, payment_method_id)
- ✅ Ready to import and test

### 2. **Comprehensive Guide** (12KB)
`POSTMAN_ORDER_FLOW_GUIDE.md`
- ✅ Step-by-step order flow (11 steps)
- ✅ Sample requests and responses
- ✅ Error handling examples
- ✅ Testing scenarios and tips
- ✅ Quick reference tables

### 3. **Documentation Summary** (12KB)
`ORDER_FLOW_DOCUMENTATION_SUMMARY.md`
- ✅ Overview of all endpoints
- ✅ Key features explained
- ✅ Testing scenarios
- ✅ Quick start guide

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Import to Postman
```bash
1. Open Postman
2. Click "Import" button
3. Select: yersi-order-flow-complete.postman_collection.json
4. Collection appears in your workspace
```

### Step 2: Configure Variables
```bash
1. Click on collection → Variables tab
2. Set base_url: http://localhost:3000
3. Login to get JWT token
4. Set jwt_token: <your-token>
```

### Step 3: Test the Flow
```bash
Run these requests in order:
1. Search Vendors
2. Calculate Vendor Pricing
3. Create Draft Order (auto-saves order_id)
4. Confirm Order
5. Add Mobile Money (auto-saves payment_method_id)
6. Verify Payment Method
7. Process Checkout
```

### Step 4: Verify Success
```bash
✅ Order status: "confirmed" or "pending_payment"
✅ Locked pricing in response
✅ Payment URL generated (if applicable)
```

---

## 📋 Order Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YERSI ORDER FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. 🔍 SEARCH VENDORS
   └─> Find vendors by location with distance calculations

2. 💰 CALCULATE PRICING
   ├─> Base pricing (no vendor)
   └─> Vendor-specific pricing (compare multiple vendors)

3. 📝 CREATE DRAFT ORDER
   └─> Add items, addresses, preferred times

4. 🔄 UPDATE ORDER (Optional)
   └─> Change vendor, items, or addresses (draft only)

5. 👁️ PREVIEW PRICING (Optional)
   └─> Compare vendors without committing

6. ✅ CONFIRM ORDER
   └─> LOCKS PRICING & VENDOR (cannot change after this)

7. 💳 ADD PAYMENT METHOD
   └─> Mobile money, cards, or cash on delivery

8. 🔐 VERIFY PAYMENT
   └─> OTP verification for mobile money

9. 🛒 GET CHECKOUT OPTIONS
   └─> View delivery types and payment methods

10. 💸 PROCESS CHECKOUT
    └─> Complete payment and finalize order

11. 📦 ORDER CONFIRMED
    └─> Track order status and delivery
```

---

## 📊 API Endpoints Summary

### Vendor Search (1 endpoint)
- `GET /vendors/search` - Search by location

### Pricing (2 endpoints)
- `POST /orders/calculate` - Base pricing
- `POST /orders/calculate` - Vendor pricing (with vendorId)

### Order Management (5 endpoints)
- `POST /orders` - Create order
- `GET /orders` - List orders
- `GET /orders/:id` - Get order
- `PUT /orders/:id` - Update order
- `POST /orders/:id/preview-vendor-pricing` - Preview

### Confirmation (2 endpoints)
- `GET /orders/:id/confirmation-details` - Get details
- `POST /orders/:id/confirm` - Confirm & lock

### Payment Methods (4 endpoints)
- `GET /payment-methods` - List methods
- `POST /payment-methods/mobile-money` - Add method
- `POST /payment-methods/:id/verify` - Verify OTP
- `DELETE /payment-methods/:id` - Delete method

### Checkout (3 endpoints)
- `GET /orders/:id/checkout` - Get options
- `POST /orders/checkout` - Delivery service
- `POST /orders/checkout` - Self service

**Total: 17 endpoints**

---

## 🎯 Key Features

### Weight-Based Pricing
- Items priced by weight (kg)
- Vendor-specific rates
- Automatic calculations
- Estimated min/max totals (±20%)

### Vendor Comparison
- Compare multiple vendors
- Item-level breakdown
- Savings calculation
- Preview without committing

### Price Locking
- Pricing locked at confirmation
- Prevents price changes
- Stored in order permanently
- Cannot modify after confirmation

### Flexible Delivery
- **Self Service:** No delivery fee
- **Delivery Service:** Vendor-specific fee
- Adjusts total automatically

### Multiple Payment Options
- MTN Mobile Money
- Telecel Cash
- AirtelTigo Money
- Visa/Mastercard
- Cash on Delivery

---

## 💡 Example: Complete Order Flow

### Request 1: Search Vendors
```bash
GET /vendors/search?latitude=5.6037&longitude=-0.1870&radius=10
```

**Response:**
```json
{
  "vendors": [
    {
      "name": "Quick Wash",
      "deliveryFee": 8,
      "distance": 2.3,
      "distanceText": "2.3 km"
    }
  ]
}
```

### Request 2: Calculate Pricing
```bash
POST /orders/calculate
{
  "serviceId": "507f1f77bcf86cd799439020",
  "vendorId": "507f1f77bcf86cd799439011",
  "items": [
    {"itemId": "shirt001", "quantity": 2, "weight": 0.5}
  ]
}
```

**Response:**
```json
{
  "subtotal": 36,
  "deliveryFee": 8,
  "estimatedMaxTotal": 53,
  "vendorPricing": {
    "comparedToBase": 6
  }
}
```

### Request 3: Create Order
```bash
POST /orders
{
  "serviceId": "507f1f77bcf86cd799439020",
  "vendorId": "507f1f77bcf86cd799439011",
  "items": [...],
  "pickupAddress": {...},
  "deliveryAddress": {...}
}
```

**Response:**
```json
{
  "id": "ORD-1732528929882",
  "orderNumber": "YRS929882",
  "status": "draft",
  "total": 53
}
```

### Request 4: Confirm Order
```bash
POST /orders/ORD-1732528929882/confirm
{
  "confirmPricing": true
}
```

**Response:**
```json
{
  "status": "confirmed",
  "lockedPricing": {
    "vendorName": "Quick Wash",
    "total": 53
  }
}
```

### Request 5: Checkout
```bash
POST /orders/checkout
{
  "orderId": "ORD-1732528929882",
  "checkoutOptions": {
    "deliveryType": "delivery_service",
    "paymentMethod": "mtn_mobile_money"
  }
}
```

**Response:**
```json
{
  "status": "pending_payment",
  "paymentUrl": "https://payment-gateway.com/pay/...",
  "totalAmount": 53
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Budget Customer
```
1. Search vendors → Select cheapest
2. Create order → Confirm
3. Self-service delivery (no fee)
4. Cash on delivery
Result: Minimum cost
```

### Scenario 2: Premium Customer
```
1. Search vendors → Select highest rated
2. Create order → Confirm
3. Delivery service (with fee)
4. Card payment
Result: Premium experience
```

### Scenario 3: Price Comparison
```
1. Create order with Vendor A
2. Preview Vendor B pricing
3. Preview Vendor C pricing
4. Update to best vendor
5. Confirm order
Result: Best price found
```

---

## 🔧 Environment Setup

### Collection Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000` |
| `jwt_token` | Auth token | `eyJhbGc...` |
| `order_id` | Current order | `ORD-1732528929882` |
| `vendor_id` | Selected vendor | `507f1f77bcf86cd799439011` |
| `service_id` | Selected service | `507f1f77bcf86cd799439020` |
| `payment_method_id` | Payment method | `mm_1732528929882` |

### Authentication
All endpoints require JWT Bearer token:
```
Authorization: Bearer {{jwt_token}}
```

---

## ⚠️ Important Notes

### Price Locking
- ⚠️ **Pricing locks at confirmation**
- ⚠️ **Cannot change vendor after confirmation**
- ⚠️ **Cannot update order after confirmation**
- ✅ **Protects customer from price changes**

### Order Status Flow
```
draft → confirmed → pending_payment → pending → 
picked_up → in_wash → ready_for_pickup → 
delivering → completed
```

### Delivery Fee Logic
- **Self Service:** Subtotal only (no delivery fee)
- **Delivery Service:** Subtotal + vendor delivery fee

---

## 📚 Documentation Files

```
docs/
├── ORDER_FLOW_README.md (this file)
│   └── Main documentation entry point
│
├── yersi-order-flow-complete.postman_collection.json
│   └── Postman collection (import this)
│
├── POSTMAN_ORDER_FLOW_GUIDE.md
│   └── Detailed step-by-step guide
│
└── ORDER_FLOW_DOCUMENTATION_SUMMARY.md
    └── Quick reference summary
```

---

## 🎓 Learning Path

### For Beginners
1. Read this README
2. Import Postman collection
3. Follow Quick Start guide
4. Test each endpoint sequentially

### For Developers
1. Import collection
2. Read POSTMAN_ORDER_FLOW_GUIDE.md
3. Study request/response examples
4. Integrate into frontend

### For QA/Testing
1. Import collection
2. Review testing scenarios
3. Test error handling
4. Validate edge cases

---

## 🐛 Common Issues

### Issue: 401 Unauthorized
**Solution:** Set `jwt_token` variable after login

### Issue: Order not found
**Solution:** Ensure `order_id` is set (auto-saved after creation)

### Issue: Cannot update order
**Solution:** Order is confirmed (locked). Create new order.

### Issue: Invalid phone number
**Solution:** Use Ghana format: `+233555000001` or `0555000001`

---

## 📞 Support

- **Documentation:** Read POSTMAN_ORDER_FLOW_GUIDE.md
- **Issues:** Check error responses in guide
- **Questions:** Review testing scenarios

---

## ✅ Validation Checklist

Before using the collection:
- [ ] Postman installed
- [ ] Collection imported
- [ ] `base_url` variable set
- [ ] JWT token obtained
- [ ] `jwt_token` variable set
- [ ] Test environment ready

Ready to test:
- [ ] Run "Search Vendors" → Success
- [ ] Run "Calculate Pricing" → Success
- [ ] Run "Create Order" → `order_id` saved
- [ ] Run "Confirm Order" → Status: confirmed
- [ ] Run "Add Payment" → `payment_method_id` saved
- [ ] Run "Checkout" → Payment URL received

---

## 📈 Version Information

- **Collection Version:** 1.0.0
- **Created:** 2025-11-25
- **Format:** Postman Collection v2.1.0
- **Total Endpoints:** 17
- **Total Sections:** 6
- **Documentation Pages:** 3

---

## 🎉 You're Ready!

Import the collection and start testing the complete order flow. All sample data is included, and variables are auto-saved as you progress through the flow.

**Happy Testing! 🚀**
