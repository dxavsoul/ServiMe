# Branches Components

This directory contains React components for managing company branches in the application. **Branches are associated with companies** - each branch must belong to a company. The components are built using Chakra UI and follow the same patterns as the existing Items and Companies components.

## ✅ API Integration Complete

The components use **real API services** that follow the same pattern as the existing ItemsService and CompaniesService. No mock services are used.

## 🏢 Company Relationship

**Important**: Branches are not standalone entities. They must be associated with a company:
- When creating a branch, you must select a company from a dropdown
- Each branch belongs to exactly one company
- The API supports filtering branches by company
- Branch listings show the parent company information

## Components

### AddBranch
A modal dialog component for creating new branches with a comprehensive form including:
- **Company Selection (required)** - Dropdown list of available companies
- Branch Name (required)
- Description
- Industry
- Website (with URL validation)
- Email (with email validation)
- Phone
- Address
- City
- Country

**API Integration**: Uses `BranchesService.createBranch()` with proper error handling and query invalidation.

### EditBranch
A modal dialog component for editing existing branches. Pre-populates the form with existing branch data including the company assignment and supports partial updates.

**API Integration**: Uses `BranchesService.updateBranch()` with the branch ID and partial updates.

### DeleteBranch
A confirmation dialog for deleting branches with a clear warning message.

**API Integration**: Uses `BranchesService.deleteBranch()` with proper cleanup and query invalidation.

### BranchActionsMenu
A dropdown menu component that provides quick access to edit and delete actions for a branch row.

### BranchesDemo
A demonstration component that shows how to use all the branch components together with mock data. Includes:
- A branches management interface
- Table display with branch and company information
- Add/Edit/Delete functionality
- Empty state handling

### Branches Route
A full-featured route component at `/branches` that includes:
- Pagination support
- API integration with loading states
- Empty state handling
- Real-time data fetching and caching
- Company information display

## API Service

### BranchesService
```typescript
class BranchesService {
  static readBranches(data?: { skip?: number; limit?: number; company_id?: string })
  static createBranch(data: { requestBody: BranchCreate })
  static readBranch(data: { id: string })
  static updateBranch(data: { id: string; requestBody: BranchUpdate })
  static deleteBranch(data: { id: string })
}
```

**Endpoints**:
- `GET /api/v1/branches/` - List branches with pagination and optional company filter
- `POST /api/v1/branches/` - Create new branch (requires company_id)
- `GET /api/v1/branches/{id}` - Get branch by ID
- `PUT /api/v1/branches/{id}` - Update branch
- `DELETE /api/v1/branches/{id}` - Delete branch

## Types

All types are imported from the generated client:

### BranchCreate
```typescript
interface BranchCreate {
  name: string
  company_id: string // Required: Branch must belong to a company
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

### BranchPublic
Extends BranchCreate with additional fields:
```typescript
interface BranchPublic extends BranchCreate {
  id: string
  owner_id?: string
  created_at?: string
  updated_at?: string
  // Optional: Include company details when fetched with relations
  company?: {
    id: string
    name: string
  }
}
```

### BranchUpdate
Partial version of BranchCreate for updates, including company reassignment:
```typescript
interface BranchUpdate extends Partial<BranchCreate> {
  company_id?: string // Allow updating the company assignment
}
```

## Usage

```tsx
import { 
  AddBranch, 
  EditBranch, 
  DeleteBranch, 
  BranchActionsMenu,
  BranchesDemo 
} from '@/components/Branches'

// Use individual components
<AddBranch />
<EditBranch branch={branchData} />
<DeleteBranch branch={branchData} />
<BranchActionsMenu branch={branchData} />

// Or use the complete demo
<BranchesDemo />
```

## Navigation

The Branches page can be accessed via:
- Sidebar navigation: "Branches" link (📍 MapPin icon)
- Direct route: `/branches`
- The route includes pagination and follows the same UX patterns as the Items and Companies pages

## Mock Data Structure

The demo uses sample branch data that shows the company relationship:
```json
{
  "name": "Tech Corp Downtown",
  "company_id": "company-1",
  "description": "Main downtown technology branch",
  "industry": "Technology",
  "website": "https://techcorp.com/downtown",
  "email": "downtown@techcorp.com",
  "phone": "+1234567890",
  "address": "123 Tech Street",
  "city": "San Francisco",
  "country": "USA",
  "company": {
    "id": "company-1",
    "name": "Tech Corp"
  }
}
```

## Backend Integration Status

✅ **Frontend Ready**: All components are production-ready and use proper API service calls
⏳ **Backend Needed**: The backend API endpoints need to be implemented

When the backend is ready:
1. The frontend will work seamlessly without any code changes
2. Remove the temporary `branches.ts` and `branches-service.ts` files
3. The auto-generated client will include the real Branch types and services
4. Ensure the backend supports the company relationship and filtering

## Error Handling

- Network errors are handled gracefully with user-friendly messages
- Form validation prevents invalid data submission
- Loading states provide clear feedback during API calls
- Query invalidation ensures data consistency across components
- Company selection validation ensures branches are always associated with a company

## Form Validation

- Branch name is required
- Company selection is required
- Website URLs must start with http:// or https://
- Email addresses must be valid email format
- All other fields are optional

## Responsive Design

All components are responsive and work well on both desktop and mobile devices using Chakra UI's responsive breakpoint system.

## Company-Branch Relationship

Branches are designed as dependent entities of companies:
- **One-to-Many**: One company can have many branches
- **Required Relationship**: Every branch must belong to a company
- **Filtering Support**: API supports filtering branches by company_id
- **Display Integration**: Branch listings show parent company information
- **Cascading Operations**: Consider what happens to branches when a company is deleted (backend design decision)
