# Branch Users Management

This module provides comprehensive user management for branches, allowing you to assign users to branches with specific roles and manage their permissions.

## API Endpoints

The branch users functionality is built around the following API endpoints:

### Assign User to Branch
- **POST** `/api/v1/branch-users/{branch_id}/assign`
- **Request Body:**
  ```json
  {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "manager"
  }
  ```

### Update User Role
- **PUT** `/api/v1/branch-users/{branch_id}/update-role/{user_id}`
- **Request Body:**
  ```json
  {
    "role": "admin"
  }
  ```

### Get Branch Users
- **GET** `/api/v1/branch-users/{branch_id}`
- **Query Parameters:**
  - `skip`: Number of records to skip (for pagination)
  - `limit`: Maximum number of records to return

### Remove User from Branch
- **DELETE** `/api/v1/branch-users/{branch_id}/remove/{user_id}`

## Components

### 1. AssignUserToBranch
A dialog component that allows administrators to assign users to a branch with a specific role.

**Features:**
- User selection dropdown with all available users
- Role selection (Employee, Manager, Admin)
- Form validation
- Integration with TanStack Query for data fetching

**Usage:**
```tsx
<AssignUserToBranch 
  branchId="branch-uuid" 
  branchName="Main Branch" 
/>
```

### 2. UpdateUserRole
A dialog component for updating the role of a user already assigned to a branch.

**Features:**
- Pre-populated with current role
- Role selection dropdown
- Confirmation and success feedback

**Usage:**
```tsx
<UpdateUserRole
  branchId="branch-uuid"
  userId="user-uuid"
  currentRole="employee"
  userName="John Doe"
  branchName="Main Branch"
/>
```

### 3. RemoveUserFromBranch
A confirmation dialog for removing a user from a branch.

**Features:**
- Confirmation dialog with user and branch information
- Permanent action warning
- Clean removal from branch access

**Usage:**
```tsx
<RemoveUserFromBranch
  branchId="branch-uuid"
  userId="user-uuid"
  userName="John Doe"
  branchName="Main Branch"
/>
```

### 4. BranchUserActionsMenu
A dropdown menu that provides quick access to user management actions.

**Features:**
- Update role action
- Remove user action
- Compact design for table integration

### 5. ManageBranchUsers
A comprehensive modal dialog for managing all users in a branch.

**Features:**
- User assignment functionality
- User list with roles and details
- Inline actions for each user
- Pagination for large user lists
- Integration with existing branch actions menu

**Access:** Available through the three-dot menu in the branches table

## User Roles

The system supports three user roles for branch assignments:

1. **Employee** - Basic access level
2. **Manager** - Intermediate access level  
3. **Admin** - Full access level

## Data Flow

1. **Assignment**: When a user is assigned to a branch, a `BranchUserPublic` record is created linking the user, branch, and role.

2. **Role Updates**: Role changes are tracked and immediately reflected in the UI through query invalidation.

3. **Removal**: User removal from a branch is permanent and removes all associated permissions.

## Types

### BranchUserAssign
```typescript
interface BranchUserAssign {
  user_id: string
  role: string
}
```

### BranchUserUpdateRole
```typescript
interface BranchUserUpdateRole {
  role: string
}
```

### BranchUserPublic
```typescript
interface BranchUserPublic {
  id: string
  branch_id: string
  user_id: string
  role: string
  created_at?: string
  updated_at?: string
  user?: {
    id: string
    email: string
    full_name?: string
  }
  branch?: {
    id: string
    name: string
  }
}
```

## Integration

The branch users functionality is seamlessly integrated into the existing branches interface:

1. **Branch Table**: Each branch has a "Manage Users" option in its actions menu
2. **Modal Interface**: User management opens in a modal overlay for focused interaction
3. **Real-time Updates**: All changes are immediately reflected through TanStack Query cache invalidation
4. **Error Handling**: Comprehensive error handling with user-friendly messages

## Future Enhancements

When the backend API is implemented:

1. Replace temporary service files with auto-generated client code
2. Add user permission validation based on roles
3. Implement role-based access control for different actions
4. Add audit logging for user assignments and role changes
5. Consider role hierarchy and inheritance

## Notes

- All components follow the established patterns used in Companies and Branches modules
- Form validation ensures data integrity before API calls
- Responsive design works on both desktop and mobile devices
- Components are fully typed with TypeScript for type safety
