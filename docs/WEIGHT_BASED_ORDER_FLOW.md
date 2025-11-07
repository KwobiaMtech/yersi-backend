# Weight-Based Order Flow Updates

## Overview
Updated the order flow to match the laundry app interface shown in the image, implementing a weight-based pricing model with clothing categories.

## Key Changes Made

### 1. Order Schema Updates (`src/modules/orders/schemas/order.schema.ts`)
- **Enhanced Items Array**: Added `name`, `category`, and `weight` fields to order items
- **New Order Fields**:
  - `totalWeight`: Total weight of all items in kg
  - `totalItems`: Total number of items
  - `estimatedMinTotal`: Minimum estimated total (GH₵95 in the example)
  - `estimatedMaxTotal`: Maximum estimated total (GH₵120 in the example)

### 2. Item Schema Updates (`src/modules/items/schemas/item.schema.ts`)
- **Clothing Categories**: Added enum for clothing categories matching the app interface:
  - Nightwear
  - Accessories
  - Occasional Wear
  - Underwear
  - Top
  - Bottom
- **Weight-Based Pricing**: Added `standardWeight` field for default item weight
- **Price Structure**: Price is now per kg instead of per item

### 3. Order DTOs (`src/modules/orders/dto/order.dto.ts`)
- **OrderItemDto**: Updated to include `name`, `category`, and `weight` fields
- **OrderCalculationResponseDto**: New response DTO with weight-based calculation results
- **Validation**: Added proper validation for weight (minimum 0.1 kg)

### 4. Items DTOs (`src/modules/items/dto/item.dto.ts`)
- **CreateItemDto**: New DTO for creating weight-based items
- **ItemResponseDto**: Response DTO with all item details
- **GetItemsByCategoryDto**: DTO for querying items by clothing category

### 5. Orders Service Updates (`src/modules/orders/services/orders.service.ts`)
- **Weight-Based Calculation**: Implements calculation based on weight × quantity × price per kg
- **Estimated Range**: Provides min/max estimates (±20% variation)
- **Minimum Order Check**: Validates against minimum order amount
- **Mock Data**: Includes realistic mock data matching the app interface

### 6. Items Service Updates (`src/modules/items/services/items.service.ts`)
- **Category-Based Queries**: Added method to get items by clothing category
- **Mock Data**: Comprehensive mock data for all clothing categories
- **Weight Standards**: Each item type has a standard weight (e.g., shirts: 1kg, socks: 0.1kg)

### 7. Controller Updates
- **Orders Controller**: Added proper response types and updated API documentation
- **Items Controller**: Added endpoints for category-based item retrieval

## API Endpoints

### New/Updated Endpoints

#### Items
- `GET /items/categories` - Get all clothing categories
- `GET /items/by-category?category=top&service_id=wash-fold` - Get items by category

#### Orders
- `POST /orders/calculate` - Calculate order with weight-based pricing
  ```json
  {
    "serviceId": "wash-fold",
    "vendorId": "vendor123",
    "items": [
      {
        "itemId": "shirt-short-sleeve",
        "name": "Shirt (Short Sleeve)",
        "category": "top",
        "quantity": 1,
        "weight": 1
      }
    ]
  }
  ```

## Response Format

### Order Calculation Response
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

## Implementation Notes

### Weight-Based Pricing Logic
- Each item has a standard weight (e.g., 1kg for shirts)
- Users can adjust quantity using +/- buttons
- Total weight = item weight × quantity for each item
- Price calculation = weight × quantity × price per kg

### Minimum Order Handling
- System checks if order meets minimum amount
- Shows "Add GHS X more to reach estimated minimum order" message
- Prevents order submission until minimum is met

### Category System
- Items are organized by clothing categories
- Each category has specific items with appropriate weights
- Categories match the app interface tabs

### Estimation Range
- Provides min/max estimates to account for actual weight variations
- Helps set customer expectations
- Based on ±20% of calculated total

## Future Enhancements

1. **Dynamic Pricing**: Implement vendor-specific pricing per kg
2. **Weight Validation**: Add actual weight verification during pickup
3. **Category Icons**: Store and serve category-specific icons
4. **Bulk Discounts**: Implement weight-based discount tiers
5. **Real-time Updates**: WebSocket updates for order status changes

## Testing

The updated flow maintains backward compatibility while adding new weight-based features. All existing endpoints continue to work, with enhanced data in responses.
