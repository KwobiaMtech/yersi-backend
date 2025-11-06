# 📍 Google Location API Integration Guide

## Overview
Complete location flow implementation using Google Places API for address autocomplete, geocoding, and distance calculation between users and vendors.

## 🚀 Setup Instructions

### 1. Get Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Places API
   - Geocoding API
   - Distance Matrix API
4. Create API key and restrict it to your domain

### 2. Configure Environment
```bash
# Add to .env file
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### 3. Install Dependencies
```bash
npm install axios --legacy-peer-deps
```

## 📚 API Endpoints

### Address Autocomplete
```http
GET /api/v1/location/autocomplete?query=oxford street&country=GH
```

**Response:**
```json
{
  "predictions": [
    {
      "placeId": "ChIJ...",
      "description": "Oxford Street, Accra, Ghana",
      "mainText": "Oxford Street",
      "secondaryText": "Accra, Ghana"
    }
  ]
}
```

### Geocode Address
```http
POST /api/v1/location/geocode
Content-Type: application/json

{
  "address": "Oxford Street, Accra, Ghana"
}
```

**Response:**
```json
{
  "latitude": 5.6037,
  "longitude": -0.1870,
  "formattedAddress": "Oxford St, Accra, Ghana",
  "placeId": "ChIJ...",
  "addressComponents": [...]
}
```

### Get Place Details
```http
GET /api/v1/location/place-details?placeId=ChIJ...
```

### Calculate Distance
```http
POST /api/v1/location/distance
Content-Type: application/json

{
  "userLatitude": 5.6037,
  "userLongitude": -0.1870,
  "vendorId": "507f1f77bcf86cd799439021"
}
```

**Response:**
```json
{
  "vendor": {
    "id": "507f1f77bcf86cd799439021",
    "name": "Clean Express",
    "coordinates": { "latitude": 5.6040, "longitude": -0.1875 }
  },
  "userLocation": {
    "latitude": 5.6037,
    "longitude": -0.1870
  },
  "distance": 0.45,
  "distanceText": "450 m",
  "duration": 2,
  "durationText": "2 mins",
  "status": "calculated"
}
```

### Find Nearby Vendors with Distances
```http
GET /api/v1/location/nearby-vendors?latitude=5.6037&longitude=-0.1870&radius=10&serviceId=507f...
```

**Response:**
```json
[
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
    "distance": 0.45,
    "distanceText": "450 m",
    "duration": 2,
    "durationText": "2 mins",
    "distanceStatus": "calculated",
    "operatingHours": {
      "monday": "08:00-18:00",
      "saturday": "09:00-16:00",
      "sunday": "closed"
    }
  }
]
```

## 🎯 Location Flow Implementation

### 1. Address Input with Autocomplete
```javascript
// Frontend implementation
async function fetchAddressSuggestions(query) {
  const response = await fetch(`/api/v1/location/autocomplete?query=${query}&country=GH`);
  const data = await response.json();
  return data.predictions;
}
```

### 2. Place Selection & Geocoding
```javascript
async function selectPlace(placeId) {
  const response = await fetch(`/api/v1/location/place-details?placeId=${placeId}`);
  const location = await response.json();
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    address: location.formattedAddress
  };
}
```

### 3. Find Nearby Vendors
```javascript
async function findNearbyVendors(lat, lng, radius = 10) {
  const response = await fetch(
    `/api/v1/location/nearby-vendors?latitude=${lat}&longitude=${lng}&radius=${radius}`
  );
  return await response.json();
}
```

## 🔧 Features Implemented

### ✅ Address Autocomplete
- Real-time suggestions as user types
- Country-specific results (Ghana focus)
- Structured address components

### ✅ Geocoding & Reverse Geocoding  
- Convert addresses to coordinates
- Get place details from Place ID
- Formatted address standardization

### ✅ Distance Calculation
- Google Distance Matrix API integration
- Fallback to Haversine formula
- Driving time and distance
- Multiple calculation modes

### ✅ Vendor Discovery
- Location-based vendor search
- Distance sorting (nearest first)
- Service filtering
- Real-time distance updates

### ✅ Error Handling
- API quota management
- Fallback calculations
- Network error recovery
- Invalid location handling

## 🎨 Frontend Example

A complete HTML example is provided in `examples/location-flow.html` featuring:
- Address autocomplete with dropdown
- Interactive vendor search
- Distance calculations
- Responsive design
- Error handling

## 🔒 Security Considerations

1. **API Key Restrictions**: Restrict Google API key to your domain
2. **Rate Limiting**: Implement request throttling
3. **Input Validation**: Validate coordinates and addresses
4. **Error Handling**: Don't expose API errors to users

## 📱 Mobile Integration

The location flow works seamlessly with:
- HTML5 Geolocation API
- Mobile address input
- Touch-friendly interfaces
- Offline fallback modes

## 🚀 Usage Example

1. **Start the server**: `npm run start:dev`
2. **Open**: `examples/location-flow.html` in browser
3. **Type address**: Start typing any Ghana address
4. **Select location**: Click on autocomplete suggestion
5. **Find vendors**: Click "Find Nearby Vendors"
6. **View results**: See vendors sorted by distance

The system provides a complete location-aware experience for users to find the nearest laundry services!
