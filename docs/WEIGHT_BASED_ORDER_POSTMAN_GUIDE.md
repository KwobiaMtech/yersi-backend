# Weight-Based Order Flow - Postman Guide

## Overview
This Postman collection demonstrates the complete weight-based order flow that matches the mobile app interface shown in the laundry order screenshot.

## Files Created
1. `Weight-Based-Order-Complete.postman_collection.json` - Complete collection
2. `Weight-Based-Order-Flow.postman_environment.json` - Environment variables

## Setup Instructions

### 1. Import Collection & Environment
1. Open Postman
2. Import `Weight-Based-Order-Complete.postman_collection.json`
3. Import `Weight-Based-Order-Flow.postman_environment.json`
4. Select the "Weight-Based Order Flow Environment" in Postman

### 2. Environment Variables
The environment includes these key variables:
- `base_url`: API base URL (default: http://localhost:3000/api/v1)
- `access_token`: JWT token (auto-set after login)
- `user_id`: User ID (auto-set after login)
- `vendor_id`: Default vendor ID
- `service_id`: Default service ID

## Collection Structure

### 1. Authentication
- **Login User**: Authenticates and sets access token

### 2. Browse Items by Category
- **Get All Categories**: Lists all clothing categories (top, bottom, etc.)
- **Browse Top Category Items**: Shows shirts and tops with weights
- **Browse Bottom Category Items**: Shows pants, jeans, shorts with weights

### 3. Order Calculation Flow
- **Calculate - Single Item**: Basic calculation for one item
- **Calculate - App Example (4kg, 4 items)**: Matches the mobile app interface exactly
- **Calculate - With Promo Code**: Shows discount application

### 4. Order Creation & Management
- **Create Order - Complete Flow**: Creates order with addresses and preferences
- **Get User Orders**: Lists all user orders with weight info
- **Get Order Details**: Shows detailed order information

## Key Features Demonstrated

### Weight-Based Pricing
```json
{
    "itemId": "shirt-short-sleeve",
    "name": "Shirt (Short Sleeve)",
    "category": "top",
    "quantity": 1,
    "weight": 1
}
```

### App Interface Match
The "Calculate - App Example" request exactly matches the mobile interface:
- 4kg of items selected ✅
- 4 items total ✅
- Estimated range: GHS95 ~GHS120 ✅
- Minimum order validation ✅

### Response Format
```json
{
    "totalWeight": 4,
    "totalItems": 4,
    "subtotal": 100,
    "deliveryFee": 5,
    "promoDiscount": 0,
    "estimatedMinTotal": 95,
    "estimatedMaxTotal": 120,
    "currency": "GHS",
    "needsAdditionalAmount": 5,
    "minimumOrderMet": false
}
```

## Running the Collection

### Sequential Execution
1. **Login** first to get authentication token
2. **Browse categories** to see available items
3. **Calculate orders** with different item combinations
4. **Create order** when satisfied with calculation
5. **View orders** to see created orders

### Test Scripts
Each request includes test scripts that:
- Validate response status and structure
- Log formatted output to console
- Save important values to environment variables
- Provide visual feedback with ✅/❌ indicators

## Example Console Output

```
✅ Login successful, token saved
📋 Available categories: top, bottom, occasional_wear, underwear, nightwear, accessories
👕 Top category items:
  - Shirt (Short Sleeve): 1kg, GHS25/kg
  - Shirt (Long Sleeve): 1kg, GHS25/kg
📱 APP INTERFACE MATCH:
   4kg of items selected ✅
   4 items ✅
   Total Estimated: GHS95 ~GHS120 ✅
   Add GHS 5 more to reach estimated minimum order ✅
✅ Order Created Successfully:
   Order Number: YRS123456
   Total Weight: 4kg
   Total Items: 4
   Estimated Total: GHS95 - GHS120
```

## API Endpoints Covered

### Items
- `GET /items/categories` - Get clothing categories
- `GET /items/by-category` - Get items by category

### Orders
- `POST /orders/calculate` - Calculate weight-based order
- `POST /orders` - Create order
- `GET /orders` - Get user orders
- `GET /orders/{id}` - Get order details

### Authentication
- `POST /auth/login` - User login

## Testing Scenarios

### 1. Single Item Order
Tests basic calculation with one shirt (1kg)

### 2. App Interface Match
Replicates exact scenario from mobile app:
- 1x Short Sleeve Shirt (1kg)
- 3x Long Sleeve Shirt (3kg)
- Total: 4kg, 4 items

### 3. Promo Code Application
Tests discount calculation with promo code

### 4. Complete Order Flow
Full order creation with:
- Multiple items
- Pickup/delivery addresses
- Special instructions
- Preferred times

## Validation Points

✅ **Weight Calculation**: Correctly sums item weights × quantities  
✅ **Price Estimation**: Provides min/max range (±20%)  
✅ **Minimum Order**: Validates against minimum amount  
✅ **Category System**: Items organized by clothing type  
✅ **Order Creation**: Complete order with all details  
✅ **Status Tracking**: Order status and progress  

## Troubleshooting

### Common Issues
1. **401 Unauthorized**: Run login request first
2. **Environment not selected**: Choose correct environment
3. **Variables not set**: Check if login was successful

### Debug Tips
- Check console output for detailed logs
- Verify environment variables are populated
- Ensure server is running on correct port
- Review test script results

## Next Steps
1. Run collection in sequence
2. Modify item quantities to test different scenarios
3. Add new clothing categories
4. Test with different vendor/service combinations
5. Implement real-time order status updates
