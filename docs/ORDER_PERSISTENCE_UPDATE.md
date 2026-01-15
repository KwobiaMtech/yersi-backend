# Order Persistence Implementation

## Summary
Updated the order flow to persist all order data to MongoDB database instead of using mock data.

## Changes Made

### 1. OrdersService (`src/modules/orders/services/orders.service.ts`)
- **Added** `OrdersRepository` injection
- **Updated** `createOrder()` - Now saves orders to database with proper type conversions
- **Updated** `getUserOrders()` - Fetches orders from database via repository
- **Updated** `getOrderById()` - Retrieves order from database
- **Updated** `updateOrderVendor()` - Persists vendor changes to database
- **Updated** `updateOrder()` - Saves all order updates to database
- **Updated** `confirmOrder()` - Persists order confirmation and locked pricing
- **Updated** `processCheckout()` - Saves checkout details (delivery type, payment method, payment reference)

### 2. Order Schema (`src/modules/orders/schemas/order.schema.ts`)
- **Added** `deliveryType` field - Stores selected delivery type (self_service/delivery_service)
- **Added** `paymentMethod` field - Stores selected payment method
- **Added** `paymentReference` field - Stores payment transaction reference

### 3. OrdersRepository (`src/modules/orders/repositories/orders.repository.ts`)
- **Added** `update()` method - Generic update method for order modifications

## Database Operations

### Create Order
```typescript
const order = await this.ordersRepository.create({
  orderNumber: 'YRS123456',
  status: OrderStatus.DRAFT,
  userId: userId,
  serviceId: serviceId,
  vendorId: vendorId,
  items: [...],
  pickupAddress: {...},
  deliveryAddress: {...},
  totalWeight: 1.8,
  subtotal: 36,
  deliveryFee: 8,
  total: 44,
  // ... other fields
});
```

### Update Order
```typescript
// Using Mongoose document save
order.vendorId = newVendorId;
order.subtotal = newSubtotal;
await order.save();
```

### Confirm Order
```typescript
order.status = OrderStatus.CONFIRMED;
order.confirmedAt = new Date();
order.lockedPricing = {
  vendorId: vendor._id.toString(),
  vendorName: vendor.name,
  servicePrice: 20,
  deliveryFee: 8,
  subtotal: 36,
  total: 44,
  confirmedAt: new Date(),
};
await order.save();
```

### Process Checkout
```typescript
order.deliveryType = 'delivery_service';
order.paymentMethod = 'mtn_mobile_money';
order.paymentReference = 'PAY_1234567890';
order.status = OrderStatus.PENDING;
await order.save();
```

## Type Conversions

### ObjectId Conversions
- `userId`: String → ObjectId (using `as any`)
- `vendorId`: String → ObjectId (using `as any`)
- Reading: `order.vendorId.toString()` when passing to other services

### Date Conversions
- `preferredPickupTime`: ISO String → Date (`new Date(isoString)`)
- `preferredDeliveryTime`: ISO String → Date (`new Date(isoString)`)

## Order Status Flow (Persisted)
```
DRAFT → CONFIRMED → PENDING → PICKED_UP → IN_WASH → 
READY_FOR_PICKUP → DELIVERING → COMPLETED
```

## Cache Invalidation
All database operations invalidate the user's order cache:
```typescript
await this.cacheManager.del(`user-orders-${this.context.userId}`);
```

## Testing Checklist
- [x] Build compiles successfully
- [ ] Create order saves to database
- [ ] Update order persists changes
- [ ] Confirm order locks pricing in database
- [ ] Checkout saves payment details
- [ ] Get orders retrieves from database
- [ ] Order status updates persist

## Migration Notes
- No database migration needed - schema already existed
- Existing mock data will be replaced with real database records
- All order operations now persist immediately
- Cache still used for read performance

## Next Steps
1. Test complete order flow end-to-end
2. Verify all fields persist correctly
3. Test order retrieval and updates
4. Validate locked pricing persists after confirmation
5. Ensure checkout details are saved properly
