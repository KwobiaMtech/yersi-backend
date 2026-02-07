# Order Pricing Flow Update

## Changes Made

### Problem
The order `total` field was incorrectly set to `estimatedMaxTotal` instead of the actual total price.

### Solution
Updated the pricing calculation so that:
- **subtotal** = sum of all item prices (items total)
- **total** = subtotal + deliveryFee - promoDiscount

## Updated Files

### 1. `src/modules/orders/services/order-mapping.service.ts`
**Method:** `toCreateData()`

**Before:**
```typescript
total: calculation.estimatedMaxTotal
```

**After:**
```typescript
const total = calculation.subtotal + calculation.deliveryFee - calculation.promoDiscount;
// ...
total: total
```

### 2. `src/modules/orders/services/orders.service.ts`
**Method:** `updateOrderVendor()`

**Before:**
```typescript
order.total = calculation.estimatedMaxTotal;
```

**After:**
```typescript
order.total = calculation.subtotal + calculation.deliveryFee - calculation.promoDiscount;
```

**Method:** `updateOrder()`

**Before:**
```typescript
order.total = calculation.estimatedMaxTotal;
```

**After:**
```typescript
order.total = calculation.subtotal + calculation.deliveryFee - calculation.promoDiscount;
```

## Pricing Structure

### Order Fields
```typescript
{
  subtotal: number,           // Sum of all item prices
  deliveryFee: number,        // Delivery charge
  promoDiscount: number,      // Promo code discount (default: 0)
  total: number,              // subtotal + deliveryFee - promoDiscount
  estimatedMinTotal: number,  // Minimum estimate (with -20% weight variation)
  estimatedMaxTotal: number   // Maximum estimate (with +20% weight variation)
}
```

### Calculation Formula
```
subtotal = Σ(item.weight × item.unitPrice × item.quantity)
total = subtotal + deliveryFee - promoDiscount
```

### Example
```json
{
  "subtotal": 50,
  "deliveryFee": 10,
  "promoDiscount": 5,
  "total": 55,
  "estimatedMinTotal": 44,
  "estimatedMaxTotal": 66
}
```

**Calculation:**
- Items total (subtotal): 50 GHS
- Delivery fee: 10 GHS
- Promo discount: 5 GHS
- **Final total: 50 + 10 - 5 = 55 GHS**

## Test Coverage

### Test File: `src/modules/orders/order-pricing.spec.ts`

**Tests:**
1. ✅ Calculate total with promo discount
2. ✅ Calculate total without promo discount
3. ✅ Handle different delivery fees

**All tests passing** ✓

## Impact

### Before Fix
- `total` was set to `estimatedMaxTotal` (includes 20% weight variation buffer)
- Customers were charged the maximum estimated amount
- Incorrect pricing displayed

### After Fix
- `total` is the actual price: subtotal + delivery - discount
- Accurate pricing for customers
- `estimatedMinTotal` and `estimatedMaxTotal` remain for reference only

## Verification

Run tests:
```bash
npm test -- order-pricing.spec.ts
```

Expected output:
```
✓ should calculate total as subtotal + deliveryFee - promoDiscount
✓ should calculate total without promo discount
✓ should handle different delivery fees
```

## Summary

✅ **Fixed:** Order total now correctly calculated as `subtotal + deliveryFee - promoDiscount`
✅ **Tested:** All pricing tests passing
✅ **Applied:** Fix applied to create, update, and updateVendor methods
