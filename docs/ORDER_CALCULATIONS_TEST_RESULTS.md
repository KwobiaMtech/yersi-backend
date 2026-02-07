# Order Calculations E2E Test Results

## Test Date: Saturday, 2026-02-07

## ✅ All Tests Passing

### Test Suite: Order Calculations E2E
**File:** `src/modules/orders/order-calculations-e2e.spec.ts`

### Test Results

#### Test 1: Basic Calculation (No Promo)
**Scenario:** 2 shirts + 1 pants, no promo code

**Input:**
- Item 1: 2 shirts × 0.5kg × 25 GHS/kg = 25 GHS
- Item 2: 1 pants × 0.8kg × 25 GHS/kg = 20 GHS

**Result:**
```
✅ subtotal(45) + deliveryFee(5) - promo(0) = 50 GHS
```

**Verification:**
- Subtotal: 45 GHS ✓
- Delivery Fee: 5 GHS ✓
- Promo Discount: 0 GHS ✓
- **Total: 50 GHS** ✓

---

#### Test 2: With Promo Code
**Scenario:** 3 shirts with promo code "SAVE10"

**Input:**
- Item 1: 3 shirts × 0.5kg × 20 GHS/kg = 30 GHS
- Promo Code: SAVE10 (-5 GHS)

**Result:**
```
✅ subtotal(30) + deliveryFee(5) - promo(5) = 30 GHS
```

**Verification:**
- Subtotal: 30 GHS ✓
- Delivery Fee: 5 GHS ✓
- Promo Discount: 5 GHS ✓
- **Total: 30 GHS** ✓

---

#### Test 3: Vendor Pricing
**Scenario:** 2 shirts with vendor-specific pricing

**Input:**
- Item 1: 2 shirts × 1.0kg × 20 GHS/kg = 40 GHS (vendor price)
- Vendor Delivery Fee: 8 GHS

**Result:**
```
✅ subtotal(40) + deliveryFee(8) - promo(0) = 48 GHS
```

**Verification:**
- Subtotal: 40 GHS ✓
- Delivery Fee: 8 GHS (vendor) ✓
- Promo Discount: 0 GHS ✓
- Vendor Pricing: Included ✓
- **Total: 48 GHS** ✓

---

#### Test 4: Multiple Items
**Scenario:** 1 shirt + 2 pants + 1 jacket

**Input:**
- Item 1: 1 shirt × 0.5kg × 30 GHS/kg = 15 GHS
- Item 2: 2 pants × 0.8kg × 30 GHS/kg = 48 GHS
- Item 3: 1 jacket × 1.2kg × 30 GHS/kg = 36 GHS

**Result:**
```
✅ subtotal(99) + deliveryFee(5) - promo(0) = 104 GHS
```

**Verification:**
- Subtotal: 99 GHS ✓
- Delivery Fee: 5 GHS ✓
- Promo Discount: 0 GHS ✓
- Total Weight: 3.3 kg ✓
- Total Items: 4 ✓
- **Total: 104 GHS** ✓

---

## Pricing Formula Verified

### Confirmed Formula:
```
total = subtotal + deliveryFee - promoDiscount
```

Where:
- **subtotal** = Σ(item.weight × item.unitPrice × item.quantity)
- **deliveryFee** = vendor.deliveryFee OR default (5 GHS)
- **promoDiscount** = promo code discount OR 0

### Test Coverage

| Test Case | Status | Formula Verified |
|-----------|--------|------------------|
| Basic calculation | ✅ PASS | subtotal + delivery |
| With promo code | ✅ PASS | subtotal + delivery - promo |
| Vendor pricing | ✅ PASS | vendor subtotal + vendor delivery |
| Multiple items | ✅ PASS | sum of all items + delivery |

## Run Tests

```bash
npm test -- order-calculations-e2e.spec.ts
```

## Summary

✅ **All 4 tests passing**
- Order calculations are correct
- Total = subtotal + deliveryFee - promoDiscount
- Vendor pricing working
- Promo codes applying correctly
- Multiple items calculated accurately

**No calculation errors found!**
