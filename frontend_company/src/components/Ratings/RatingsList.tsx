import {
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Badge,
  EmptyState,
  Box,
} from "@chakra-ui/react"
import { FiFilter, FiX, FiStar } from "react-icons/fi"
import { useState, useMemo } from "react"
import type { BranchRating } from "@/types/ratings"
import { BranchRatingCard } from "./BranchRatingCard"
import { RatingStars } from "./RatingStars"

interface RatingsListProps {
  ratings: BranchRating[]
  canDelete?: boolean
  canRespond?: boolean
  isLoading?: boolean
  error?: Error | null
}

interface LocalFilters {
  searchTerm: string
  ratingFilter: string
  responseFilter: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

export function RatingsList({ 
  ratings = [], 
  canDelete = false, 
  canRespond = true,
  isLoading = false,
  error = null
}: RatingsListProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    searchTerm: "",
    ratingFilter: "",
    responseFilter: "",
    sortBy: "created_at",
    sortOrder: "desc"
  })

  const filteredAndSortedRatings = useMemo(() => {
    let filtered = ratings

    // Apply search filter
    if (localFilters.searchTerm) {
      const searchLower = localFilters.searchTerm.toLowerCase()
      filtered = filtered.filter(rating =>
        rating.customer_name.toLowerCase().includes(searchLower) ||
        rating.service_name.toLowerCase().includes(searchLower) ||
        rating.comment?.toLowerCase().includes(searchLower) ||
        rating.admin_response?.toLowerCase().includes(searchLower)
      )
    }

    // Apply rating filter
    if (localFilters.ratingFilter) {
      const targetRating = parseInt(localFilters.ratingFilter)
      filtered = filtered.filter(rating => rating.rating === targetRating)
    }

    // Apply response filter
    if (localFilters.responseFilter === "responded") {
      filtered = filtered.filter(rating => !!rating.admin_response)
    } else if (localFilters.responseFilter === "not_responded") {
      filtered = filtered.filter(rating => !rating.admin_response)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (localFilters.sortBy) {
        case "rating":
          aValue = a.rating
          bValue = b.rating
          break
        case "customer_name":
          aValue = a.customer_name
          bValue = b.customer_name
          break
        case "service_name":
          aValue = a.service_name
          bValue = b.service_name
          break
        case "created_at":
        default:
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
      }

      let comparison = 0
      if (aValue < bValue) comparison = -1
      if (aValue > bValue) comparison = 1

      return localFilters.sortOrder === "desc" ? -comparison : comparison
    })

    return filtered
  }, [ratings, localFilters])

  const updateFilter = (key: keyof LocalFilters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setLocalFilters({
      searchTerm: "",
      ratingFilter: "",
      responseFilter: "",
      sortBy: "created_at",
      sortOrder: "desc"
    })
  }

  const hasActiveFilters = localFilters.searchTerm || 
    localFilters.ratingFilter || 
    localFilters.responseFilter

  const getAverageRating = () => {
    if (ratings.length === 0) return 0
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0)
    return sum / ratings.length
  }

  const getRatingDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ratings.forEach(rating => {
      distribution[rating.rating as keyof typeof distribution]++
    })
    return distribution
  }

  if (isLoading) {
    return (
      <VStack gap={4} align="stretch">
        {Array.from({ length: 3 }).map((_, i) => (
          <Box key={i} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
            <Text color="gray.500">Loading rating...</Text>
          </Box>
        ))}
      </VStack>
    )
  }

  if (error) {
    return (
      <Box p={4} border="1px solid" borderColor="red.200" borderRadius="md" bg="red.50">
        <Text color="red.600" fontWeight="medium">
          Error loading ratings: {error.message}
        </Text>
      </Box>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Summary Stats */}
      {ratings.length > 0 && (
        <Box p={4} bg="gray.50" borderRadius="md">
          <HStack justify="space-between" wrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <Text fontSize="sm" color="gray.600">Average Rating</Text>
              <HStack gap={2}>
                <RatingStars rating={getAverageRating()} size="sm" />
                <Text fontSize="sm" color="gray.500">
                  ({ratings.length} reviews)
                </Text>
              </HStack>
            </VStack>
            
            <HStack gap={6} wrap="wrap">
              {Object.entries(getRatingDistribution()).map(([rating, count]) => (
                <VStack key={rating} align="center" gap={1}>
                  <HStack gap={1}>
                    <Text fontSize="sm">{rating}</Text>
                    <FiStar size={12} />
                  </HStack>
                  <Text fontSize="sm" color="gray.600">{count}</Text>
                </VStack>
              ))}
            </HStack>
          </HStack>
        </Box>
      )}

      {/* Filters Section */}
      <VStack gap={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="semibold">
            Customer Reviews ({filteredAndSortedRatings.length})
          </Text>
          <HStack gap={2}>
            {hasActiveFilters && (
              <Badge colorScheme="blue" variant="subtle">
                {Object.values(localFilters).filter(Boolean).length} filters active
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter style={{ marginRight: '8px' }} />
              Filters
            </Button>
          </HStack>
        </HStack>

        {/* Filter Controls */}
        {showFilters && (
          <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
            <VStack gap={4} align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontWeight="medium">Filter Options</Text>
                {hasActiveFilters && (
                  <Button size="sm" variant="ghost" onClick={clearAllFilters}>
                    <FiX style={{ marginRight: '4px' }} />
                    Clear All
                  </Button>
                )}
              </HStack>
              
              <HStack gap={4} wrap="wrap">
                <Box flex="1" minW="200px">
                  <Text fontSize="sm" mb={2}>Search</Text>
                  <Input
                    placeholder="Search customers, services, comments..."
                    value={localFilters.searchTerm}
                    onChange={(e) => updateFilter("searchTerm", e.target.value)}
                    size="sm"
                  />
                </Box>
                
                <Box minW="120px">
                  <Text fontSize="sm" mb={2}>Rating</Text>
                  <select
                    value={localFilters.ratingFilter}
                    onChange={(e) => updateFilter("ratingFilter", e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </Box>
                
                <Box minW="140px">
                  <Text fontSize="sm" mb={2}>Response Status</Text>
                  <select
                    value={localFilters.responseFilter}
                    onChange={(e) => updateFilter("responseFilter", e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">All Reviews</option>
                    <option value="responded">Responded</option>
                    <option value="not_responded">Needs Response</option>
                  </select>
                </Box>
                
                <Box minW="120px">
                  <Text fontSize="sm" mb={2}>Sort By</Text>
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => updateFilter("sortBy", e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px'
                    }}
                  >
                    <option value="created_at">Date</option>
                    <option value="rating">Rating</option>
                    <option value="customer_name">Customer</option>
                    <option value="service_name">Service</option>
                  </select>
                </Box>
                
                <Box minW="100px">
                  <Text fontSize="sm" mb={2}>Order</Text>
                  <select
                    value={localFilters.sortOrder}
                    onChange={(e) => updateFilter("sortOrder", e.target.value as "asc" | "desc")}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px'
                    }}
                  >
                    <option value="desc">Newest</option>
                    <option value="asc">Oldest</option>
                  </select>
                </Box>
              </HStack>
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Ratings List */}
      {filteredAndSortedRatings.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <FiStar />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title>
                {hasActiveFilters ? "No ratings match your filters" : "No ratings yet"}
              </EmptyState.Title>
              <EmptyState.Description>
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more results"
                  : "Customer ratings will appear here once they start leaving reviews"
                }
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <VStack gap={4} align="stretch">
          {filteredAndSortedRatings.map((rating) => (
            <BranchRatingCard
              key={rating.id}
              rating={rating}
              canDelete={canDelete}
              canRespond={canRespond}
            />
          ))}
        </VStack>
      )}
    </VStack>
  )
}
