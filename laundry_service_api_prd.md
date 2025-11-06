# Laundry Service Backend API - Product Requirements Document
*(Updated)*

## 1. Executive Summary

### 1.1 Product Overview
A RESTful backend API system that powers a mobile laundry service application, providing endpoints for service management, order processing, user authentication, payment processing, vendor selection, and logistics coordination.

### 1.2 Business Objectives
- Provide reliable, scalable API infrastructure for mobile and web clients
- Enable real-time order tracking and management
- Support vendor-based service delivery model
- Support multiple service tiers with dynamic item-based pricing
- Facilitate secure payment processing and user management
- Enable efficient logistics and delivery coordination with vendor partnerships

## 2. API Architecture & Design

### 2.1 Technical Stack Requirements
- **Framework**: Node.js with Express.js or Python with FastAPI/Django
- **Database**: PostgreSQL for transactional data, Redis for caching
- **Authentication**: JWT-based authentication with refresh tokens
- **Payment Processing**: Integration with mobile money and card payment gateways
- **Real-time Features**: WebSocket support for order tracking
- **Documentation**: OpenAPI 3.0 specification with Swagger UI

### 2.2 API Design Principles
- RESTful architecture with consistent URL patterns
- JSON request/response format
- Stateless design for horizontal scalability
- Version control in URL structure (v1, v2)
- Comprehensive error handling with standardized error codes

## 3. Core API Endpoints & Requirements

### 3.1 Service Management API

#### 3.1.1 GET /api/v1/services
**Purpose**: Retrieve available laundry services

**Response Structure**:
```json
{
  "services": [
    {
      "id": "wash-fold",
      "name": "Wash & Fold",
      "description": "Complete wash, dry, and fold service for everyday items",
      "base_price": 8.00,
      "currency": "GHS",
      "minimum_order": 50.00,
      "turnaround_hours": [24, 48],
      "features": [
        "professional_washing",
        "machine_drying",
        "careful_folding",
        "same_day_available"
      ],
      "icon": "shirt",
      "color_theme": "blue",
      "is_active": true
    }
  ]
}
```

### 3.2 Vendor Management API

#### 3.2.1 GET /api/v1/vendors/search
**Purpose**: Search for vendors based on location and service type

**Query Parameters**:
- `latitude` (required): User's latitude
- `longitude` (required): User's longitude
- `service_id` (required): Selected service type
- `radius` (optional): Search radius in km (default: 10)

**Response Structure**:
```json
{
  "vendors": [
    {
      "id": "vendor_uuid",
      "name": "Clean Master Laundromat",
      "rating": 4.2,
      "total_reviews": 156,
      "distance_km": 7.5,
      "estimated_pickup_time": 30,
      "address": {
        "street": "Tema Station, Community 1",
        "city": "Accra",
        "region": "Greater Accra"
      },
      "services_offered": ["wash-fold", "wash-steam", "steam-only"],
      "is_available": true,
      "delivery_fee": 10.00
    }
  ]
}
```

#### 3.2.2 GET /api/v1/vendors/{vendor_id}
**Purpose**: Get detailed vendor information
Response includes: services, pricing, reviews, operating hours, etc.

### 3.3 Item Management API

#### 3.3.1 GET /api/v1/items
**Purpose**: Get available items with pricing for specific service

**Query Parameters**:
- `service_id` (required): Service type identifier

**Response Structure**:
```json
{
  "items": [
    {
      "id": "tshirt",
      "name": "T-Shirt",
      "category": "casual_wear",
      "price": 8.00,
      "currency": "GHS",
      "icon": "tshirt",
      "care_instructions": ["machine_wash", "tumble_dry"]
    },
    {
      "id": "dress_shirt",
      "name": "Dress Shirt",
      "category": "formal_wear",
      "price": 12.00,
      "currency": "GHS",
      "icon": "dress_shirt"
    },
    {
      "id": "sweater",
      "name": "Sweater",
      "category": "knitwear",
      "price": 15.00,
      "currency": "GHS",
      "icon": "sweater"
    },
    {
      "id": "tank_top",
      "name": "Tank Top",
      "category": "casual_wear",
      "price": 6.00,
      "currency": "GHS",
      "icon": "tank_top"
    }
  ]
}
```

### 3.4 Order Management API

#### 3.4.1 POST /api/v1/orders
**Purpose**: Create new laundry order
**Authentication**: Bearer token required

**Request Body**:
```json
{
  "service_id": "wash-fold",
  "vendor_id": "vendor_uuid",
  "items": [
    {
      "item_id": "tshirt",
      "quantity": 2,
      "special_instructions": "Handle with care"
    },
    {
      "item_id": "dress_shirt",
      "quantity": 1
    },
    {
      "item_id": "sweater",
      "quantity": 2
    },
    {
      "item_id": "tank_top",
      "quantity": 2
    }
  ],
  "pickup_address": {
    "street": "123 Main Street",
    "city": "Accra",
    "region": "Greater Accra",
    "postal_code": "GA-123-4567",
    "phone": "+233201234567",
    "instructions": "Gate code: 1234"
  },
  "delivery_address": {
    "street": "123 Main Street",
    "city": "Accra",
    "region": "Greater Accra",
    "postal_code": "GA-123-4567",
    "phone": "+233201234567"
  },
  "preferred_pickup_time": "2025-09-09T08:00:00Z",
  "preferred_delivery_time": "2025-09-11T08:00:00Z"
}
```

#### 3.4.2 POST /api/v1/orders/calculate
**Purpose**: Calculate order total before placing order
**Authentication**: Bearer token required

**Request Body**:
```json
{
  "service_id": "wash-fold",
  "vendor_id": "vendor_uuid",
  "items": [
    {
      "item_id": "tshirt",
      "quantity": 2
    },
    {
      "item_id": "dress_shirt",
      "quantity": 1
    },
    {
      "item_id": "sweater",
      "quantity": 2
    },
    {
      "item_id": "tank_top",
      "quantity": 2
    }
  ],
  "promo_code": "NEWUSER10"
}
```

**Response Structure**:
```json
{
  "calculation": {
    "items": [
      {
        "item_id": "tshirt",
        "name": "T-Shirt",
        "quantity": 2,
        "unit_price": 8.00,
        "total": 16.00
      },
      {
        "item_id": "dress_shirt",
        "name": "Dress Shirt",
        "quantity": 1,
        "unit_price": 12.00,
        "total": 12.00
      },
      {
        "item_id": "sweater",
        "name": "Sweater",
        "quantity": 2,
        "unit_price": 15.00,
        "total": 30.00
      },
      {
        "item_id": "tank_top",
        "name": "Tank Top",
        "quantity": 2,
        "unit_price": 6.00,
        "total": 12.00
      }
    ],
    "subtotal": 70.00,
    "delivery_fee": 10.00,
    "promo_discount": -10.00,
    "total": 70.00,
    "currency": "GHS",
    "total_items": 7,
    "applied_promotions": [
      {
        "code": "NEWUSER10",
        "description": "New user discount",
        "discount_amount": 10.00
      }
    ]
  }
}
```

### 3.5 Promotion & Credit Management API

#### 3.5.1 POST /api/v1/promotions/validate
**Purpose**: Validate promo code
**Authentication**: Bearer token required

**Request Body**:
```json
{
  "promo_code": "NEWUSER10",
  "order_total": 80.00
}
```

#### 3.5.2 GET /api/v1/users/credits
**Purpose**: Get user's available credits
**Authentication**: Bearer token required

**Response**:
```json
{
  "available_credits": 100.00,
  "currency": "GHS",
  "expiry_date": "2025-12-31T23:59:59Z"
}
```

### 3.6 Payment API Updates

#### 3.6.1 POST /api/v1/payments/initialize
**Purpose**: Initialize payment for an order
**Authentication**: Bearer token required

**Request Body**:
```json
{
  "order_id": "order_uuid",
  "payment_method": "mobile_money",
  "phone": "+233201234567",
  "network": "MTN",
  "use_credits": true,
  "credits_amount": 10.00
}
```

## 4. Enhanced Data Models & Database Schema

### 4.1 Core Entities
- **Users**: Authentication, profile, preferences, credits
- **Vendors**: Partner laundromats with location, ratings, services
- **Services**: Available laundry services with pricing models
- **Items**: Individual item types with specific pricing
- **Orders**: Order details, items, addresses, vendor assignment, tracking
- **Payments**: Payment records and transaction history
- **ServiceAreas**: Geographic coverage and logistics data
- **Promotions**: Discount codes and credit systems
- **Reviews**: Vendor ratings and customer feedback

### 4.2 Database Relationships
```sql
Users (1:many) -> Orders
Users (1:many) -> UserCredits
Vendors (1:many) -> Orders
Vendors (1:many) -> VendorServices
Services (1:many) -> Items
Orders (1:many) -> OrderItems
Items (1:many) -> OrderItems
Orders (1:1) -> Payments
ServiceAreas (1:many) -> Vendors
Vendors (1:many) -> VendorReviews
Users (1:many) -> VendorReviews
Orders (1:many) -> PromotionUsage
Promotions (1:many) -> PromotionUsage
```

### 4.3 Enhanced Data Model Requirements

#### Items Table Structure:
- Item-specific pricing (T-Shirt: 8GH¢, Dress Shirt: 12GH¢, Sweater: 15GH¢, Tank Top: 6GH¢)
- Category classification system
- Service compatibility matrix
- Care instruction metadata
- Icon/image references

#### Vendors Table Structure:
- Vendor profile information
- Location coordinates
- Service offerings
- Rating and review aggregations
- Operating hours
- Delivery fee structure
- Availability status

#### Order Calculation Logic:
- Real-time total calculation based on selected items and quantities
- Minimum order validation (50GH¢ threshold)
- Dynamic pricing updates
- Item-level special instructions support
- Promo code validation and application
- Credit balance integration
- Delivery fee calculation based on vendor

#### Promotions & Credits System:
- User credit balance tracking
- Promo code validation and usage tracking
- Automatic discount application
- Credit expiry management

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
- API response time: < 200ms for 95% of requests
- Vendor search with geolocation: < 500ms response time
- Support for 1000+ concurrent users
- Database query optimization with proper indexing
- Caching strategy for frequently accessed data (services, items, vendor locations)
- Real-time delivery fee calculation: < 100ms
- Order total calculation: < 100ms

### 5.2 Security Requirements
- JWT token authentication with 1-hour expiration
- HTTPS encryption for all API communications
- Input validation and sanitization
- Rate limiting: 100 requests/minute per user
- Password hashing with bcrypt (minimum 12 rounds)
- PCI DSS compliance for payment data handling

### 5.3 Scalability Requirements
- Horizontal scaling capability with load balancing
- Database connection pooling
- Stateless design for easy replication
- Microservices architecture consideration for future growth

### 5.4 Reliability Requirements
- 99.9% uptime availability
- Automatic failover capabilities
- Database backup and recovery procedures
- Error logging and monitoring integration
- Graceful error handling with meaningful error messages

## 6. Integration Requirements

### 6.1 Third-Party Services
- **Payment Gateways**: MTN Mobile Money, Vodafone Cash, Paystack
- **SMS Service**: For OTP verification and notifications
- **Email Service**: For receipts and order confirmations
- **Push Notifications**: Firebase Cloud Messaging
- **Mapping Service**: Google Maps API for address validation and vendor location
- **Geolocation Services**: Distance calculation between users and vendors

### 6.2 Monitoring & Analytics
- Application performance monitoring (APM)
- API usage analytics and metrics
- Error tracking and alerting
- Business intelligence dashboards
- Vendor performance tracking
- User behavior analytics

## 7. API Documentation & Testing

### 7.1 Documentation Requirements
- Complete OpenAPI 3.0 specification
- Interactive Swagger UI interface
- Code examples in multiple languages
- Webhook documentation with sample payloads
- Authentication guide with token management
- Vendor integration documentation

### 7.2 Testing Requirements
- Unit tests: 90%+ code coverage
- Integration tests for all API endpoints
- Load testing for performance validation
- Security testing for vulnerability assessment
- Automated testing in CI/CD pipeline

## 8. Success Metrics & Monitoring

### 8.1 Technical KPIs
- API response time percentiles (p50, p95, p99)
- Error rate < 0.1%
- API availability > 99.9%
- Database query performance metrics
- Vendor search performance metrics

### 8.2 Business KPIs
- Order completion rate > 95%
- Payment success rate > 98%
- Average vendor selection time < 30 seconds
- Schedule completion rate (pickup/delivery on time) > 92%
- Customer retention metrics via API usage
- Vendor utilization rates and capacity optimization
- Geographic expansion success metrics
- Promo code usage and effectiveness metrics
- Credit system utilization rates

## 9. Future Considerations

### 9.1 Scalability Planning
- Microservices migration strategy
- Event-driven architecture implementation
- Caching layer enhancement (Redis Cluster)
- Database sharding for large-scale growth

### 9.2 Feature Expansion
- Multi-tenant architecture for franchise support
- Advanced analytics and reporting APIs
- Integration APIs for third-party partners
- Mobile app offline synchronization support
- AI-powered vendor recommendation system
- Dynamic pricing based on demand and supply
- Loyalty program integration

## 10. Key Updates Based on Mobile App Analysis

### 10.1 Pricing Model Changes
- Updated from service-based pricing to item-based pricing
- Individual item pricing: T-Shirt (8GH¢), Dress Shirt (12GH¢), Sweater (15GH¢), Tank Top (6GH¢)
- Delivery fees are vendor-specific, not universally free
- Minimum order requirement maintained at 50GH¢

### 10.2 Vendor Selection Model
- Orders are assigned to specific vendor partners
- Vendor selection based on location, rating, and availability
- Each vendor has individual delivery fees and service areas
- Real-time vendor availability checking required

### 10.3 Payment System Enhancement

#### Multiple Payment Methods:
- Credit Balance (100GH¢ available shown in app)
- Credit Card (Visa, Mastercard, American Express)
- MTN Mobile Money (with phone number input and PIN prompt)
- Vodafone Cash (similar mobile money flow)

#### Payment Flow Features:
- Real-time payment method availability checking
- Secure payment processing with encryption notice
- Mobile money phone number collection and validation
- USSD prompt notification for mobile money payments
- Credit balance integration with order payment

### 10.4 Enhanced User Experience Features

#### Order Management:
- Promo code system for discounts
- User credit balance for payments
- Real-time order total calculation
- Detailed cost breakdown (subtotal, delivery fee, discounts, total)
- Item quantity management in order flow

#### Payment Experience:
- Payment method selection with clear descriptions
- Credit balance display and usage option
- Mobile money network selection
- Security assurance messaging
- Order total confirmation before payment

### 10.5 Additional API Requirements

#### Core APIs:
- Vendor search and selection endpoints
- Item catalog management with specific pricing
- Promotion validation system
- Credit balance management and usage tracking
- Enhanced order calculation with multiple pricing factors

#### Payment APIs:
- Payment method availability checking
- Multiple payment gateway integrations
- Credit balance deduction and tracking
- Mobile money payment initiation
- Credit card processing with PCI compliance
- Real-time payment status updates

### 10.7 Order Tracking & Status Management

#### Comprehensive Tracking System:
- Order number format: #65789903 (8-digit numeric)
- 5-stage status progression: Picked Up → In Wash → Ready For Pickup → Delivering → Completed
- Progress percentage calculation (100% when completed)
- Real-time status updates with timestamps (Sep 9, 1:26 AM format)
- Detailed status descriptions for user clarity

#### Status Management Features:
- Visual progress indicator with completion states
- Last updated timestamp tracking
- Status history with complete timeline
- WebSocket integration for real-time updates
- Admin/vendor status update capabilities

### 10.8 Support & Receipt System

#### Customer Support Integration:
- "Contact Support" functionality for order issues
- Support ticket creation with order context
- Multiple contact methods (phone, email, in-app)
- Priority-based support routing

#### Receipt Management:
- "Download Receipt" feature for completed orders
- PDF receipt generation with complete order details
- Secure receipt URL generation and access
- Order summary with itemized breakdown and payment information

### 10.9 Enhanced User Experience Features

#### Order Details Display:
- Complete order information in single view
- Vendor details with rating and location
- Service type and item count display
- Total amount and order date information
- Pickup and delivery schedule display

#### Real-time Communication:
- Status-specific messaging for user clarity
- Timestamp precision for all status updates
- Visual indicators for completed vs. pending states
- Progress tracking with percentage completion