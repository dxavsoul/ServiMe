import { Box, Container, Text, Button, VStack, HStack, Card } from "@chakra-ui/react"
import { createFileRoute, Link } from "@tanstack/react-router"

import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})

function Dashboard() {
  const { user: currentUser } = useAuth()

  return (
    <>
      <Container maxW="full">
        <VStack gap={6} alignItems="stretch">
          <Box pt={12} m={4}>
            <Text fontSize="2xl" truncate maxW="sm">
              Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
            </Text>
            <Text>Welcome back, nice to see you again!</Text>
          </Box>

          {/* Quick Actions Card */}
          <Card.Root p={6}>
            <Card.Header>
              <Text fontSize="lg" fontWeight="semibold">Quick Actions</Text>
            </Card.Header>
            <Card.Body>
              <HStack gap={4} flexWrap="wrap">
                {currentUser?.is_superuser && (
                  <Link to="/admin">
                    <Button colorScheme="blue">
                      👥 Admin Panel
                    </Button>
                  </Link>
                )}
                <Link to="/companies">
                  <Button colorScheme="green">
                    🏢 Companies
                  </Button>
                </Link>
                <Link to="/branches">
                  <Button colorScheme="orange">
                    🏪 Branches
                  </Button>
                </Link>
              </HStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    </>
  )
}
