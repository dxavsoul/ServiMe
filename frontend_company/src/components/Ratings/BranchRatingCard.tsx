import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Textarea,
} from "@chakra-ui/react"
import { FiThumbsUp, FiTrash2, FiMessageSquare } from "react-icons/fi"
import { useState } from "react"
import type { BranchRating } from "@/types/ratings"
import { RatingStars } from "./RatingStars"

interface BranchRatingCardProps {
  rating: BranchRating
  canDelete?: boolean
  canRespond?: boolean
  onDelete?: (id: string) => void
  onRespond?: (id: string, response: string) => void
}

export const BranchRatingCard = ({
  rating,
  canDelete = false,
  canRespond = false,
  onDelete,
  onRespond,
}: BranchRatingCardProps) => {
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseText, setResponseText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !onRespond) return

    setIsSubmitting(true)
    try {
      await onRespond(rating.id, responseText)
      setResponseText("")
      setShowResponseForm(false)
    } catch (error) {
      console.error("Failed to submit response:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Box
      p={4}
      borderWidth={1}
      borderRadius="md"
      bg="white"
      shadow="sm"
      _hover={{ shadow: "md" }}
      transition="shadow 0.2s"
    >
      <VStack align="stretch" gap={3}>
        {/* Header */}
        <HStack justify="space-between" align="flex-start">
          <VStack align="start" gap={1}>
            <HStack gap={2}>
              <RatingStars rating={rating.rating} size="sm" />
              <Text fontSize="sm" color="gray.600">
                {rating.rating}/5
              </Text>
            </HStack>
            <Text fontSize="xs" color="gray.500">
              {formatDate(rating.created_at)}
            </Text>
          </VStack>
          
          <HStack gap={2}>
            {rating.would_recommend && (
              <Badge colorScheme="green" size="sm">
                <HStack gap={1}>
                  <FiThumbsUp size={10} />
                  <Text>Recommends</Text>
                </HStack>
              </Badge>
            )}
            {canDelete && (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={() => onDelete?.(rating.id)}
              >
                <FiTrash2 />
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Comment */}
        {rating.comment && (
          <Text fontSize="sm" color="gray.700">
            {rating.comment}
          </Text>
        )}

        {/* Detailed Ratings */}
        <VStack align="stretch" gap={2}>
          <Text fontSize="xs" fontWeight="semibold" color="gray.600">
            Detailed Ratings:
          </Text>
          <Box pl={2}>
            <HStack justify="space-between">
              <Text fontSize="xs">Service Quality:</Text>
              <RatingStars rating={rating.service_quality || 0} size="sm" />
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs">Staff Friendliness:</Text>
              <RatingStars rating={rating.staff_friendliness || 0} size="sm" />
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs">Facility Cleanliness:</Text>
              <RatingStars rating={rating.facility_cleanliness || 0} size="sm" />
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs">Wait Time Satisfaction:</Text>
              <RatingStars rating={rating.wait_time_satisfaction || 0} size="sm" />
            </HStack>
          </Box>
        </VStack>

        {/* Admin Response */}
        {rating.admin_response && (
          <Box
            p={3}
            bg="blue.50"
            borderRadius="md"
            borderLeft="4px solid"
            borderColor="blue.400"
          >
            <Text fontSize="xs" fontWeight="semibold" color="blue.700" mb={1}>
              Admin Response:
            </Text>
            <Text fontSize="sm" color="blue.600">
              {rating.admin_response}
            </Text>
          </Box>
        )}

        {/* Response Form */}
        {canRespond && !rating.admin_response && (
          <VStack align="stretch" gap={2}>
            {!showResponseForm ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowResponseForm(true)}
              >
                <HStack gap={2}>
                  <FiMessageSquare />
                  <Text>Respond to Rating</Text>
                </HStack>
              </Button>
            ) : (
              <>
                <Textarea
                  placeholder="Write your response to this rating..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  size="sm"
                  resize="vertical"
                  minH={20}
                />
                <HStack gap={2}>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={handleSubmitResponse}
                    loading={isSubmitting}
                    disabled={!responseText.trim()}
                  >
                    Submit Response
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowResponseForm(false)
                      setResponseText("")
                    }}
                  >
                    Cancel
                  </Button>
                </HStack>
              </>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  )
}
