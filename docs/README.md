# Yersi Laundry API Documentation

## 📋 Overview
Complete documentation for the Yersi laundry service API including order management, vendor pricing, payment processing, and admin functionality.

## 📁 Documentation Files

### 🚀 **API Collections (Postman)**
- **`Yersi-Order-Payment-Complete.postman_collection.json`** - Complete order and payment flow
- **`Payment-Methods.postman_collection.json`** - Payment method management
- **`Admin-Vendor-Management.postman_collection.json`** - Admin vendor operations
- **`Yersi-Laundry-API.postman_collection.json`** - Legacy API collection

### 📖 **Documentation**
- **`API-Documentation-Summary.md`** - Complete API overview and usage guide
- **`order-confirmation-frontend.md`** - Frontend integration for order confirmation
- **`checkout-frontend-example.md`** - Frontend checkout implementation guide

## 🔧 Quick Start

1. **Import Postman Collections**
   - Import the relevant `.postman_collection.json` files into Postman
   - Set environment variables (base_url, auth_token)

2. **Environment Setup**
   ```json
   {
     "base_url": "http://localhost:3000",
     "auth_token": "your_jwt_token_here",
     "order_id": "ORD-1763652231465",
     "payment_method_id": "mm_1763652231465"
   }
   ```

3. **Authentication**
   - Obtain JWT token via `/auth/login` endpoint
   - Set token in environment variables
   - All protected endpoints require `Authorization: Bearer {token}`

## 🎯 Key Features

### Order Management
- ✅ Vendor-specific pricing calculations
- ✅ Draft order creation and updates
- ✅ Order confirmation with locked pricing
- ✅ Real-time pricing updates

### Payment System
- ✅ Mobile money support (MTN, Telecel, AirtelTigo)
- ✅ OTP verification system
- ✅ Payment method management
- ✅ Checkout flow with delivery options

### Admin Features
- ✅ Vendor management
- ✅ Service configuration
- ✅ Order tracking and updates

## 📱 Mobile Money Providers
- **MTN Mobile Money** - Ghana's leading mobile money service
- **Telecel Cash** - Telecel's mobile money platform
- **AirtelTigo Money** - AirtelTigo's mobile payment solution

## 🔒 Security
- JWT authentication on all protected endpoints
- Phone number validation for Ghana formats
- OTP verification for payment methods
- Secure data masking and validation

## 🧪 Testing
Use the Postman collections to test:
1. Order creation and pricing calculations
2. Vendor selection and pricing updates
3. Payment method management
4. Complete checkout flow
5. Admin operations

## 📞 Support
For API questions or issues, refer to the detailed documentation files or contact the development team.
