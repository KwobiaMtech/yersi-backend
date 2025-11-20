# Yersi Order & Payment API Documentation

## 📋 Overview

This documentation covers the comprehensive order management and payment system for Yersi laundry service, including vendor pricing, order confirmation, checkout flow, and payment method management.

## 🚀 Key Features Implemented

### 1. **Vendor-Specific Pricing System**
- Dynamic pricing based on vendor selection
- Item-by-item pricing breakdown
- Savings calculation vs base pricing
- Real-time pricing updates

### 2. **Order Lifecycle Management**
- Draft → Confirmed → Checkout → Payment flow
- Flexible order updates until confirmation
- Locked pricing after confirmation
- Comprehensive order tracking

### 3. **Checkout & Payment Flow**
- Delivery options (Self-service vs Delivery)
- Multiple payment methods support
- Real-time total calculations
- Payment gateway integration ready

### 4. **Payment Method Management**
- Mobile money support (MTN, Telecel, AirtelTigo)
- OTP verification system
- Default payment method management
- Secure phone number masking

## 📁 Postman Collections

### 1. **Yersi-Order-Payment-Complete.postman_collection.json**
Complete order management and checkout flow:
- Order calculation with vendor pricing
- Draft order creation and updates
- Order confirmation with locked pricing
- Checkout process with delivery options

### 2. **Payment-Methods.postman_collection.json**
Payment method management:
- Add mobile money accounts (MTN, Telecel, AirtelTigo)
- OTP verification system
- Update and delete payment methods
- Default method management

## 🔗 API Endpoints Summary

### Order Management
```
POST   /orders/calculate                    # Calculate pricing with vendor
POST   /orders                             # Create draft order
PUT    /orders/:id                         # Update order details
GET    /orders/:id/confirmation-details    # Get confirmation screen data
POST   /orders/:id/confirm                 # Confirm order and lock pricing
POST   /orders/:id/preview-vendor-pricing  # Preview different vendor pricing
```

### Checkout Flow
```
GET    /orders/:id/checkout                # Get checkout options
POST   /orders/checkout                    # Process checkout with payment
```

### Payment Methods
```
GET    /payment-methods                    # Get user's payment methods
POST   /payment-methods/mobile-money       # Add mobile money method
PUT    /payment-methods/:id                # Update payment method
DELETE /payment-methods/:id                # Delete payment method
POST   /payment-methods/:id/verify         # Verify with OTP
```

## 🔧 Environment Variables

```json
{
  "base_url": "http://localhost:3000",
  "auth_token": "your_jwt_token_here",
  "order_id": "ORD-1763652231465",
  "payment_method_id": "mm_1763652231465"
}
```

## 📱 Mobile Money Providers Supported

- **MTN Mobile Money** (`mtn`)
- **Telecel Cash** (`telecel`) 
- **AirtelTigo Money** (`airteltigo`)

## 🔒 Security Features

- JWT authentication required for all endpoints
- Phone number validation for Ghana formats
- OTP verification for payment methods
- Phone number masking for privacy
- Duplicate payment method prevention

## 💡 Usage Examples

### Calculate Order with Vendor Pricing
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

### Add MTN Mobile Money
```json
POST /payment-methods/mobile-money
{
  "phoneNumber": "+233555000006",
  "accountName": "John Doe",
  "provider": "mtn",
  "setAsDefault": true
}
```

### Process Checkout
```json
POST /orders/checkout
{
  "orderId": "ORD-1763652231465",
  "checkoutOptions": {
    "deliveryType": "delivery_service",
    "paymentMethod": "mtn_mobile_money"
  }
}
```

## 🧪 Testing

Import the Postman collections and:
1. Set environment variables
2. Obtain JWT token via authentication
3. Test order creation and vendor pricing
4. Test payment method management
5. Test complete checkout flow

## 📊 Response Formats

All responses include:
- Proper HTTP status codes
- Consistent JSON structure
- Detailed error messages
- Comprehensive data objects

## 🔄 Order Status Flow

```
draft → confirmed → pending_payment → confirmed → pending → picked_up → in_wash → ready_for_pickup → delivering → completed
```

This API provides a complete, production-ready solution for laundry service order management with vendor pricing, payment processing, and comprehensive customer experience features.
