import {
  Container,
  Heading,
  Table,
  VStack,
  Text,
  Badge,
  HStack,
  Box,
  Flex,
  Grid,
  GridItem,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { FiSearch, FiCheck, FiX } from "react-icons/fi"
import { createFileRoute } from "@tanstack/react-router"
import { EmptyState } from "@chakra-ui/react"

import { CategoriesService } from "../../client"
import { CategoryActionsMenu } from "../../components/Categories/CategoryActionsMenu"
import AddCategory from "../../components/Categories/AddCategory"

function CategoriesTable() {
  // Fetch categories
  const { data: categoriesData, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesService.readCategories({ limit: 100 }),
  })

  const categories = categoriesData?.data || []

  if (isLoading) {
    return (
      <Container maxW="7xl" py={4}>
        <VStack gap={4}>
          <Heading size="lg">Categories</Heading>
          <Text>Loading categories...</Text>
        </VStack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="7xl" py={4}>
        <VStack gap={4}>
          <Heading size="lg">Categories</Heading>
          <Text color="red.500">Error loading categories. Please try again.</Text>
        </VStack>
      </Container>
    )
  }

  const RequirementBadge = ({ required }: { required: boolean }) => (
    <Flex align="center" gap={1}>
      {required ? (
        <FiCheck color="green" size={14} />
      ) : (
        <FiX color="gray" size={14} />
      )}
      <Text fontSize="xs" color={required ? "green.600" : "gray.500"}>
        {required ? "Required" : "Optional"}
      </Text>
    </Flex>
  )

  return (
    <Container maxW="7xl" py={4}>
      <VStack gap={4}>
        <HStack justify="space-between" w="100%">
          <Heading size="lg">Categories</Heading>
          <AddCategory />
        </HStack>

        {categories.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FiSearch />
              </EmptyState.Indicator>
              <EmptyState.Title>No categories found</EmptyState.Title>
              <EmptyState.Description>
                Get started by creating your first category.
              </EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Box w="100%" overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Name</Table.ColumnHeader>
                  <Table.ColumnHeader>Code</Table.ColumnHeader>
                  <Table.ColumnHeader>Description</Table.ColumnHeader>
                  <Table.ColumnHeader>Employee Range</Table.ColumnHeader>
                  <Table.ColumnHeader>Requirements</Table.ColumnHeader>
                  <Table.ColumnHeader>Sort</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader w="100px">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {categories.map((category) => (
                  <Table.Row key={category.id}>
                    <Table.Cell>
                      <Text fontWeight="medium">{category.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm" color="gray.600">
                        {category.code}
                      </Text>
                    </Table.Cell>
                    <Table.Cell maxW="md">
                      <Text fontSize="sm" color="gray.600" truncate>
                        {category.description || "N/A"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm" color="gray.600">
                        {category.min_employees !== undefined && category.max_employees !== undefined
                          ? `${category.min_employees} - ${category.max_employees}`
                          : "N/A"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell maxW="xs">
                      <Grid templateColumns="repeat(2, 1fr)" gap={1} fontSize="xs">
                        <GridItem>
                          <RequirementBadge required={category.requires_business_license ?? false} />
                          <Text fontSize="xs" color="gray.500">Business</Text>
                        </GridItem>
                        <GridItem>
                          <RequirementBadge required={category.requires_tax_id ?? false} />
                          <Text fontSize="xs" color="gray.500">Tax ID</Text>
                        </GridItem>
                        <GridItem>
                          <RequirementBadge required={category.requires_professional_license ?? false} />
                          <Text fontSize="xs" color="gray.500">Professional</Text>
                        </GridItem>
                        <GridItem>
                          <RequirementBadge required={category.requires_incorporation_docs ?? false} />
                          <Text fontSize="xs" color="gray.500">Incorporation</Text>
                        </GridItem>
                        <GridItem>
                          <RequirementBadge required={category.requires_personal_id ?? false} />
                          <Text fontSize="xs" color="gray.500">Personal ID</Text>
                        </GridItem>
                      </Grid>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm" color="gray.600">
                        {category.sort_order ?? 0}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={category.is_active ? "green" : "red"}
                        variant="subtle"
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <CategoryActionsMenu category={category} />
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

export const Route = createFileRoute("/_layout/categories")({
  component: CategoriesTable,
})