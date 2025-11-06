# 🔍 Enhanced Vendor Search with Location Flow

## Overview
Updated vendor search to integrate seamlessly with the location flow, providing multiple input methods and user-friendly search experience.

## 🚀 New Search Features

### Multiple Location Input Methods
```http
GET /api/v1/vendors/search
```

**Option 1: Coordinates**
```
?latitude=5.6037&longitude=-0.1870&includeDistance=true
```

**Option 2: Address**
```
?address=Oxford Street, Accra&radius=15&sortBy=rating
```

**Option 3: Place ID (from autocomplete)**
```
?placeId=ChIJ...&serviceId=507f1f77bcf86cd799439011
```

**Option 4: No location (all vendors)**
```
?serviceId=507f1f77bcf86cd799439011&sortBy=name
```

### Enhanced Response Format
```json
{
  "vendors": [
    {
      "id": "507f1f77bcf86cd799439021",
      "name": "Clean Express Laundromat",
      "address": {
        "street": "123 Oxford Street",
        "city": "Accra",
        "region": "Greater Accra"
      },
      "phone": "+233201234567",
      "rating": 4.5,
      "reviewCount": 128,
      "distance": 2.3,
      "distanceText": "2.3 km",
      "duration": 8,
      "durationText": "8 mins",
      "distanceStatus": "calculated"
    }
  ],
  "total": 1,
  "userLocation": {
    "latitude": 5.6037,
    "longitude": -0.1870
  },
  "searchCriteria": {
    "radius": 10,
    "serviceId": "507f1f77bcf86cd799439011",
    "sortBy": "distance",
    "includeDistance": true
  },
  "message": "No vendors found in your area. Try increasing the search radius.",
  "suggestions": [
    "Increase search radius to 20km",
    "Remove service type filter",
    "Check if your location is correct"
  ]
}
```

## 🎯 Search Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `latitude` | number | User latitude | `5.6037` |
| `longitude` | number | User longitude | `-0.1870` |
| `address` | string | User address | `"Oxford Street, Accra"` |
| `placeId` | string | Google/Mapbox place ID | `"ChIJ..."` |
| `serviceId` | string | Filter by service | `"507f..."` |
| `radius` | number | Search radius (km) | `10` |
| `includeDistance` | boolean | Calculate distances | `true` |
| `sortBy` | string | Sort method | `"distance"` |

## 🔄 Search Flow

### 1. Location Input
```javascript
// Address autocomplete
const suggestions = await fetch('/api/v1/location/autocomplete?query=oxford');

// Current location
navigator.geolocation.getCurrentPosition(position => {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
});

// Manual address
const location = await fetch('/api/v1/location/geocode', {
  method: 'POST',
  body: JSON.stringify({ address: 'Oxford Street, Accra' })
});
```

### 2. Vendor Search
```javascript
// Search with coordinates
const vendors = await fetch('/api/v1/vendors/search?latitude=5.6037&longitude=-0.1870&includeDistance=true');

// Search with place ID
const vendors = await fetch('/api/v1/vendors/search?placeId=ChIJ...&radius=15');

// Search with address
const vendors = await fetch('/api/v1/vendors/search?address=Oxford Street, Accra');
```

## 🎨 Frontend Features

### Enhanced Search Interface
- **Address Autocomplete**: Real-time suggestions
- **Current Location**: GPS integration
- **Flexible Filters**: Service type, radius, sorting
- **Distance Toggle**: Optional detailed calculations
- **Smart Suggestions**: Helpful tips when no results

### User-Friendly Results
- **Distance Information**: Visual distance/time display
- **Sorting Options**: Distance, rating, name
- **Filter Chips**: Clear search criteria display
- **No Results Handling**: Helpful suggestions

## 🔧 Backend Improvements

### Flexible Location Resolution
```typescript
// Automatically handles different input types
if (searchDto.latitude && searchDto.longitude) {
  // Use coordinates directly
} else if (searchDto.placeId) {
  // Resolve place ID to coordinates
} else if (searchDto.address) {
  // Geocode address to coordinates
} else {
  // Return all vendors without location filtering
}
```

### Smart Sorting & Filtering
```typescript
// Optional service filtering
const matchConditions: any = { isActive: true };
if (serviceId) {
  matchConditions.services = serviceId;
}

// Multiple sorting options
switch (searchDto.sortBy) {
  case 'rating': sortedVendors.sort((a, b) => b.rating - a.rating);
  case 'name': sortedVendors.sort((a, b) => a.name.localeCompare(b.name));
  case 'distance': sortedVendors.sort((a, b) => a.distance - b.distance);
}
```

### Helpful Error Handling
```typescript
if (sortedVendors.length === 0) {
  response.message = 'No vendors found in your area...';
  response.suggestions = [
    'Increase search radius to 20km',
    'Remove service type filter',
    'Check if your location is correct'
  ];
}
```

## 📱 Usage Examples

### Complete Search Flow
1. **Open search page**: `examples/vendor-search-flow.html`
2. **Enter location**: Type address or use GPS
3. **Set filters**: Service type, radius, sorting
4. **Search**: Get results with distances
5. **Select vendor**: Choose for order creation

### API Integration
```javascript
// Complete search with all options
const searchParams = {
  address: 'Oxford Street, Accra',
  serviceId: '507f1f77bcf86cd799439011',
  radius: 15,
  includeDistance: true,
  sortBy: 'distance'
};

const response = await fetch(`/api/v1/vendors/search?${new URLSearchParams(searchParams)}`);
const data = await response.json();

console.log(`Found ${data.total} vendors`);
data.vendors.forEach(vendor => {
  console.log(`${vendor.name} - ${vendor.distanceText} away`);
});
```

The enhanced search provides a complete, user-friendly experience for finding nearby laundry vendors with flexible input methods and intelligent suggestions!
