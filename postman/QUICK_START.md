# Quick Start - Postman Collection

## 📥 Import Collection

### Step 1: Import Files
1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop these files:
   - `Yersi-Payment-API.postman_collection.json`
   - `Yersi-Payment-Local.postman_environment.json`
4. Click **Import**

### Step 2: Select Environment
1. Click environment dropdown (top right)
2. Select **"Yersi Payment - Local"**

### Step 3: Set Auth Token
1. Click environment quick look (eye icon)
2. Edit `authToken` variable
3. Paste your JWT token
4. Save

## 🚀 Quick Test

### 1. Initialize Payment
```
POST {{baseUrl}}/payments/initialize

Body:
{
  "orderId": "order-123",
  "paymentMethod": "mobile_money",
  "phoneNumber": "+233542853417",
  "accountName": "Test User",
  "mobileMoneyProvider": "MTN"
}
```

**Expected Response:**
```json
{
  "transactionId": "DEP_...",
  "status": "PENDING",
  "amount": 100
}
```

### 2. Check Status
```
GET {{baseUrl}}/payments/status/{{transactionId}}
```

**Expected Response:**
```json
{
  "transactionId": "DEP_...",
  "status": "SUCCESS"
}
```

### 3. Get Balance
```
GET {{baseUrl}}/payments/wallet/balance/GHS
```

**Expected Response:**
```json
{
  "balance": 153.62,
  "currency": "GHS"
}
```

## 📋 Variables Auto-Saved

The collection automatically saves:
- ✅ `transactionId` - After payment initialization
- ✅ `paymentId` - After payment initialization

## 🔑 Required Variables

Set these in environment:
- `authToken` - Your JWT token (required)
- `orderId` - Order ID to pay for (required)

## 📱 Test Phone Numbers

- MTN: `+233542853417`
- Vodafone: `+233501234567`
- AirtelTigo: `+233261234567`

## ✅ Success Checklist

- [ ] Collection imported
- [ ] Environment selected
- [ ] Auth token set
- [ ] Order ID set
- [ ] Test payment initialized
- [ ] Status checked
- [ ] Balance retrieved

## 🆘 Troubleshooting

**401 Unauthorized:**
- Check auth token is set
- Token may be expired - login again

**404 Not Found:**
- Verify order ID exists
- Check base URL is correct

**400 Bad Request:**
- Verify phone number format
- Check all required fields

## 📖 Full Documentation

See `README.md` for complete API documentation.
