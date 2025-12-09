# Company Registration API Documentation

## Overview

This document provides a complete guide to the new company registration functionality that allows companies to register with an admin user and main branch in a single request.

## Implementation Summary

The implementation includes:

1. **Enhanced User Model** - Added company registration status tracking
2. **Enhanced Company Model** - Added registration request/response schemas
3. **Company Registration CRUD** - New methods for registration workflow
4. **API Endpoints** - Registration, approval, and management endpoints
5. **Tests** - Comprehensive test coverage

## API Endpoints

### 1. Company Registration (Public)

**POST** `/api/v1/companies/register`

Allows new companies to register without authentication. Creates company, admin user, and main branch in a single transaction.

#### Request Body

```json
{
  "company": {
    "name": "Tech Solutions Inc",
    "description": "A technology consulting company specializing in digital transformation",
    "industry": "Technology",
    "website": "https://techsolutions.com",
    "email": "info@techsolutions.com",
    "phone": "+1-555-123-4567",
    "address": "123 Innovation Drive, Tech City, TC 12345",
    "city_id": "123e4567-e89b-12d3-a456-426614174003"
  },
  "admin_user": {
    "email": "admin@techsolutions.com",
    "password": "SecurePassword123!",
    "full_name": "John Smith"
  },
  "main_branch": {
    "name": "Headquarters",
    "code": "HQ",
    "address": "123 Innovation Drive, Tech City, TC 12345",
    "postal_code": "12345",
    "phone": "+1-555-123-4567",
    "email": "hq@techsolutions.com",
    "manager_name": "Jane Doe",
    "city_id": "123e4567-e89b-12d3-a456-426614174003",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "registration_notes": "Initial company registration for new tech consulting firm"
}
```

#### Response

```json
{
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174001",
  "branch_id": "123e4567-e89b-12d3-a456-426614174002",
  "registration_status": "pending_review",
  "message": "Company registration submitted successfully. Your registration is pending review by a system administrator.",
  "next_steps": "Please wait for approval. You will receive an email notification once your company has been reviewed and approved."
}
```

### 2. Get Pending Registrations (SuperAdmin Only)

**GET** `/api/v1/companies/registrations/pending`

Returns companies waiting for approval.

#### Headers
```
Authorization: Bearer <superadmin_jwt_token>
```

#### Query Parameters
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum records to return (default: 100)

#### Response

```json
{
  "data": [
    {
      "company_id": "123e4567-e89b-12d3-a456-426614174000",
      "company_name": "Tech Solutions Inc",
      "company_email": "info@techsolutions.com",
      "company_industry": "Technology",
      "admin_user_id": "123e4567-e89b-12d3-a456-426614174001",
      "admin_user_email": "admin@techsolutions.com",
      "admin_user_name": "John Smith",
      "registration_status": "pending_review",
      "created_at": "123e4567-e89b-12d3-a456-426614174000"
    }
  ],
  "count": 1,
  "skip": 0,
  "limit": 100
}
```

### 3. Approve Company Registration (SuperAdmin Only)

**POST** `/api/v1/companies/registrations/{company_id}/approve`

Approves a pending company registration, allowing the admin user to login.

#### Headers
```
Authorization: Bearer <superadmin_jwt_token>
```

#### Path Parameters
- `company_id`: UUID of the company to approve

#### Response

```json
{
  "message": "Company registration approved successfully"
}
```

### 4. Reject Company Registration (SuperAdmin Only)

**POST** `/api/v1/companies/registrations/{company_id}/reject`

Rejects a pending company registration and deactivates the admin user.

#### Headers
```
Authorization: Bearer <superadmin_jwt_token>
```

#### Path Parameters
- `company_id`: UUID of the company to reject

#### Response

```json
{
  "message": "Company registration rejected"
}
```

## Registration Status Flow

1. **pending_review** - Initial status after registration
2. **approved** - SuperAdmin approved the registration (user can login)
3. **rejected** - SuperAdmin rejected the registration (user deactivated)
4. **suspended** - Registration suspended (future use)

## What Gets Created

When a company registers successfully, the system creates:

1. **Company Record** - With all provided company information
2. **Admin User** - With `is_company_admin=True` and `company_registration_status="pending_review"`
3. **Main Branch** - Associated with the company
4. **User-Branch Assignment** - Links admin user to branch with owner privileges:
   - `role="company_admin"`
   - `is_company_owner=True`
   - `company_role="owner"`
   - `company_access_level="all_branches"`

## Usage Examples

### Example 1: Register a New Company

```bash
curl -X POST "http://localhost:8000/api/v1/companies/register" \
  -H "Content-Type: application/json" \
  -d '{
    "company": {
      "name": "My New Company",
      "description": "A description of my company",
      "industry": "Technology",
      "email": "contact@mynewcompany.com",
      "phone": "+1-555-0123"
    },
    "admin_user": {
      "email": "admin@mynewcompany.com",
      "password": "MySecurePassword123!",
      "full_name": "Company Administrator"
    },
    "main_branch": {
      "name": "Main Office",
      "address": "123 Business Ave",
      "postal_code": "12345",
      "manager_name": "Office Manager"
    }
  }'
```

### Example 2: SuperAdmin Views Pending Registrations

```bash
curl -X GET "http://localhost:8000/api/v1/companies/registrations/pending" \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN"
```

### Example 3: SuperAdmin Approves Registration

```bash
curl -X POST "http://localhost:8000/api/v1/companies/registrations/123e4567-e89b-12d3-a456-426614174000/approve" \
  -H "Authorization: Bearer YOUR_SUPERADMIN_TOKEN"
```

## Field Requirements

### Required Fields

**Company:**
- `name` (string, 1-255 chars)

**Admin User:**
- `email` (valid email, max 255 chars)
- `password` (string, 8-40 chars)

**Main Branch:**
- `name` (string, 1-255 chars)

### Optional Fields

**Company:**
- `description`, `industry`, `website`, `email`, `phone`, `address`, `city_id`

**Admin User:**
- `full_name`

**Main Branch:**
- `code`, `address`, `postal_code`, `city_id`, `latitude`, `longitude`, `phone`, `email`, `manager_name`

## Error Handling

### Common Error Responses

**400 Bad Request - Duplicate Email:**
```json
{
  "detail": "A user with this email already exists"
}
```

**400 Bad Request - Duplicate Company Name:**
```json
{
  "detail": "A company with this name already exists"
}
```

**422 Validation Error - Invalid Data:**
```json
{
  "detail": [
    {
      "loc": ["body", "admin_user", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**403 Forbidden - SuperAdmin Required:**
```json
{
  "detail": "Only superadmin can view pending registrations"
}
```

## Security Considerations

1. **No Authentication Required** - Registration endpoint is public
2. **Pending Status** - New users cannot login until approved
3. **SuperAdmin Control** - Only superadmins can approve/reject registrations
4. **Password Security** - Passwords are hashed using secure algorithms
5. **Email Uniqueness** - System prevents duplicate email registrations

## Database Schema Changes

The implementation adds these fields to the User model:
- `company_registration_status` (string, nullable)
- `is_company_admin` (boolean, default False)
- `approved_by` (UUID, nullable, foreign key to User)
- `approved_at` (string, nullable)

## Integration with Existing System

The new registration system integrates seamlessly with the existing:
- User authentication system
- Company management
- Branch management
- User-branch relationships
- Role-based access control

## Testing

Comprehensive tests are included covering:
- Successful registration
- Duplicate email/company name validation
- Permission checks for admin endpoints
- Approval/rejection workflows
- Database integrity

The implementation is complete and ready for use. The company registration system provides a secure, controlled way for new companies to register while maintaining system integrity and security through the approval workflow.
