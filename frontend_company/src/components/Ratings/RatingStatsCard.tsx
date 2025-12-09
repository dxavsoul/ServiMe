import {
  Box,
  VStack,
  HStack,
  Text,
  Flex,
} from "@chakra-ui/react"
import { FiStar, FiThumbsUp, FiTrendingUp } from "react-icons/fi"
import type { RatingStatistics } from "../../types/ratings"
import { RatingStars } from "./RatingStars"

interface RatingStatsCardProps {
  stats: RatingStatistics
  title?: string
}

export function RatingStatsCard({ stats, title = "Rating Overview" }: RatingStatsCardProps) {
  const getPercentage = (count: number) => {
    return stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "green"
    if (rating >= 3) return "yellow"
    return "red"
  }

  return (
    <Box
      p={6}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="lg"
      bg="white"
      shadow="sm"
    >
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="semibold">
            {title}
          </Text>
          <HStack gap={2}>
            <FiStar size={16} />
            <Text fontSize="sm" color="gray.500">
              {stats.total_ratings} reviews
            </Text>
          </HStack>
        </HStack>

        {/* Average Rating */}
        <VStack align="center" gap={2}>
          <Text fontSize="3xl" fontWeight="bold" color={`${getRatingColor(stats.average_rating)}.500`}>
            {stats.average_rating.toFixed(1)}
          </Text>
          <RatingStars 
            rating={stats.average_rating} 
            size="lg" 
            showValue={false}
            color={`${getRatingColor(stats.average_rating)}.400`}
          />
          <Text fontSize="sm" color="gray.600">
            Average Rating
          </Text>
        </VStack>

        {/* Rating Distribution */}
        <VStack align="stretch" gap={3}>
          <Text fontSize="md" fontWeight="medium">
            Rating Distribution
          </Text>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.rating_distribution[rating.toString() as keyof typeof stats.rating_distribution]
            const percentage = getPercentage(count)
            
            return (
              <HStack key={rating} gap={3}>
                <HStack gap={1} minW="60px">
                  <Text fontSize="sm">{rating}</Text>
                  <FiStar size={12} />
                </HStack>
                <Box flex="1">
                  <Box
                    bg="gray.200"
                    borderRadius="full"
                    h="8px"
                    overflow="hidden"
                  >
                    <Box
                      bg={`${getRatingColor(rating)}.400`}
                      h="100%"
                      borderRadius="full"
                      width={`${percentage}%`}
                      transition="width 0.2s"
                    />
                  </Box>
                </Box>
                <Text fontSize="sm" color="gray.600" minW="40px" textAlign="right">
                  {count}
                </Text>
              </HStack>
            )
          })}
        </VStack>

        {/* Detailed Metrics */}
        {(stats.average_service_quality || stats.average_staff_friendliness || 
          stats.average_facility_cleanliness || stats.average_wait_time_satisfaction) && (
          <VStack align="stretch" gap={3}>
            <Text fontSize="md" fontWeight="medium">
              Detailed Metrics
            </Text>
            <VStack align="stretch" gap={2}>
              {stats.average_service_quality && (
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.600">Service Quality</Text>
                  <HStack gap={2}>
                    <RatingStars 
                      rating={stats.average_service_quality} 
                      size="sm" 
                      showValue={false}
                    />
                    <Text fontSize="sm" fontWeight="medium">
                      {stats.average_service_quality.toFixed(1)}
                    </Text>
                  </HStack>
                </Flex>
              )}
              
              {stats.average_staff_friendliness && (
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.600">Staff Friendliness</Text>
                  <HStack gap={2}>
                    <RatingStars 
                      rating={stats.average_staff_friendliness} 
                      size="sm" 
                      showValue={false}
                    />
                    <Text fontSize="sm" fontWeight="medium">
                      {stats.average_staff_friendliness.toFixed(1)}
                    </Text>
                  </HStack>
                </Flex>
              )}
              
              {stats.average_facility_cleanliness && (
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.600">Facility Cleanliness</Text>
                  <HStack gap={2}>
                    <RatingStars 
                      rating={stats.average_facility_cleanliness} 
                      size="sm" 
                      showValue={false}
                    />
                    <Text fontSize="sm" fontWeight="medium">
                      {stats.average_facility_cleanliness.toFixed(1)}
                    </Text>
                  </HStack>
                </Flex>
              )}
              
              {stats.average_wait_time_satisfaction && (
                <Flex justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.600">Wait Time Satisfaction</Text>
                  <HStack gap={2}>
                    <RatingStars 
                      rating={stats.average_wait_time_satisfaction} 
                      size="sm" 
                      showValue={false}
                    />
                    <Text fontSize="sm" fontWeight="medium">
                      {stats.average_wait_time_satisfaction.toFixed(1)}
                    </Text>
                  </HStack>
                </Flex>
              )}
            </VStack>
          </VStack>
        )}

        {/* Recommendation Rate */}
        {stats.recommendation_percentage !== undefined && stats.recommendation_percentage !== null && (
          <VStack align="stretch" gap={2}>
            <HStack justify="space-between" align="center">
              <HStack gap={2}>
                <FiThumbsUp size={16} />
                <Text fontSize="md" fontWeight="medium">
                  Would Recommend
                </Text>
              </HStack>
              <Text fontSize="lg" fontWeight="bold" color="green.500">
                {stats.recommendation_percentage.toFixed(1)}%
              </Text>
            </HStack>
            <Box
              bg="gray.200"
              borderRadius="full"
              h="8px"
              overflow="hidden"
            >
              <Box
                bg="green.400"
                h="100%"
                borderRadius="full"
                width={`${stats.recommendation_percentage}%`}
                transition="width 0.2s"
              />
            </Box>
          </VStack>
        )}

        {/* Trends Indicator */}
        <HStack justify="center" gap={2} pt={2} borderTop="1px solid" borderColor="gray.100">
          <FiTrendingUp size={14} />
          <Text fontSize="xs" color="gray.500">
            Based on {stats.total_ratings} customer reviews
          </Text>
        </HStack>
      </VStack>
    </Box>
  )
}
