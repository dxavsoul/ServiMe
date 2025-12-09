// Enhanced User Management React Hooks

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  EnhancedUsersService, 
  EnhancedAuthService,
  type EnhancedUserCreate,
  type EnhancedUserUpdate,
  type UserProfileUpdate,
  type PasswordChangeRequest,
  type UsersListParams,
  type UserRegistration,
  type LoginRequest,
  type RefreshTokenRequest,
  type LogoutRequest,
} from "../client"

// =============================================================================
// USER APPROVAL STATUS HOOKS
// =============================================================================

/**
 * Hook to get current user's approval status
 */
export function useUserApprovalStatus() {
  return useQuery({
    queryKey: ["currentUser", "approvalStatus"],
    queryFn: () => EnhancedUsersService.getUserApprovalStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.status === 403) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to check if current user is approved (boolean only)
 */
export function useIsUserApproved() {
  const { data: approvalStatus, isLoading, error } = useUserApprovalStatus()
  
  return {
    isApproved: approvalStatus?.approved ?? false,
    isLoading,
    error,
  }
}

// =============================================================================
// CURRENT USER PROFILE HOOKS
// =============================================================================

/**
 * Hook to get current user's enhanced profile
 */
export function useCurrentUserProfile() {
  return useQuery({
    queryKey: ["currentUser", "profile"],
    queryFn: () => EnhancedUsersService.getCurrentUserProfile(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to update current user's profile
 */
export function useUpdateCurrentUserProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UserProfileUpdate) => 
      EnhancedUsersService.updateCurrentUserProfile(data),
    onSuccess: (updatedUser) => {
      // Update both profile and general current user cache
      queryClient.setQueryData(["currentUser", "profile"], updatedUser)
      queryClient.setQueryData(["currentUser"], updatedUser)
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })
}

// =============================================================================
// PASSWORD MANAGEMENT HOOKS
// =============================================================================

/**
 * Hook to change current user's password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: PasswordChangeRequest) => 
      EnhancedUsersService.changePassword(data),
  })
}

// =============================================================================
// ADMIN USER MANAGEMENT HOOKS
// =============================================================================

/**
 * Hook to get paginated list of all users (SuperAdmin only)
 */
export function useAllUsers(params: UsersListParams = {}) {
  return useQuery({
    queryKey: ["users", "list", params],
    queryFn: () => EnhancedUsersService.listAllUsers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook to create a new user (SuperAdmin only)
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: EnhancedUserCreate) => 
      EnhancedUsersService.createUser(data),
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ["users", "list"] })
    },
  })
}

/**
 * Hook to get specific user by ID (SuperAdmin only)
 */
export function useUserById(userId: string, enabled = true) {
  return useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => EnhancedUsersService.getUserById(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to update a specific user (SuperAdmin only)
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: EnhancedUserUpdate }) => 
      EnhancedUsersService.updateUser(userId, data),
    onSuccess: (updatedUser, { userId }) => {
      // Update specific user cache
      queryClient.setQueryData(["users", "detail", userId], updatedUser)
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ["users", "list"] })
    },
  })
}

/**
 * Hook to delete a specific user (SuperAdmin only)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: string) => EnhancedUsersService.deleteUser(userId),
    onSuccess: (_, userId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["users", "detail", userId] })
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ["users", "list"] })
    },
  })
}

// =============================================================================
// AUTHENTICATION HOOKS
// =============================================================================

/**
 * Hook for user registration
 */
export function useRegisterUser() {
  return useMutation({
    mutationFn: (data: UserRegistration) => EnhancedAuthService.registerUser(data),
  })
}

/**
 * Hook for user login
 */
export function useLoginUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: LoginRequest) => EnhancedAuthService.loginUser(data),
    onSuccess: (loginResponse) => {
      // Set the auth token
      EnhancedAuthService.setAuthToken(loginResponse.access_token)
      
      // Cache the user data
      queryClient.setQueryData(["currentUser"], loginResponse.user)
      
      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })
}

/**
 * Hook for token refresh
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: (data: RefreshTokenRequest) => EnhancedAuthService.refreshToken(data),
    onSuccess: (refreshResponse) => {
      // Update the auth token
      EnhancedAuthService.setAuthToken(refreshResponse.access_token)
    },
  })
}

/**
 * Hook for user logout
 */
export function useLogoutUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data?: LogoutRequest) => EnhancedAuthService.logoutUser(data),
    onSuccess: () => {
      // Clear auth token
      EnhancedAuthService.clearAuthToken()
      
      // Clear all cached data
      queryClient.clear()
    },
  })
}

/**
 * Hook to check authentication status
 */
export function useAuthenticationStatus() {
  return useQuery({
    queryKey: ["auth", "status"],
    queryFn: () => EnhancedAuthService.isAuthenticated(),
    staleTime: 60 * 1000, // 1 minute
    retry: false,
  })
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get current user's accessible resources
 */
export function useCurrentUserResources() {
  return useQuery({
    queryKey: ["currentUser", "resources"],
    queryFn: () => EnhancedUsersService.getCurrentUserResources(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to check if current user is SuperAdmin
 */
export function useIsSuperAdmin() {
  const { data: userProfile } = useCurrentUserProfile()
  
  return {
    isSuperAdmin: userProfile?.is_superuser ?? false,
    isLoading: !userProfile,
  }
}

/**
 * Hook to auto-refresh token when needed
 */
export function useAutoRefreshToken() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (refreshToken: string) => 
      EnhancedAuthService.autoRefreshToken(refreshToken),
    onSuccess: (success) => {
      if (success) {
        // Invalidate auth-related queries to refetch with new token
        queryClient.invalidateQueries({ queryKey: ["auth"] })
        queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      }
    },
  })
}
