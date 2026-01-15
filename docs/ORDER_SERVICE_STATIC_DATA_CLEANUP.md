# Order Service Static Data Cleanup

## Issues Found and Fixed

### 1. **Mock Payment Methods Data** ❌ REMOVED
**Location:** `getCheckoutDetails()` method

**Before:**
```typescript
const savedPaymentMethods = [
  {
    id: 'mtn_001',
    type: PaymentMethod.MTN_MOBILE_MONEY,
    displayName: 'MTN Mobile Money',
    details: '+23355****06',
    isDefault: true,
  },
  {
    id: 'visa_001',
    type: PaymentMethod.VISA_CARD,
    displayName: 'Visa Card',
    details: '000*******0009884',
    isDefault: false,
  },
];
```

**After:**
```typescript
// TODO: Fetch user's saved payment methods from database
const savedPaymentMethods = [];
```

**Reason:** Payment methods should be fetched from the payment methods service/database, not hardcoded.

---

### 2. **Hardcoded Static Address** ❌ FIXED
**Location:** `getCheckoutDetails()` method

**Before:**
```typescript
description: orderDetails.order.deliveryAddress?.formattedAddress || 'East Legon, Greater Accra, Ghana',
```

**After:**
```typescript
description: orderDetails.order.deliveryAddress?.formattedAddress || 'Delivery to your address',
```

**Reason:** Should use actual order address, not a hardcoded location.

---

### 3. **Magic Numbers** ✅ IMPROVED
**Location:** `calculateOrder()` method

**Before:**
```typescript
let deliveryFee = 5; // Default delivery fee
const promoDiscount = calculateDto.promoCode ? 5 : 0;
const estimatedMinTotal = Math.round((subtotal * 0.8) + deliveryFee - promoDiscount);
const estimatedMaxTotal = Math.round((subtotal * 1.2) + deliveryFee - promoDiscount);
const minimumOrderAmount = 100;
```

**After:**
```typescript
const DEFAULT_DELIVERY_FEE = 5;
const PROMO_DISCOUNT_AMOUNT = 5;
const WEIGHT_VARIATION_PERCENTAGE = 0.2; // ±20%
const MINIMUM_ORDER_AMOUNT = 100;

let deliveryFee = DEFAULT_DELIVERY_FEE;
const promoDiscount = calculateDto.promoCode ? PROMO_DISCOUNT_AMOUNT : 0;
const estimatedMinTotal = Math.round((subtotal * (1 - WEIGHT_VARIATION_PERCENTAGE)) + deliveryFee - promoDiscount);
const estimatedMaxTotal = Math.round((subtotal * (1 + WEIGHT_VARIATION_PERCENTAGE)) + deliveryFee - promoDiscount);
```

**Reason:** Named constants are more maintainable and self-documenting.

---

## Data That IS Correctly Saved to Database ✅

### Order Data
- ✅ Order number, status, user ID
- ✅ Service ID, vendor ID
- ✅ Items with prices and totals
- ✅ Pickup and delivery addresses
- ✅ Subtotal, delivery fee, total
- ✅ Weight and item counts
- ✅ Estimated min/max totals
- ✅ Locked pricing (on confirmation)
- ✅ Customer notes
- ✅ Delivery type
- ✅ Payment method
- ✅ Payment reference
- ✅ Preferred pickup/delivery times
- ✅ Timestamps (createdAt, updatedAt, confirmedAt)

### Vendor & Service Data
- ✅ Fetched from database (not hardcoded)
- ✅ Vendor delivery fees from vendor records
- ✅ Service prices from vendor-service records
- ✅ Base prices from service records

---

## Recommendations for Future Improvements

### 1. **Configuration Service**
Move these constants to a configuration table or environment variables:
```typescript
// Should be in database or config
DEFAULT_DELIVERY_FEE = 5
PROMO_DISCOUNT_AMOUNT = 5
WEIGHT_VARIATION_PERCENTAGE = 0.2
MINIMUM_ORDER_AMOUNT = 100
```

### 2. **Payment Methods Integration**
```typescript
// In getCheckoutDetails()
const savedPaymentMethods = await this.paymentMethodsService.getUserPaymentMethods(userId);
```

### 3. **Promo Code Validation**
```typescript
// Should validate promo code from database
const promo = await this.promotionsService.validatePromoCode(calculateDto.promoCode);
const promoDiscount = promo ? promo.discountAmount : 0;
```

### 4. **Delivery Time Estimates**
```typescript
// Should be calculated based on vendor location and order address
const estimatedTime = await this.deliveryService.calculateEstimatedTime(
  vendor.location,
  order.deliveryAddress
);
```

---

## Summary

### Fixed Issues
1. ❌ Removed mock payment methods data
2. ❌ Removed hardcoded address fallback
3. ✅ Improved magic numbers with named constants

### Already Correct
- ✅ All order data persists to database
- ✅ Vendor and service data fetched from database
- ✅ Pricing calculations use database values
- ✅ Order status and lifecycle tracked in database

### Build Status
✅ Code compiles successfully

The service now has minimal static data, with most values either:
1. Fetched from database (vendors, services, orders)
2. Calculated dynamically (pricing, totals)
3. Named as constants for clarity (configuration values)
