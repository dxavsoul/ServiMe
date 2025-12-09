import { HStack, Icon, Text } from "@chakra-ui/react"
import { FiStar } from "react-icons/fi"
import { FaStar } from "react-icons/fa"

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  color?: string
  readOnly?: boolean
  onChange?: (rating: number) => void
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  showValue = true,
  color = "yellow.400",
  readOnly = true,
  onChange,
}: RatingStarsProps) {
  const getStarSize = () => {
    switch (size) {
      case "sm":
        return 16
      case "lg":
        return 24
      default:
        return 20
    }
  }

  const handleStarClick = (starRating: number) => {
    if (!readOnly && onChange) {
      onChange(starRating)
    }
  }

  return (
    <HStack gap={1} align="center">
      <HStack gap={0.5}>
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= rating
          
          return (
            <Icon
              key={index}
              as={isFilled ? FaStar : FiStar}
              color={isFilled ? color : "gray.300"}
              boxSize={getStarSize()}
              cursor={readOnly ? "default" : "pointer"}
              onClick={() => handleStarClick(starValue)}
              _hover={
                readOnly
                  ? {}
                  : {
                      color: color,
                      transform: "scale(1.1)",
                    }
              }
              transition="all 0.2s"
            />
          )
        })}
      </HStack>
      
      {showValue && (
        <Text
          fontSize={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"}
          fontWeight="medium"
          color="gray.600"
        >
          {rating.toFixed(1)}
        </Text>
      )}
    </HStack>
  )
}

interface RatingCategoryProps {
  label: string
  rating?: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
}

export function RatingCategory({
  label,
  rating,
  maxRating = 5,
  size = "sm",
}: RatingCategoryProps) {
  if (rating === undefined || rating === null) {
    return (
      <HStack justify="space-between" align="center">
        <Text fontSize={size} color="gray.600">
          {label}
        </Text>
        <Text fontSize={size} color="gray.400">
          Not rated
        </Text>
      </HStack>
    )
  }

  return (
    <HStack justify="space-between" align="center">
      <Text fontSize={size} color="gray.600">
        {label}
      </Text>
      <RatingStars
        rating={rating}
        maxRating={maxRating}
        size={size}
        showValue={false}
      />
    </HStack>
  )
}
