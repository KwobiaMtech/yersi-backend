# Laundry Service API - Postman Documentation

## 📋 Overview
Complete Postman collection with sample requests and responses for the Laundry Service API.

## 📁 Files Created
- `Laundry-Service-API.postman_collection.json` - Main collection
- `Laundry-Service.postman_environment.json` - Environment variables

## 🚀 Quick Setup

### 1. Import Collection
1. Open Postman
2. Click "Import" 
3. Select `Laundry-Service-API.postman_collection.json`

### 2. Import Environment
1. Click "Import"
2. Select `Laundry-Service.postman_environment.json`
3. Select the environment from dropdown

### 3. Start API Server
```bash
npm run start:dev
```

## 📚 API Endpoints Included

### 🏥 Health
- `GET /health` - API health check

### 🔐 Authentication  
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### 🧺 Services
- `GET /services` - Get all laundry services

### 🏪 Vendors
- `GET /vendors/search` - Search vendors by location
- `GET /vendors/:id` - Get vendor details

### 📦 Items
- `GET /items` - Get items by service

### 📋 Orders (Protected)
- `POST /orders/calculate` - Calculate order total
- `POST /orders` - Create new order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get order details

### 💳 Payments (Protected)
- `POST /payments/initialize` - Initialize payment

### 👤 Users (Protected)
- `GET /users/credits` - Get user credits

## 🔑 Authentication Flow

1. **Register/Login**: Use auth endpoints to get JWT token
2. **Auto-Token**: Collection automatically saves JWT token
3. **Protected Routes**: Token automatically added to requests

## 📝 Sample Data Included

### User Registration
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe", 
  "phone": "+233123456789"
}
```

### Order Creation
```json
{
  "serviceId": "507f1f77bcf86cd799439011",
  "vendorId": "507f1f77bcf86cd799439021",
  "items": [
    {
      "itemId": "507f1f77bcf86cd799439031",
      "quantity": 3,
      "specialInstructions": "Handle with care"
    }
  ],
  "pickupAddress": {
    "street": "456 Elm Street",
    "city": "Accra",
    "region": "Greater Accra",
    "phone": "+233123456789"
  },
  "deliveryAddress": {
    "street": "789 Oak Avenue", 
    "city": "Accra",
    "region": "Greater Accra",
    "phone": "+233987654321"
  }
}
```

## 🧪 Testing Features

- **Pre-request Scripts**: Auto-token management
- **Test Scripts**: Response validation
- **Environment Variables**: Dynamic data handling
- **Sample Responses**: Expected response formats

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000/api/v1` |
| `jwt_token` | Authentication token | Auto-populated |
| `user_id` | Current user ID | Auto-populated |
| `order_id` | Current order ID | Auto-populated |

## 📊 Response Schemas

All endpoints include comprehensive response examples with:
- Success responses (200, 201)
- Error responses (400, 401, 404, 500)
- Complete data structures
- Realistic sample data

## 🎯 Usage Tips

1. **Run in Sequence**: Start with Health → Auth → Services → Orders
2. **Check Environment**: Ensure variables are set correctly
3. **Monitor Console**: Check test results and logs
4. **Use Folders**: Organized by feature domains
