# 👨‍💼 Admin Flow - Role-Based Management System

## Overview
Complete admin management system with role-based access control for Super Admins and Vendor Admins to manage the laundry service platform.

## 🎯 Admin Roles

### Super Admin
- **Full system access**
- Manage all vendors and users
- Create/deactivate admin accounts
- View system-wide analytics
- Monitor application health

### Vendor Admin
- **Vendor-specific access**
- Manage own vendor profile
- Handle vendor orders
- Update service offerings
- View vendor analytics

## 🚀 API Endpoints

### Super Admin Endpoints

#### Authentication
```http
POST /api/v1/admin/login
Content-Type: application/json

{
  "email": "admin@laundryservice.com",
  "password": "securepassword"
}
```

#### Dashboard & Stats
```http
GET /api/v1/admin/dashboard
Authorization: Bearer {super_admin_token}
```

#### Admin Management
```http
# Create new admin
POST /api/v1/admin/create
Authorization: Bearer {super_admin_token}

{
  "email": "vendor@cleanexpress.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "vendor_admin",
  "vendorId": "507f1f77bcf86cd799439021"
}

# Get all admins
GET /api/v1/admin/admins
Authorization: Bearer {super_admin_token}

# Deactivate admin
DELETE /api/v1/admin/admins/{id}
Authorization: Bearer {super_admin_token}
```

#### Vendor Management
```http
# Get all vendors
GET /api/v1/admin/vendors?page=1&limit=10
Authorization: Bearer {super_admin_token}

# Get vendor details
GET /api/v1/admin/vendors/{id}
Authorization: Bearer {super_admin_token}

# Deactivate vendor
DELETE /api/v1/admin/vendors/{id}
Authorization: Bearer {super_admin_token}
```

#### User & Order Management
```http
# Get all users
GET /api/v1/admin/users?page=1&limit=10
Authorization: Bearer {super_admin_token}

# Get all orders
GET /api/v1/admin/orders?page=1&limit=10
Authorization: Bearer {super_admin_token}
```

### Vendor Admin Endpoints

#### Dashboard
```http
GET /api/v1/vendor-admin/dashboard
Authorization: Bearer {vendor_admin_token}
```

**Response:**
```json
{
  "vendor": {
    "id": "507f1f77bcf86cd799439021",
    "name": "Clean Express Laundromat",
    "address": {...},
    "rating": 4.5,
    "isActive": true
  },
  "stats": {
    "totalOrders": 156,
    "pendingOrders": 3,
    "completedOrders": 145,
    "revenue": 3240.50,
    "rating": 4.7,
    "reviewCount": 89
  }
}
```

#### Profile Management
```http
PUT /api/v1/vendor-admin/profile
Authorization: Bearer {vendor_admin_token}

{
  "name": "Clean Express Laundromat",
  "description": "Fast and reliable laundry services",
  "phone": "+233201234567",
  "operatingHours": {
    "monday": "08:00-18:00",
    "tuesday": "08:00-18:00",
    "saturday": "09:00-16:00",
    "sunday": "closed"
  }
}
```

#### Order Management
```http
# Get vendor orders
GET /api/v1/vendor-admin/orders?page=1&limit=10
Authorization: Bearer {vendor_admin_token}

# Update order status
PUT /api/v1/vendor-admin/orders/{orderId}/status
Authorization: Bearer {vendor_admin_token}

{
  "status": "in_progress"
}
```

#### Services & Analytics
```http
# Get vendor services
GET /api/v1/vendor-admin/services
Authorization: Bearer {vendor_admin_token}

# Get analytics
GET /api/v1/vendor-admin/analytics
Authorization: Bearer {vendor_admin_token}
```

## 🔐 Security Features

### Role-Based Access Control
```typescript
// Admin authentication guard
@UseGuards(AdminAuthGuard)
@Roles(AdminRole.SUPER_ADMIN)
async superAdminOnlyEndpoint() {
  // Only super admins can access
}

@UseGuards(AdminAuthGuard)
@Roles(AdminRole.VENDOR_ADMIN)
async vendorAdminEndpoint() {
  // Only vendor admins can access
}
```

### JWT Token Authentication
- Separate admin tokens from user tokens
- Role-based permissions in JWT payload
- Token expiration and refresh handling

### Data Isolation
- Vendor admins can only access their own vendor data
- Super admins have full system access
- Automatic vendor ID validation for vendor admins

## 🎨 Frontend Dashboards

### Super Admin Dashboard (`examples/admin-dashboard.html`)
**Features:**
- System overview with key metrics
- Vendor management (create, view, deactivate)
- User management and monitoring
- Order oversight across all vendors
- Admin account management
- Real-time system health monitoring

**Key Sections:**
- 📊 **Dashboard Stats** - Users, vendors, orders, system health
- 🏪 **Vendor Management** - Create vendor admins, monitor vendors
- 👥 **User Management** - View and manage customer accounts
- 📋 **Order Management** - System-wide order monitoring
- 👨‍💼 **Admin Management** - Create/deactivate admin accounts

### Vendor Dashboard (`examples/vendor-dashboard.html`)
**Features:**
- Vendor-specific analytics and metrics
- Order management and status updates
- Profile and business information management
- Service offerings configuration
- Performance analytics and reports

**Key Sections:**
- 📈 **Analytics** - Revenue, orders, ratings, performance
- 📋 **Order Management** - View and update order statuses
- 🏪 **Profile Management** - Business details and operating hours
- 🧺 **Service Management** - Enable/disable services, pricing
- 📊 **Reports** - Detailed performance analytics

## 🔧 Implementation Features

### Database Schema
```typescript
// Admin schema with role-based access
@Schema({ timestamps: true })
export class Admin extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, enum: AdminRole })
  role: AdminRole;

  @Prop({ type: Types.ObjectId, ref: 'Vendor', required: false })
  vendorId?: Types.ObjectId; // Only for vendor admins

  @Prop({ default: true })
  isActive: boolean;

  @Prop([String])
  permissions: string[];
}
```

### Guard Implementation
```typescript
// Automatic role checking and data isolation
@Injectable()
export class AdminAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verify JWT token
    // Check admin role permissions
    // Validate vendor access for vendor admins
    // Inject admin data into request
  }
}
```

### Service Layer Security
```typescript
// Vendor admin service with automatic access control
async getVendorOrders(admin: Admin) {
  if (admin.role !== AdminRole.VENDOR_ADMIN || !admin.vendorId) {
    throw new ForbiddenException('Access denied');
  }
  // Return only orders for this vendor
}
```

## 🚀 Usage Examples

### Super Admin Workflow
1. **Login** with super admin credentials
2. **View Dashboard** - System overview and metrics
3. **Create Vendor Admin** - Set up new vendor account
4. **Monitor Vendors** - Track performance and status
5. **Manage Users** - View customer accounts and activity
6. **System Oversight** - Monitor orders and system health

### Vendor Admin Workflow
1. **Login** with vendor admin credentials
2. **View Dashboard** - Vendor-specific metrics
3. **Manage Orders** - Update order statuses and track progress
4. **Update Profile** - Maintain business information
5. **Configure Services** - Enable/disable service offerings
6. **View Analytics** - Track performance and revenue

## 🔒 Security Best Practices

1. **Password Requirements** - Minimum 6 characters, complexity rules
2. **Token Expiration** - JWT tokens with reasonable expiry times
3. **Role Validation** - Server-side role checking on every request
4. **Data Isolation** - Vendor admins can only access their data
5. **Audit Logging** - Track admin actions and changes
6. **Session Management** - Secure login/logout handling

The admin flow provides comprehensive management capabilities while maintaining strict security and data isolation between different admin roles!
