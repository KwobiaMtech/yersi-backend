# E2E Test Suite Documentation

## Overview
This comprehensive end-to-end test suite covers all API routes and ensures the entire application works correctly from user registration to order completion.

## Test Files

### 1. `complete-e2e.spec.ts`
Complete flow testing all modules in sequence:
- Health checks
- Authentication flow
- All CRUD operations
- Protected routes
- Error handling
- Rate limiting

### 2. `modules-e2e.spec.ts`
Modular testing of individual components:
- Isolated module testing
- Better error isolation
- Focused test scenarios
- Edge case handling

### 3. `helpers/test-utils.ts`
Utility functions for common test operations:
- User authentication
- Test data creation
- Response validation helpers

## Running Tests

### Individual Test Suites
```bash
# Basic E2E tests
npm run test:e2e

# Complete flow tests
npm run test:e2e:complete

# Modular tests
npm run test:e2e:modules

# All tests with reporting
npm run test:all
```

### Test Coverage
```bash
# Run with coverage
npm run test:cov

# E2E with coverage
npm run test:e2e -- --coverage
```

## Test Structure

### 1. Authentication Flow
- User registration
- Email verification (if implemented)
- Login/logout
- Token validation
- Password reset flow

### 2. Public Routes
- Health check
- Services listing
- Vendor search
- Items catalog
- Promotions

### 3. Protected Routes (User)
- User profile management
- Order creation/management
- Payment processing
- Order history

### 4. Admin Routes
- Dashboard access
- User management
- Order management
- System statistics

### 5. Error Scenarios
- Invalid data validation
- Authentication failures
- Authorization errors
- Rate limiting
- 404 handling

## Test Data

### User Test Data
```typescript
{
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890'
}
```

### Order Test Data
```typescript
{
  items: [{ itemId: 'test-item', quantity: 2 }],
  serviceId: 'test-service',
  vendorId: 'test-vendor',
  pickupAddress: '123 Test St',
  deliveryAddress: '456 Test Ave'
}
```

## Environment Setup

### Prerequisites
- Node.js 18+
- MongoDB (or uses in-memory database)
- Redis (optional, falls back to memory cache)

### Environment Variables
```bash
# Test environment
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/laundry-test
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=test-secret
```

## Test Execution Flow

1. **Setup Phase**
   - Start in-memory MongoDB
   - Initialize NestJS application
   - Configure test environment

2. **Authentication Phase**
   - Register test user
   - Authenticate and get token
   - Store credentials for protected routes

3. **Module Testing Phase**
   - Test each module systematically
   - Validate responses and data
   - Check error handling

4. **Cleanup Phase**
   - Close database connections
   - Shutdown application
   - Generate test reports

## Expected Results

### Success Criteria
- All routes respond correctly
- Authentication works properly
- Data validation functions
- Error handling is appropriate
- Performance is acceptable

### Common Issues
- Database connection failures
- Authentication token expiry
- Validation errors
- Rate limiting triggers
- Memory leaks in tests

## Debugging Tests

### Verbose Output
```bash
# Run with detailed output
npm run test:e2e -- --verbose

# Debug specific test
npm run test:e2e -- --testNamePattern="Auth Module"
```

### Test Isolation
```bash
# Run single test file
npx jest test/modules-e2e.spec.ts

# Run specific describe block
npx jest --testNamePattern="Orders Module"
```

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    npm ci
    npm run test:all
```

### Test Reports
- JSON report: `test-report.json`
- Coverage report: `coverage/`
- Console output with timing

## Best Practices

1. **Test Independence**: Each test should be independent
2. **Data Cleanup**: Clean up test data after each test
3. **Realistic Data**: Use realistic test data
4. **Error Testing**: Test both success and failure scenarios
5. **Performance**: Monitor test execution time
6. **Documentation**: Keep tests well-documented

## Troubleshooting

### Common Errors
- `ECONNREFUSED`: Database not running
- `401 Unauthorized`: Token issues
- `Timeout`: Tests running too long
- `Memory leak`: Improper cleanup

### Solutions
- Check database connectivity
- Verify authentication flow
- Increase test timeout
- Ensure proper cleanup in afterAll hooks
