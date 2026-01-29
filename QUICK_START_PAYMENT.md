# SeevCash Payment Integration - Quick Start

## 1. Add Environment Variables

Add to your `.env` file:

```bash
# Payment Provider Configuration
PAYMENT_PROVIDER=seevcash
SEEVCASH_API_KEY=sk_d5225c581c2bead308384965d05fe30f44f30cdaac713322fd9418251b004a04
SEEVCASH_BASE_URL=https://api-dev.seevcash.com/api/v1
```

## 2. Test the Integration

### Step 1: Create an Order
```bash
POST /api/v1/orders
{
  "serviceId": "laundry-service-id",
  "items": [...],
  "pickupAddress": {...},
  "deliveryAddress": {...}
}
```

### Step 2: Initialize Payment
```bash
POST /api/v1/payments/initialize
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "orderId": "order-id-from-step-1",
  "paymentMethod": "mobile_money",
  "phoneNumber": "+233542853417",
  "accountName": "Your Name",
  "mobileMoneyProvider": "MTN"
}
```

**Response:**
```json
{
  "paymentId": "65f1234567890abcdef",
  "transactionId": "DEP_38e955df-884d-4b24-9aa4-173b84c57c29",
  "status": "PENDING",
  "amount": 100,
  "feeAmount": 0.15,
  "userAmount": 100.15,
  "reference": "YRS_1738148709290_order-123"
}
```

### Step 3: Check Payment Status
```bash
GET /api/v1/payments/status/DEP_38e955df-884d-4b24-9aa4-173b84c57c29
Authorization: Bearer <your-token>
```

**Response:**
```json
{
  "transactionId": "DEP_38e955df-884d-4b24-9aa4-173b84c57c29",
  "status": "SUCCESS",
  "paymentId": "65f1234567890abcdef"
}
```

### Step 4: Check Wallet Balance (Optional)
```bash
GET /api/v1/payments/wallet/balance/GHS
Authorization: Bearer <your-token>
```

**Response:**
```json
{
  "balance": 153.62,
  "currency": "GHS"
}
```

## 3. Payment Status Flow

```
PENDING → User receives mobile money prompt on phone
       ↓
       → User enters PIN and confirms
       ↓
SUCCESS → Payment completed, order can proceed
```

## 4. Supported Mobile Money Providers

- **MTN** - MTN Mobile Money
- **VODAFONE** - Vodafone Cash
- **AIRTELTIGO** - AirtelTigo Money

## 5. Error Handling

### Common Errors:

**Invalid Phone Number:**
```json
{
  "statusCode": 400,
  "message": "Invalid Ghana phone number format"
}
```

**Order Not Found:**
```json
{
  "statusCode": 404,
  "message": "Order not found"
}
```

**Payment Failed:**
```json
{
  "statusCode": 400,
  "message": "Failed to initialize payment"
}
```

## 6. Testing with Postman

Import this collection:

```json
{
  "info": {
    "name": "Yersi Payment API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Initialize Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"orderId\": \"{{orderId}}\",\n  \"paymentMethod\": \"mobile_money\",\n  \"phoneNumber\": \"+233542853417\",\n  \"accountName\": \"Test User\",\n  \"mobileMoneyProvider\": \"MTN\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "{{baseUrl}}/payments/initialize",
          "host": ["{{baseUrl}}"],
          "path": ["payments", "initialize"]
        }
      }
    },
    {
      "name": "Check Payment Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/payments/status/{{transactionId}}",
          "host": ["{{baseUrl}}"],
          "path": ["payments", "status", "{{transactionId}}"]
        }
      }
    }
  ]
}
```

## 7. Switch to Different Provider

To switch to Paystack (when implemented):

1. Update `.env`:
```bash
PAYMENT_PROVIDER=paystack
PAYSTACK_SECRET_KEY=sk_...
```

2. Restart server - **That's it!** No code changes needed.

## 8. Production Checklist

- [ ] Replace test API key with production key
- [ ] Update `SEEVCASH_BASE_URL` to production URL
- [ ] Implement webhook handler for payment confirmations
- [ ] Set up payment status polling job
- [ ] Add payment retry logic
- [ ] Configure proper error monitoring
- [ ] Test with real phone numbers
- [ ] Verify fee calculations

## 9. Monitoring

Check logs for payment activities:
```bash
# Payment initialization
[PaymentsService] Payment initialized: 65f... - DEP_38e955df...

# Provider selection
[PaymentProviderFactory] Active payment provider: seevcash

# API calls
[SeevcashProvider] Deposit initiated: DEP_38e955df...
```

## 10. Support

- **Documentation:** See `PAYMENT_INTEGRATION.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`
- **SeevCash API Docs:** Contact SeevCash support
