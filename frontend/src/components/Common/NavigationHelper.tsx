import { Text, Flex, Icon } from "@chakra-ui/react"
import { FiInfo, FiShield } from "react-icons/fi"

export function NavigationHelper() {
  return (
    <Flex p={3} bg="blue.50" borderRadius="md" alignItems="center" mb={4}>
      <Icon as={FiInfo} color="blue.500" mr={2} />
      <Text fontSize="sm" color="blue.700">
        <Text as="span" fontWeight="semibold">Tip:</Text> You can access Enhanced Users from the sidebar menu 
        <Icon as={FiShield} mx={1} color="blue.600" /> 
        or the dashboard quick actions.
      </Text>
    </Flex>
  )
}

export default NavigationHelper
