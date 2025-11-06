# 🗺️ Multi-Provider Location Service Setup

## Overview
The location service now supports 3 providers that can be switched via environment configuration:
- **Google Maps** (default)
- **Mapbox** 
- **Nominatim** (OpenStreetMap - Free)

## 🚀 Quick Setup

### 1. Choose Your Provider
Add to `.env` file:

```bash
# Use Google Maps (default)
LOCATION_PROVIDER=google
GOOGLE_MAPS_API_KEY=your-google-api-key

# OR use Mapbox
LOCATION_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsb...

# OR use Nominatim (free, no API key needed)
LOCATION_PROVIDER=nominatim
```

### 2. Get API Keys

#### Google Maps
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable: Places API, Geocoding API, Distance Matrix API
3. Create API key
4. Add: `GOOGLE_MAPS_API_KEY=your-key`

#### Mapbox
1. Sign up at [mapbox.com](https://account.mapbox.com/)
2. Get access token
3. Add: `MAPBOX_ACCESS_TOKEN=pk.eyJ...`

#### Nominatim
- No setup required - completely free!

## 🔄 Provider Comparison

| Feature | Google Maps | Mapbox | Nominatim |
|---------|-------------|---------|-----------|
| **Autocomplete** | ✅ Excellent | ✅ Good | ⚠️ Basic search |
| **Geocoding** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Distance Matrix** | ✅ Yes | ✅ Yes | ❌ Haversine only |
| **Place Details** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Cost** | $2.83/1k | $0.50/1k | Free |
| **Free Tier** | $200/month | 100k/month | Unlimited |

## 🎯 Usage Examples

### Switch to Mapbox
```bash
# .env
LOCATION_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibXl1c2VyIiwiYSI6ImNsb3JkZXIifQ...
```

### Switch to Free Nominatim
```bash
# .env
LOCATION_PROVIDER=nominatim
# No API key needed!
```

### Switch to Google Maps
```bash
# .env
LOCATION_PROVIDER=google
GOOGLE_MAPS_API_KEY=AIzaSyC4R6AN7SmxxxxxxxxxxxxxxxxxxxxxxxxxxX
```

## 🔧 API Behavior

All providers use the same API endpoints:
- `GET /location/autocomplete`
- `POST /location/geocode`
- `GET /location/place-details`
- `POST /location/distance`
- `GET /location/nearby-vendors`

### Provider-Specific Features:

#### Google Maps
- Best autocomplete suggestions
- Accurate driving times
- Rich place details

#### Mapbox
- Good autocomplete
- Accurate routing
- 80% cheaper than Google

#### Nominatim
- Basic search (no real autocomplete)
- Free geocoding
- Distance estimation only (no routing)

## 🚨 Error Handling

The service automatically falls back to Haversine distance calculation if:
- API quota exceeded
- Network errors
- Invalid coordinates

## 🧪 Testing Different Providers

```bash
# Test with Google Maps
curl "http://localhost:3000/api/v1/location/autocomplete?query=oxford street"

# Switch provider in .env and restart
npm run start:dev

# Test with new provider
curl "http://localhost:3000/api/v1/location/autocomplete?query=oxford street"
```

## 💡 Recommendations

### For Production (Ghana)
1. **Google Maps** - Best local data coverage
2. **Mapbox** - Good alternative, better pricing

### For Development/Testing
1. **Nominatim** - Free, no limits
2. **Mapbox** - Generous free tier

### For High Volume
1. **Mapbox** - Best pricing at scale
2. **HERE Maps** - Enterprise features

## 🔒 Security Notes

- Restrict API keys to your domain
- Use environment variables, never hardcode keys
- Monitor API usage and set quotas
- Implement rate limiting on your endpoints

The system automatically detects the provider and initializes the correct service - no code changes needed, just environment configuration!
