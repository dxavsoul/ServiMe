# Companies Components

This directory contains React components for managing companies in the application. The components are built using Chakra UI and follow the same patterns as the existing Items components.

## ✅ API Integration Complete

The components now use **real API services** that follow the same pattern as the existing ItemsService. The mock services have been replaced with proper API calls.

## Components

### AddCompany
A modal dialog component for creating new companies with a comprehensive form including:
- Company Name (required)
- Description
- Industry
- Website (with URL validation)
- Email (with email validation)
- Phone
- Address
- City
- Country

**API Integration**: Uses `CompaniesService.createCompany()` with proper error handling and query invalidation.

### EditCompany
A modal dialog component for editing existing companies. Pre-populates the form with existing company data and supports partial updates.

**API Integration**: Uses `CompaniesService.updateCompany()` with the company ID and partial updates.

### DeleteCompany
A confirmation dialog for deleting companies with a clear warning message.

**API Integration**: Uses `CompaniesService.deleteCompany()` with proper cleanup and query invalidation.

### CompanyActionsMenu
A dropdown menu component that provides quick access to edit and delete actions for a company row.

### CompaniesDemo
A demonstration component that shows how to use all the company components together with mock data. Includes:
- A companies management interface
- Table display with company information
- Add/Edit/Delete functionality
- Empty state handling

### Companies Route (NEW)
A full-featured route component at `/companies` that includes:
- Pagination support
- API integration with loading states
- Empty state handling
- Real-time data fetching and caching

## API Service

### CompaniesService
```typescript
class CompaniesService {
  static readCompanies(data?: { skip?: number; limit?: number })
  static createCompany(data: { requestBody: CompanyCreate })
  static readCompany(data: { id: string })
  static updateCompany(data: { id: string; requestBody: CompanyUpdate })
  static deleteCompany(data: { id: string })
}
```

**Endpoints**:
- `GET /api/v1/companies/` - List companies with pagination
- `POST /api/v1/companies/` - Create new company
- `GET /api/v1/companies/{id}` - Get company by ID
- `PUT /api/v1/companies/{id}` - Update company
- `DELETE /api/v1/companies/{id}` - Delete company

## Types

All types are now imported from the generated client:

### CompanyCreate
```typescript
interface CompanyCreate {
  name: string
  description?: string | null
  industry?: string | null
  website?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
}
```

### CompanyPublic
Extends CompanyCreate with additional fields:
```typescript
interface CompanyPublic extends CompanyCreate {
  id: string
  owner_id?: string
  created_at?: string
  updated_at?: string
}
```

### CompanyUpdate
Partial version of CompanyCreate for updates.

## Usage

```tsx
import { 
  AddCompany, 
  EditCompany, 
  DeleteCompany, 
  CompanyActionsMenu,
  CompaniesDemo 
} from '@/components/Companies'

// Use individual components
<AddCompany />
<EditCompany company={companyData} />
<DeleteCompany company={companyData} />
<CompanyActionsMenu company={companyData} />

// Or use the complete demo
<CompaniesDemo />
```

## Navigation

The Companies page is accessible via:
- Sidebar navigation: "Companies" link
- Direct route: `/companies`
- The route includes pagination and follows the same UX patterns as the Items page

## Backend Integration Status

✅ **Frontend Ready**: All components are production-ready and use proper API service calls
⏳ **Backend Needed**: The backend API endpoints need to be implemented

When the backend is ready:
1. The frontend will work seamlessly without any code changes
2. Remove the temporary `companies.ts` and `companies-service.ts` files
3. The auto-generated client will include the real Company types and services

## Error Handling

- Network errors are handled gracefully with user-friendly messages
- Form validation prevents invalid data submission
- Loading states provide clear feedback during API calls
- Query invalidation ensures data consistency across components

## Form Validation

- Company name is required
- Website URLs must start with http:// or https://
- Email addresses must be valid email format
- All other fields are optional

## Responsive Design

All components are responsive and work well on both desktop and mobile devices using Chakra UI's responsive breakpoint system.
