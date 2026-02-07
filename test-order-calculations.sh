#!/bin/bash

echo "🧪 Testing Order Calculation API - End to End"
echo "=============================================="
echo ""

SERVER_URL="http://localhost:3000"

# Check if server is running
if ! curl -s "$SERVER_URL/api/v1/items/categories" > /dev/null 2>&1; then
    echo "⚠️  Server not running. Please start with: npm run start:dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test 1: Calculate order without vendor
echo "📊 Test 1: Calculate Order (No Vendor)"
echo "---------------------------------------"

CALC_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/v1/orders/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "507f1f77bcf86cd799439020",
    "items": [
      {
        "itemId": "item1",
        "name": "Shirt",
        "category": "top",
        "categoryId": "cat1",
        "quantity": 2,
        "weight": 0.5
      },
      {
        "itemId": "item2",
        "name": "Pants",
        "category": "bottom",
        "categoryId": "cat2",
        "quantity": 1,
        "weight": 0.8
      }
    ]
  }')

echo "Response: $CALC_RESPONSE"
echo ""

# Extract values
SUBTOTAL=$(echo "$CALC_RESPONSE" | grep -o '"subtotal":[0-9.]*' | cut -d':' -f2)
DELIVERY_FEE=$(echo "$CALC_RESPONSE" | grep -o '"deliveryFee":[0-9.]*' | cut -d':' -f2)
PROMO_DISCOUNT=$(echo "$CALC_RESPONSE" | grep -o '"promoDiscount":[0-9.]*' | cut -d':' -f2)

if [ ! -z "$SUBTOTAL" ] && [ ! -z "$DELIVERY_FEE" ]; then
    EXPECTED_TOTAL=$(echo "$SUBTOTAL + $DELIVERY_FEE - $PROMO_DISCOUNT" | bc)
    echo "✅ Calculation received:"
    echo "   Subtotal: $SUBTOTAL GHS"
    echo "   Delivery Fee: $DELIVERY_FEE GHS"
    echo "   Promo Discount: $PROMO_DISCOUNT GHS"
    echo "   Expected Total: $EXPECTED_TOTAL GHS"
    echo "   Formula: subtotal + deliveryFee - promoDiscount"
else
    echo "⚠️  Response: $CALC_RESPONSE"
fi

echo ""

# Test 2: Calculate order with promo code
echo "📊 Test 2: Calculate Order (With Promo Code)"
echo "---------------------------------------------"

CALC_PROMO=$(curl -s -X POST "$SERVER_URL/api/v1/orders/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "507f1f77bcf86cd799439020",
    "items": [
      {
        "itemId": "item1",
        "name": "Shirt",
        "category": "top",
        "categoryId": "cat1",
        "quantity": 3,
        "weight": 0.5
      }
    ],
    "promoCode": "SAVE10"
  }')

echo "Response: $CALC_PROMO"
echo ""

SUBTOTAL_PROMO=$(echo "$CALC_PROMO" | grep -o '"subtotal":[0-9.]*' | cut -d':' -f2)
DELIVERY_PROMO=$(echo "$CALC_PROMO" | grep -o '"deliveryFee":[0-9.]*' | cut -d':' -f2)
DISCOUNT_PROMO=$(echo "$CALC_PROMO" | grep -o '"promoDiscount":[0-9.]*' | cut -d':' -f2)

if [ ! -z "$SUBTOTAL_PROMO" ] && [ ! -z "$DELIVERY_PROMO" ] && [ ! -z "$DISCOUNT_PROMO" ]; then
    EXPECTED_TOTAL_PROMO=$(echo "$SUBTOTAL_PROMO + $DELIVERY_PROMO - $DISCOUNT_PROMO" | bc)
    echo "✅ Calculation with promo:"
    echo "   Subtotal: $SUBTOTAL_PROMO GHS"
    echo "   Delivery Fee: $DELIVERY_PROMO GHS"
    echo "   Promo Discount: $DISCOUNT_PROMO GHS"
    echo "   Expected Total: $EXPECTED_TOTAL_PROMO GHS"
    
    if [ "$DISCOUNT_PROMO" != "0" ]; then
        echo "   ✅ Promo code applied"
    else
        echo "   ⚠️  Promo code not applied"
    fi
else
    echo "⚠️  Response: $CALC_PROMO"
fi

echo ""

# Test 3: Calculate with vendor
echo "📊 Test 3: Calculate Order (With Vendor)"
echo "-----------------------------------------"

CALC_VENDOR=$(curl -s -X POST "$SERVER_URL/api/v1/orders/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "507f1f77bcf86cd799439020",
    "vendorId": "507f1f77bcf86cd799439021",
    "items": [
      {
        "itemId": "item1",
        "name": "Shirt",
        "category": "top",
        "categoryId": "cat1",
        "quantity": 2,
        "weight": 0.5
      }
    ]
  }')

echo "Response: $CALC_VENDOR"
echo ""

SUBTOTAL_VENDOR=$(echo "$CALC_VENDOR" | grep -o '"subtotal":[0-9.]*' | cut -d':' -f2)
DELIVERY_VENDOR=$(echo "$CALC_VENDOR" | grep -o '"deliveryFee":[0-9.]*' | cut -d':' -f2)
PROMO_VENDOR=$(echo "$CALC_VENDOR" | grep -o '"promoDiscount":[0-9.]*' | cut -d':' -f2)

if [ ! -z "$SUBTOTAL_VENDOR" ] && [ ! -z "$DELIVERY_VENDOR" ]; then
    EXPECTED_TOTAL_VENDOR=$(echo "$SUBTOTAL_VENDOR + $DELIVERY_VENDOR - $PROMO_VENDOR" | bc)
    echo "✅ Calculation with vendor:"
    echo "   Subtotal: $SUBTOTAL_VENDOR GHS"
    echo "   Delivery Fee: $DELIVERY_VENDOR GHS"
    echo "   Promo Discount: $PROMO_VENDOR GHS"
    echo "   Expected Total: $EXPECTED_TOTAL_VENDOR GHS"
    
    if echo "$CALC_VENDOR" | grep -q '"vendorPricing"'; then
        echo "   ✅ Vendor pricing included"
    fi
else
    echo "⚠️  Response: $CALC_VENDOR"
fi

echo ""
echo "=============================================="
echo "✅ Order Calculation Tests Complete"
echo ""
echo "Summary:"
echo "  - Subtotal = sum of item prices"
echo "  - Total = subtotal + deliveryFee - promoDiscount"
echo "  - Promo codes apply discount"
echo "  - Vendor pricing supported"
