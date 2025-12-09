import { 
  Container, 
  Heading, 
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Box,
} from "@chakra-ui/react"
import { FiStar, FiRefreshCw } from "react-icons/fi"
import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { RatingsList } from "@/components/Ratings/RatingsList"
import type { BranchRating } from "@/types/ratings"

// For now, we'll use mock data since the types are not yet integrated
const mockRatings: BranchRating[] = [
  {
    id: "1",
    rating: 5,
    comment: "Excellent service! The staff was very professional and helpful.",
    service_quality: 5,
    staff_friendliness: 5,
    facility_cleanliness: 4,
    wait_time_satisfaction: 4,
    would_recommend: true,
    admin_response: "Thank you for your excellent feedback!",
    responded_by: "admin1",
    responded_at: "2025-08-09T21:00:00.000Z",
    branch_id: "branch1",
    customer_id: "customer1",
    service_request_id: "service1",
    created_at: "2025-08-09T20:30:00.000Z",
    updated_at: "2025-08-09T21:00:00.000Z",
    customer_name: "John Doe",
    service_name: "Premium Car Wash",
    responder_name: "Admin Smith"
  },
  {
    id: "2",
    rating: 3,
    comment: "Service was okay but the wait time was longer than expected.",
    service_quality: 3,
    staff_friendliness: 4,
    facility_cleanliness: 4,
    wait_time_satisfaction: 2,
    would_recommend: false,
    admin_response: undefined,
    responded_by: undefined,
    responded_at: undefined,
    branch_id: "branch1",
    customer_id: "customer2",
    service_request_id: "service2",
    created_at: "2025-08-09T19:15:00.000Z",
    updated_at: undefined,
    customer_name: "Jane Smith",
    service_name: "Basic Car Wash",
    responder_name: undefined
  }
]

export const Route = createFileRoute("/_layout/ratings/")({
  component: Ratings,
})

function Ratings() {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // For demo purposes, we'll use mock data
  // In real implementation, you would use:
  // const { data: ratingsData, isLoading, error, refetch } = useBranchRatings(selectedBranch || "", {})
  
  const isLoading = false
  const error = null
  const ratingsData = { data: mockRatings, count: mockRatings.length }

  const handleRefresh = () => {
    // refetch()
    console.log("Refreshing ratings...")
  }

  const getUnrespondedCount = () => {
    return ratingsData?.data?.filter(rating => !rating.admin_response).length || 0
  }

  const getTabData = () => {
    const allRatings = ratingsData?.data || []
    
    switch (activeTab) {
      case "pending":
        return allRatings.filter(rating => !rating.admin_response)
      case "responded":
        return allRatings.filter(rating => !!rating.admin_response)
      case "low_ratings":
        return allRatings.filter(rating => rating.rating <= 2)
      default:
        return allRatings
    }
  }

  return (
    <Container maxW="full" py={8}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <VStack align="start" gap={2}>
          <HStack justify="space-between" w="full">
            <HStack gap={3}>
              <FiStar size={24} />
              <Heading size="lg">Ratings & Reviews</Heading>
            </HStack>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              loading={isLoading}
            >
              <FiRefreshCw style={{ marginRight: '8px' }} />
              Refresh
            </Button>
          </HStack>
          <Text color="gray.600">
            Manage customer feedback and responses across all branches
          </Text>
        </VStack>

        {/* Branch Selection */}
        <Box>
          <Text fontSize="sm" mb={2} fontWeight="medium">
            Select Branch:
          </Text>
          <HStack gap={2} wrap="wrap">
            <Button
              size="sm"
              variant={selectedBranch === null ? "solid" : "outline"}
              onClick={() => setSelectedBranch(null)}
            >
              All Branches
            </Button>
            {/* In real implementation, map through available branches */}
            <Button
              size="sm"
              variant={selectedBranch === "branch1" ? "solid" : "outline"}
              onClick={() => setSelectedBranch("branch1")}
            >
              Downtown Branch
            </Button>
            <Button
              size="sm"
              variant={selectedBranch === "branch2" ? "solid" : "outline"}
              onClick={() => setSelectedBranch("branch2")}
            >
              Uptown Branch
            </Button>
          </HStack>
        </Box>

        {/* Tabs */}
        <Box>
          <HStack gap={1} mb={4}>
            <Button
              size="sm"
              variant={activeTab === "all" ? "solid" : "ghost"}
              onClick={() => setActiveTab("all")}
            >
              All Reviews
              <Badge ml={2} colorScheme="gray" size="sm">
                {ratingsData?.count || 0}
              </Badge>
            </Button>
            <Button
              size="sm"
              variant={activeTab === "pending" ? "solid" : "ghost"}
              onClick={() => setActiveTab("pending")}
            >
              Needs Response
              <Badge ml={2} colorScheme="orange" size="sm">
                {getUnrespondedCount()}
              </Badge>
            </Button>
            <Button
              size="sm"
              variant={activeTab === "responded" ? "solid" : "ghost"}
              onClick={() => setActiveTab("responded")}
            >
              Responded
            </Button>
            <Button
              size="sm"
              variant={activeTab === "low_ratings" ? "solid" : "ghost"}
              onClick={() => setActiveTab("low_ratings")}
            >
              Low Ratings (≤2★)
              <Badge ml={2} colorScheme="red" size="sm">
                {ratingsData?.data?.filter(r => r.rating <= 2).length || 0}
              </Badge>
            </Button>
          </HStack>

          {/* Content */}
          <RatingsList
            ratings={getTabData()}
            canDelete={true} // This should be based on user permissions
            canRespond={true}
            isLoading={isLoading}
            error={error}
          />
        </Box>
      </VStack>
    </Container>
  )
}
