#!/bin/bash

# Test script to verify distanceKm is not returning 0

BASE_URL="${BASE_URL:-http://localhost:3000/api/v1}"

echo "Testing vendor search with coordinates..."
echo "=========================================="

RESPONSE=$(curl -s "${BASE_URL}/vendors/search?latitude=5.7139815&longitude=-0.1870&radius=10&serviceId=691b7764f076f777b40c9dcb")

echo "$RESPONSE" | jq '.'

echo ""
echo "Checking distanceKm values..."
echo "=============================="

DISTANCE_VALUES=$(echo "$RESPONSE" | jq -r '.vendors[]? | "\(.name // "Unknown"): \(.distanceKm // "N/A") km"')

if [ -z "$DISTANCE_VALUES" ]; then
  echo "No vendors found or distanceKm field missing"
else
  echo "$DISTANCE_VALUES"
fi

echo ""
echo "Testing with orderId..."
echo "======================="

RESPONSE_WITH_ORDER=$(curl -s "${BASE_URL}/vendors/search?latitude=5.7139815&longitude=-0.1870&radius=10&serviceId=691b7764f076f777b40c9dcb&orderId=696b764933788e3fcb603fed")

echo "$RESPONSE_WITH_ORDER" | jq '.'

echo ""
echo "Checking distanceKm values with orderId..."
echo "==========================================="

DISTANCE_VALUES_ORDER=$(echo "$RESPONSE_WITH_ORDER" | jq -r '.vendors[]? | "\(.name // "Unknown"): \(.distanceKm // "N/A") km"')

if [ -z "$DISTANCE_VALUES_ORDER" ]; then
  echo "No vendors found or distanceKm field missing"
else
  echo "$DISTANCE_VALUES_ORDER"
fi

# Check if any distance is 0
ZERO_COUNT=$(echo "$RESPONSE_WITH_ORDER" | jq '[.vendors[]? | select(.distanceKm == 0)] | length')

if [ "$ZERO_COUNT" -gt 0 ]; then
  echo ""
  echo "⚠️  WARNING: Found $ZERO_COUNT vendor(s) with distanceKm = 0"
  exit 1
else
  echo ""
  echo "✅ All vendors have non-zero distanceKm values"
  exit 0
fi
