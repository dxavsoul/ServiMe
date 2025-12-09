// Enhanced User Management Types and Interfaces

// =============================================================================
// APPROVAL STATUS TYPES
// =============================================================================

export interface UserApprovalStatus {
  approved: boolean
  is_superuser: boolean
  message: string
  assigned_companies: string[]
  assigned_branches: string[]
  user_id: string
  total_companies_access: number | "ALL"
  total_branches_access: number | "ALL"
}

// =============================================================================
// ENHANCED USER PROFILE TYPES
// =============================================================================

export interface UserProfile {
  department?: string
  position?: string
  phone?: string
  timezone?: string
}

export interface EnhancedUserPublic {
  id: string
  email: string
  full_name?: string | null
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at?: string
  last_login?: string | null
  profile?: UserProfile
}

export interface EnhancedUserDetailed extends EnhancedUserPublic {
  assignments?: {
    companies: Array<{
      id: string
      name: string
      role: string
    }>
    branches: Array<{
      id: string
      name: string
      company_name: string
      role: string
    }>
  }
}

export interface EnhancedUsersList {
  data: EnhancedUserPublic[]
  count: number
  total: number
  skip: number
  limit: number
}

// =============================================================================
// USER CREATION AND UPDATE TYPES
// =============================================================================

export interface EnhancedUserCreate {
  email: string
  password: string
  full_name: string
  is_active?: boolean
  is_superuser?: boolean
  profile?: UserProfile
}

export interface EnhancedUserUpdate {
  email?: string
  full_name?: string
  is_active?: boolean
  is_superuser?: boolean
  profile?: UserProfile
}

export interface UserProfileUpdate {
  full_name?: string
  email?: string
  profile?: UserProfile
}

// =============================================================================
// PASSWORD MANAGEMENT TYPES
// =============================================================================

export interface PasswordChangeRequest {
  current_password: string
  new_password: string
  confirm_new_password: string
}

export interface PasswordChangeResponse {
  message: string
  timestamp: string
  requires_reauth: boolean
}

// =============================================================================
// AUTHENTICATION TYPES
// =============================================================================

export interface UserRegistration {
  email: string
  password: string
  full_name: string
  confirm_password: string
  terms_accepted: boolean
}

export interface UserRegistrationResponse {
  id: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  message: string
  approval_status: "pending" | "approved" | "rejected"
}

export interface LoginRequest {
  username: string
  password: string
  remember_me?: boolean
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: {
    id: string
    email: string
    full_name?: string | null
    is_superuser: boolean
    approval_status: "pending" | "approved" | "rejected"
  }
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface LogoutRequest {
  logout_all_devices?: boolean
}

export interface LogoutResponse {
  message: string
  logged_out_at: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiError {
  detail: string
  error_code?: string
  status_code: number
}

export interface ApiMessage {
  message: string
  timestamp?: string
}

export interface UserDeletionResponse {
  message: string
  deleted_user_id: string
  deleted_at: string
  deleted_by: string
}

// =============================================================================
// QUERY PARAMETERS TYPES
// =============================================================================

export interface UsersListParams {
  skip?: number
  limit?: number
  is_active?: boolean
  is_superuser?: boolean
  search?: string
}

// =============================================================================
// UTILITY TYPES FOR FORM DATA
// =============================================================================

export interface FormLoginData {
  [key: string]: unknown
  username: string
  password: string
}
