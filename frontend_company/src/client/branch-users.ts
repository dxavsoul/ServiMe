// Branch Users types - will be replaced by generated types when backend API is available

export interface BranchUserAssign {
  user_id: string
  role: string
  is_company_owner?: boolean
  company_role?: string
  company_access_level?: string
}

export interface BranchUserUpdateRole {
  role: string
  is_company_owner?: boolean
  company_role?: string
  company_access_level?: string
}

export interface BranchUserPublic {
  user_id: string
  branch_id: string
  role: string
  assigned_by?: string
  assigned_at: string
  // Optional: Include user details when fetched with relations
  user?: {
    id: string
    email: string
    is_active: boolean
    is_superuser: boolean
    full_name?: string
  }
}

export interface RemoveUserResponse {
  message: string
}

export interface BranchUsersPublic {
  data: Array<BranchUserPublic>
  count: number
}

// API Data types
export interface BranchUsersGetBranchUsersData {
  branch_id: string
  limit?: number
  skip?: number
}

export interface BranchUsersAssignUserData {
  branch_id: string
  requestBody: BranchUserAssign
}

export interface BranchUsersUpdateRoleData {
  branch_id: string
  user_id: string
  requestBody: BranchUserUpdateRole
}

export interface BranchUsersRemoveUserData {
  branch_id: string
  user_id: string
}
