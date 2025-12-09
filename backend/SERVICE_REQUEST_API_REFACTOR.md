# Service Request API Refactoring Summary

## 🎯 **Problem Solved**
The original API structure mixed different user roles in a single `/api/v1/service-requests/*` endpoint, creating confusion about access control and permissions.

## 🏗️ **New Role-Based API Structure**

### 1. **Customer Endpoints** 

#### **Mobile App** - `/api/v1/mobile/service-requests/*` ⭐ **PRIMARY**
**Authentication**: Customer authentication required  
**Access**: Customers can only access their own service requests  
**Status**: ✅ **Existing & Active** (Mobile app already using these)

```bash
POST   /api/v1/mobile/service-requests           # Create new service request
GET    /api/v1/mobile/service-requests           # Get customer's own requests
GET    /api/v1/mobile/service-requests/{id}      # Get specific request (if owner)
PATCH  /api/v1/mobile/service-requests/{id}/cancel # Cancel request (if owner)
```

#### **Web Interface** - `/api/v1/service-requests/*` 
**Authentication**: Customer authentication required  
**Access**: Customers can only access their own service requests  
**Status**: 🆕 **New Web-Compatible** (for web dashboards)

```bash
POST   /api/v1/service-requests/           # Create new service request  
GET    /api/v1/service-requests/my-requests # Get customer's own requests
GET    /api/v1/service-requests/{id}       # Get specific request (if owner)
PATCH  /api/v1/service-requests/{id}       # Update request (if owner)
DELETE /api/v1/service-requests/{id}       # Cancel request (if owner)
```

### 2. **Company/Branch User Endpoints** - `/api/v1/company/service-requests/*`
**Authentication**: Company/Branch user authentication required  
**Access**: Users can only access requests assigned to branches they work for

```bash
GET    /api/v1/company/service-requests/          # List requests for user's branches
GET    /api/v1/company/service-requests/detailed  # List detailed requests for user's branches
GET    /api/v1/company/service-requests/{id}      # Get specific request (if assigned to user's branch)
GET    /api/v1/company/service-requests/{id}/detailed # Get detailed request (if assigned to user's branch)
```

### 3. **Branch User Action Endpoints** - `/api/v1/branch/service-requests/*`
**Authentication**: Branch user authentication required  
**Access**: Users can only act on requests assigned to their branches

```bash
GET    /api/v1/branch/service-requests/assigned-to-me    # Get requests assigned to user's branches
POST   /api/v1/branch/service-requests/{id}/accept      # Accept service request
POST   /api/v1/branch/service-requests/{id}/start       # Start work on request
POST   /api/v1/branch/service-requests/{id}/complete    # Complete request
POST   /api/v1/branch/service-requests/{id}/reschedule  # Reschedule request
POST   /api/v1/branch/service-requests/{id}/cancel      # Cancel request
GET    /api/v1/branch/service-requests/{id}/timeline    # Get request timeline
```

### 4. **Admin Endpoints** - `/api/v1/admin/service-requests/*`
**Authentication**: Super admin authentication required  
**Access**: Super admins can access all service requests

```bash
GET    /api/v1/admin/service-requests/                    # List all requests (with filters)
PATCH  /api/v1/admin/service-requests/{id}               # Update any request
POST   /api/v1/admin/service-requests/{id}/assign-branch # Assign request to branch
DELETE /api/v1/admin/service-requests/{id}               # Delete any request
```

## 🔐 **Access Control Matrix**

| User Type | Mobile Endpoints | Web Customer Endpoints | Company Endpoints | Branch Actions | Admin Endpoints |
|-----------|------------------|------------------------|-------------------|----------------|-----------------|
| **Customer (Mobile)** | ✅ Own requests only | ⚠️ Should use mobile | ❌ | ❌ | ❌ |
| **Customer (Web)** | ⚠️ Should use web | ✅ Own requests only | ❌ | ❌ | ❌ |
| **Branch User** | ❌ | ❌ | ✅ Assigned branches only | ✅ Assigned branches only | ❌ |
| **Company Owner** | ❌ | ❌ | ✅ Company branches only | ✅ Company branches only | ❌ |
| **Super Admin** | ❌ (use admin endpoints) | ❌ (use admin endpoints) | ❌ (use admin endpoints) | ❌ (use admin endpoints) | ✅ All requests |

## 📁 **File Structure**

```
app/api/routes/
├── customer_service_requests.py     # Customer operations
├── company_service_requests.py      # Company/Branch user viewing
├── service_request_actions.py       # Branch user workflow actions
├── admin_service_requests.py        # Super admin operations
└── [removed] service_requests.py    # Old mixed file removed
```

## 🚀 **Benefits**

1. **Clear Role Separation**: URL immediately indicates intended user type
2. **Automatic Authorization**: Each endpoint enforces proper access control
3. **Scalable Architecture**: Easy to add new role-specific endpoints
4. **Better Security**: No mixed permissions in single endpoints
5. **Intuitive API Design**: RESTful and self-documenting

## 🔄 **Migration Impact**

**Breaking Changes**: ⚠️ 
- Admin endpoints moved from `/api/v1/service-requests/` to `/api/v1/admin/service-requests/`
- Branch viewing endpoints moved to `/api/v1/company/service-requests/`

**No Breaking Changes**: ✅
- **Mobile app endpoints** remain unchanged at `/api/v1/mobile/service-requests/*`
- **Customer web endpoints** available at `/api/v1/service-requests/*` (new)

**Frontend Updates Needed**:
- Update admin panel to use `/admin/service-requests/*` endpoints
- Update company/branch dashboards to use `/company/service-requests/*` endpoints  
- **Mobile app requires no changes** ✅
- Customer web interfaces can use new `/service-requests/*` endpoints

## ✅ **Implementation Status**

- ✅ Customer endpoints (backward compatible)
- ✅ Company/Branch user viewing endpoints
- ✅ Branch user action endpoints (unchanged)
- ✅ Admin endpoints (new location)
- ✅ Proper authentication on all endpoints
- ✅ Access control validation
- ✅ Backend integration complete
