# Postman Collection - Payment API

## Files

- `Yersi-Payment-API.postman_collection.json` - API collection
- `Yersi-Payment-Local.postman_environment.json` - Local environment

## Import to Postman

1. Open Postman
2. Click **Import** button
3. Select both JSON files
4. Collection and environment will be imported

## Setup

### 1. Set Environment Variables

Select "Yersi Payment - Local" environment and set:

- `authToken` - Your JWT token from login
- `orderId` - Order ID to process payment for

### 2. Get Auth Token

First, authenticate using the auth endpoints:

```
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

Copy the `accessToken` from response and set it in environment variable `authToken`.

## API Endpoints

### 1. Initialize Payment

**POST** `/payments/initialize`

Initialize a mobile money payment for an order.

**Request Body:**
```json
{
  "orderId": "order-123",
  "paymentMethod": "mobile_money",
  "phoneNumber": "+233542853417",
  "accountName": "Patrick Oduro",
  "mobileMoneyProvider": "MTN"
}
```

**Mobile Money Providers:**
- `MTN` - MTN Mobile Money
- `VODAFONE` - Vodafone Cash
- `AIRTELTIGO` - AirtelTigo Money

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

**Note:** Transaction ID is automatically saved to environment variable.

---

### 2. Check Payment Status

**GET** `/payments/status/:transactionId`

Check the current status of a payment transaction.

**Path Parameters:**
- `transactionId` - Transaction ID from initialization

**Response:**
```json
{
  "transactionId": "DEP_38e955df-884d-4b24-9aa4-173b84c57c29",
  "status": "SUCCESS",
  "paymentId": "65f1234567890abcdef"
}
```

**Status Values:**
- `PENDING` - Payment initiated, waiting for user confirmation
- `SUCCESS` - Payment completed successfully
- `FAILED` - Payment failed
- `CANCELLED` - Payment cancelled

---

### 3. Get Wallet Balance

**GET** `/payments/wallet/balance/:currency`

Get the current wallet balance.

**Path Parameters:**
- `currency` - Currency code (GHS, USD, EUR)

**Response:**
```json
{
  "balance": 153.62,
  "currency": "GHS"
}
```

---

## Payment Flow

### Complete Payment Process

1. **Create Order** (use Orders API)
   ```
   POST /orders
   ```

2. **Initialize Payment**
   ```
   POST /payments/initialize
   ```
   - User receives mobile money prompt on phone
   - Save `transactionId` from response

3. **Poll Payment Status** (every 5-10 seconds)
   ```
   GET /payments/status/:transactionId
   ```
   - Check until status is `SUCCESS` or `FAILED`

4. **Order Confirmed**
   - When payment status is `SUCCESS`, order is confirmed

---

## Testing

### Test with Mock Data

All requests use mock data - no real payments are processed in test environment.

**Test Phone Numbers:**
- `+233542853417` - Test MTN number
- `+233501234567` - Test Vodafone number
- `+233261234567` - Test AirtelTigo number

**Test Scenarios:**

1. **Successful Payment:**
   - Initialize payment
   - Status will be `PENDING`
   - After ~30 seconds, status becomes `SUCCESS`

2. **Failed Payment:**
   - Use invalid phone number
   - Status will be `FAILED`

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid Ghana phone number format",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Order not found",
  "error": "Not Found"
}
```

---

## Auto-Save Variables

The collection automatically saves:
- `transactionId` - From initialize payment response
- `paymentId` - From initialize payment response

These are used in subsequent requests.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:3000/api/v1` |
| `authToken` | JWT authentication token | `eyJhbGciOiJIUzI1NiIs...` |
| `orderId` | Order ID for payment | `order-123` |
| `transactionId` | Payment transaction ID | `DEP_38e955df...` |
| `paymentId` | Payment record ID | `65f1234567890abcdef` |

---

## Tips

1. **Authentication Required:** All endpoints require Bearer token authentication
2. **Phone Format:** Use Ghana format (+233XXXXXXXXX or 0XXXXXXXXX)
3. **Status Polling:** Poll status endpoint every 5-10 seconds until completion
4. **Transaction ID:** Automatically saved after initialization
5. **Fees:** Customer pays transaction fees (shown in `feeAmount`)

---

## Support

For issues or questions:
- Check API logs for detailed error messages
- Verify authentication token is valid
- Ensure order exists before initializing payment
- Confirm phone number format is correct
