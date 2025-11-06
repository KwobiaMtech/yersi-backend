# Laundry Service Backend API

A scalable NestJS backend API for a mobile laundry service application with MongoDB and Redis.

## Features

- **Modular Architecture**: Organized by business domains (auth, orders, vendors, etc.)
- **JWT Authentication**: Secure user authentication with refresh tokens
- **Geospatial Queries**: Location-based vendor search with MongoDB 2dsphere indexing
- **Caching**: Redis integration for improved performance
- **Real-time Updates**: Order status tracking with WebSocket support
- **Payment Processing**: Multiple payment methods (mobile money, credit cards, credits)
- **Promotion System**: Promo codes and user credit management
- **API Documentation**: Swagger/OpenAPI integration

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator and class-transformer

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start MongoDB and Redis locally or update connection strings in .env

# Run the application
npm run start:dev
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Services
- `GET /api/v1/services` - Get available laundry services

### Vendors
- `GET /api/v1/vendors/search` - Search vendors by location
- `GET /api/v1/vendors/:id` - Get vendor details

### Items
- `GET /api/v1/items?service_id=:id` - Get items by service type

### Orders
- `POST /api/v1/orders/calculate` - Calculate order total
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order details

### Payments
- `POST /api/v1/payments/initialize` - Initialize payment

### Users
- `GET /api/v1/users/credits` - Get user credit balance

## API Documentation

Access Swagger documentation at: `http://localhost:3000/api/docs`

## Database Schema

All schemas include automatic `created_at` and `updated_at` timestamps via Mongoose `timestamps: true` option.

### Key Collections:
- **users**: User accounts and authentication
- **vendors**: Partner laundromats with geospatial data
- **services**: Available laundry services
- **items**: Individual items with pricing
- **orders**: Order management with status tracking
- **payments**: Payment processing and history
- **promotions**: Promo codes and discounts

## Performance Optimizations

- **Caching**: Redis caching for frequently accessed data (services, items)
- **Database Indexing**: Geospatial indexes for vendor location queries
- **Connection Pooling**: MongoDB connection optimization
- **Validation**: Input validation at API layer
- **Modular Design**: Separation of concerns for better maintainability

## Deployment

The application is containerized and ready for deployment on cloud platforms:

```bash
# Build for production
npm run build

# Start production server
npm run start:prod
```

## Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/laundry-service
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```