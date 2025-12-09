import {
  Container,
  Heading,
  Table,
  VStack,
  Text,
  Badge,
  HStack,
  Box,
} from "@chakra-ui/react"
import { EmptyState } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { FiSearch } from "react-icons/fi"
import { createFileRoute } from "@tanstack/react-router"

import { IndustryTypesService } from "../../client"
import { IndustryTypeActionsMenu } from "../../components/IndustryTypes/IndustryTypeActionsMenu"
import AddIndustryType from "../../components/IndustryTypes/AddIndustryType"

function IndustryTypesTable() {
  // Fetch industry types
  const { data: industryTypesData, isLoading, error } = useQuery({
    queryKey: ["industry-types"],
    queryFn: () => IndustryTypesService.readIndustryTypes({ limit: 100 }),
  })

  const industryTypes = industryTypesData?.data || []

  if (isLoading) {
    return (
      <Container maxW="7xl" py={4}>
        <VStack gap={4}>
          <Heading size="lg">Industry Types</Heading>
          <Text>Loading industry types...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="7xl" py={4}>
        <VStack gap={4}>
          <Heading size="lg">Industry Types</Heading>
          <Text color="red.500">Error loading industry types. Please try again.</Text>
        </VStack>
      </Container>
    )
  }

  return (
    <Container maxW="7xl" py={4}>
      <VStack gap={4}>
        <HStack justify="space-between" w="100%">
          <Heading size="lg">Industry Types</Heading>
          <AddIndustryType />
        </HStack>

        {industryTypes.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiSearch />
              </EmptyState.Indicator>
              <EmptyState.Title>No industry types found</EmptyState.Title>
              <EmptyState.Description>
                Get started by creating your first industry type.
              </EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Box w="100%" overflowX="auto">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Code</Table.ColumnHeader>
                  <Table.ColumnHeader>Description</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader w="100px">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {industryTypes.map((industryType) => (
                  <Table.Row key={industryType.id}>
                    <Table.Cell>
                      <Text fontWeight="medium">{industryType.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm" color="gray.600">
                        {industryType.code}
                      </Text>
                    </Table.Cell>
                    <Table.Cell maxW="md">
                      <Text fontSize="sm" color="gray.600" truncate>
                        {industryType.description || "N/A"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={industryType.is_active ? "green" : "red"}
                        variant="subtle"
                      >
                        {industryType.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <IndustryTypeActionsMenu industryType={industryType} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </VStack>
    </Container>
  )
}

export const Route = createFileRoute("/_layout/industry-types")({
  component: IndustryTypesTable,
})