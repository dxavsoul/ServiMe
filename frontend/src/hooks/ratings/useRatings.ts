import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BranchRatingsService } from "@/client/branch-ratings-service"
import type { RatingFilters, AdminResponseRequest } from "@/types/ratings"
import useCustomToast from "@/hooks/useCustomToast"

// Query keys
export const RATING_QUERY_KEYS = {
  branchRatings: (branchId: string, filters?: RatingFilters) => 
    ["ratings", "branch", branchId, filters],
  branchWithRatings: (branchId: string) => 
    ["ratings", "branch", branchId, "with-stats"],
  branchesRatingStats: (branchIds: string[]) => 
    ["ratings", "branches", "stats", branchIds],
} as const

/**
 * Hook to fetch ratings for a specific branch
 */
export function useBranchRatings(branchId: string, filters: RatingFilters = {}) {
  return useQuery({
    queryKey: RATING_QUERY_KEYS.branchRatings(branchId, filters),
    queryFn: () => BranchRatingsService.getBranchRatings(branchId, filters),
    enabled: !!branchId,
  })
}

/**
 * Hook to fetch branch details with rating statistics
 */
export function useBranchWithRatings(branchId: string) {
  return useQuery({
    queryKey: RATING_QUERY_KEYS.branchWithRatings(branchId),
    queryFn: () => BranchRatingsService.getBranchWithRatings(branchId),
    enabled: !!branchId,
  })
}

/**
 * Hook to fetch rating statistics for multiple branches
 */
export function useBranchesRatingStats(branchIds: string[]) {
  return useQuery({
    queryKey: RATING_QUERY_KEYS.branchesRatingStats(branchIds),
    queryFn: () => BranchRatingsService.getBranchesRatingStats(branchIds),
    enabled: branchIds.length > 0,
  })
}

/**
 * Hook to respond to a customer rating
 */
export function useRespondToRating() {
  const queryClient = useQueryClient()
  const toast = useCustomToast()

  return useMutation({
    mutationFn: ({ 
      branchId, 
      ratingId, 
      response 
    }: { 
      branchId: string
      ratingId: string
      response: AdminResponseRequest 
    }) => 
      BranchRatingsService.respondToRating(branchId, ratingId, response),
    onSuccess: (_, variables) => {
      toast.showSuccessToast("Response added successfully")
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["ratings", "branch", variables.branchId]
      })
    },
    onError: (error: any) => {
      const message = error?.body?.detail || "Failed to add response"
      toast.showErrorToast(message)
    },
  })
}

/**
 * Hook to delete a rating (SuperAdmin only)
 */
export function useDeleteRating() {
  const queryClient = useQueryClient()
  const toast = useCustomToast()

  return useMutation({
    mutationFn: ({ 
      branchId, 
      ratingId 
    }: { 
      branchId: string
      ratingId: string 
    }) => 
      BranchRatingsService.deleteRating(branchId, ratingId),
    onSuccess: (_, variables) => {
      toast.showSuccessToast("Rating deleted successfully")
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["ratings", "branch", variables.branchId]
      })
    },
    onError: (error: any) => {
      const message = error?.body?.detail || "Failed to delete rating"
      toast.showErrorToast(message)
    },
  })
}
