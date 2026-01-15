# Order Mapping Service Implementation

## Summary
Created a dedicated `OrderMappingService` to handle all order data transformations, separating mapping logic from business logic.

## New File Created

### `src/modules/orders/services/order-mapping.service.ts`
Centralized service for all order data transformations with the following methods:

#### **toResponse(order: Order)**
Maps Order entity to standard response format
- Converts ObjectIds to strings
- Includes all order fields
- Used by: `createOrder`, `getOrderById`, `updateOrder`, `updateOrderVendor`

#### **toResponseList(orders: Order[])**
Maps array of orders to response format
- Used by: `getUserOrders`

#### **toDetailedResponse(order: Order, vendor?, service?)**
Maps order with vendor and service details
- Includes formatted vendor info (id, name, deliveryFee, rating)
- Includes formatted service info (id, name, basePrice, description)
- Used by: `getOrderWithDetails`

#### **toConfirmationDetails(order: Order, vendor, service, currentPricing)**
Maps order for confirmation screen
- Merges order with current pricing
- Includes vendor and service details
- Adds confirmation flags: `canConfirm`, `confirmationRequired`, `isLocked`
- Includes pricing breakdown
- Used by: `getOrderConfirmationDetails`

#### **toCheckoutResponse(order: Order, paymentUrl?, paymentReference?, message?, nextSteps?)**
Maps order for checkout response
- Includes payment details
- Includes delivery type
- Adds custom message and next steps
- Used by: `processCheckout`

## Changes to Existing Files

### `src/modules/orders/orders.module.ts`
- Added `OrderMappingService` to providers
- Added `OrderMappingService` to exports
- Imported service in module

### `src/modules/orders/services/orders.service.ts`
- Injected `OrderMappingService`
- Updated all methods to use mapper:
  - `createOrder()` → `orderMapper.toResponse()`
  - `getUserOrders()` → `orderMapper.toResponseList()`
  - `getOrderById()` → `orderMapper.toResponse()`
  - `getOrderWithDetails()` → `orderMapper.toDetailedResponse()`
  - `getOrderConfirmationDetails()` → `orderMapper.toConfirmationDetails()`
  - `updateOrderVendor()` → `orderMapper.toResponse()`
  - `updateOrder()` → `orderMapper.toResponse()`
  - `confirmOrder()` → `orderMapper.toResponse()` + message/nextSteps
  - `processCheckout()` → `orderMapper.toCheckoutResponse()`

## Benefits

### **Separation of Concerns**
- Business logic in `OrdersService`
- Data transformation in `OrderMappingService`
- Clear responsibility boundaries

### **Consistency**
- All responses use same mapping logic
- Standardized field names and formats
- Consistent ObjectId → string conversions

### **Maintainability**
- Single place to update response formats
- Easy to add/remove fields
- Simplified testing

### **Reusability**
- Mapping methods can be used across different services
- Easy to create new response formats
- Composable mapping functions

## Example Usage

```typescript
// Simple response
const order = await this.ordersRepository.findById(orderId);
return this.orderMapper.toResponse(order);

// Detailed response with relations
const order = await this.ordersRepository.findById(orderId);
const vendor = await this.vendorsRepository.findById(order.vendorId);
const service = await this.servicesRepository.findById(order.serviceId);
return this.orderMapper.toDetailedResponse(order, vendor, service);

// Checkout response
const order = await order.save();
return this.orderMapper.toCheckoutResponse(
  order,
  paymentUrl,
  paymentReference,
  'Order placed successfully',
  ['Complete payment', 'Track order']
);
```

## Response Format Examples

### Standard Response
```json
{
  "id": "507f1f77bcf86cd799439011",
  "orderNumber": "YRS123456",
  "status": "draft",
  "userId": "507f1f77bcf86cd799439012",
  "serviceId": "507f1f77bcf86cd799439020",
  "vendorId": "507f1f77bcf86cd799439013",
  "items": [...],
  "subtotal": 36,
  "total": 44,
  "currency": "GHS"
}
```

### Detailed Response
```json
{
  ...standardResponse,
  "vendor": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Quick Wash",
    "deliveryFee": 8,
    "rating": 4.6
  },
  "service": {
    "id": "507f1f77bcf86cd799439020",
    "name": "Laundry Service",
    "basePrice": 25
  }
}
```

### Confirmation Details
```json
{
  "order": {...withCurrentPricing},
  "vendor": {...},
  "service": {...},
  "pricingBreakdown": {...},
  "canConfirm": true,
  "confirmationRequired": true,
  "isLocked": false
}
```

### Checkout Response
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "orderNumber": "YRS123456",
  "status": "pending_payment",
  "totalAmount": 44,
  "currency": "GHS",
  "paymentMethod": "mtn_mobile_money",
  "deliveryType": "delivery_service",
  "paymentUrl": "https://...",
  "paymentReference": "PAY_123",
  "message": "Order placed successfully",
  "nextSteps": ["Complete payment", "Track order"]
}
```

## Build Status
✅ Code compiles successfully with no errors

## Testing Checklist
- [ ] All endpoints return consistent response format
- [ ] ObjectIds properly converted to strings
- [ ] Vendor and service details formatted correctly
- [ ] Confirmation details include all required flags
- [ ] Checkout response includes payment details
- [ ] List responses map all orders correctly
