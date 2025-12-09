// Enhanced User Management Demo Component
// This component demonstrates how to use the new enhanced user endpoints

import React, { useState } from "react"
import { 
  Box, 
  Button, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Input, 
  Badge, 
  Spinner 
} from "@chakra-ui/react"

// Mock hooks for demonstration (replace with actual imports when available)
const mockHooks = {
  useUserApprovalStatus: () => ({
    data: {
      approved: true,
      is_superuser: false,
      message: "Account approved - access granted to assigned resources",
      assigned_companies: ["comp1", "comp2"],
      assigned_branches: ["branch1", "branch2", "branch3"],
      user_id: "user123",
      total_companies_access: 2,
      total_branches_access: 3
    },
    isLoading: false,
    error: null
  }),
  useIsUserApproved: () => ({ isApproved: true, isLoading: false, error: null }),
  useCurrentUserProfile: () => ({
    data: {
      id: "user123",
      email: "john.doe@example.com",
      full_name: "John Doe",
      is_active: true,
      is_superuser: false,
      profile: {
        department: "Engineering",
        position: "Senior Developer",
        phone: "+1-555-0123",
        timezone: "America/New_York"
      }
    },
    isLoading: false
  }),
  useUpdateCurrentUserProfile: () => ({
    mutate: (data: any, callbacks: any) => {
      console.log("Update profile:", data)
      setTimeout(() => callbacks.onSuccess?.(), 1000)
    },
    isPending: false
  }),
  useChangePassword: () => ({
    mutate: (data: any, callbacks: any) => {
      console.log("Change password:", data)
      setTimeout(() => callbacks.onSuccess?.(), 1000)
    },
    isPending: false
  }),
  useAllUsers: () => ({
    data: {
      data: [
        { id: "1", email: "admin@example.com", full_name: "Admin User", is_active: true, is_superuser: true },
        { id: "2", email: "user@example.com", full_name: "Regular User", is_active: true, is_superuser: false }
      ],
      total: 2,
      count: 2
    },
    isLoading: false
  }),
  useIsSuperAdmin: () => ({ isSuperAdmin: false, isLoading: false }),
  useCurrentUserResources: () => ({
    data: { companies: ["comp1", "comp2"], branches: ["branch1", "branch2"] },
    isLoading: false
  })
}

export function EnhancedUserManagementDemo() {
  const [selectedSection, setSelectedSection] = useState<string>("approval")

  // Using mock hooks for demonstration
  const {
    useUserApprovalStatus,
    useIsUserApproved,
    useCurrentUserProfile,
    useUpdateCurrentUserProfile,
    useChangePassword,
    useAllUsers,
    useIsSuperAdmin,
    useCurrentUserResources
  } = mockHooks

  // =============================================================================
  // APPROVAL STATUS SECTION
  // =============================================================================
  
  function ApprovalStatusSection() {
    const { data: approvalStatus, isLoading, error } = useUserApprovalStatus()
    const { isApproved } = useIsUserApproved()

    if (isLoading) return <Spinner />
    if (error) return <Box p={4} bg="red.50" color="red.700">Error loading approval status</Box>

    return (
      <Box p={6} border="1px" borderColor="gray.200" borderRadius="md">
        <Heading size="md" mb={4}>User Approval Status</Heading>
        <VStack alignItems="start" gap={3}>
          <HStack>
            <Badge colorScheme={isApproved ? "green" : "red"}>
              {isApproved ? "Approved" : "Pending"}
            </Badge>
            {approvalStatus?.is_superuser && (
              <Badge colorScheme="purple">SuperAdmin</Badge>
            )}
          </HStack>
          
          <Text><strong>Message:</strong> {approvalStatus?.message}</Text>
          <Text><strong>User ID:</strong> {approvalStatus?.user_id}</Text>
          
          {typeof approvalStatus?.total_companies_access === "number" && (
            <Text>
              <strong>Companies Access:</strong> {approvalStatus?.total_companies_access}
            </Text>
          )}
          
          {typeof approvalStatus?.total_branches_access === "number" && (
            <Text>
              <strong>Branches Access:</strong> {approvalStatus?.total_branches_access}
            </Text>
          )}
        </VStack>
      </Box>
    )
  }

  // =============================================================================
  // CURRENT USER PROFILE SECTION
  // =============================================================================
  
  function CurrentUserProfileSection() {
    const { data: userProfile, isLoading } = useCurrentUserProfile()
    const [isEditing, setIsEditing] = useState(false)
    const [profileForm, setProfileForm] = useState({
      full_name: "",
      email: "",
      profile: {
        department: "",
        position: ""
      }
    })

    const handleUpdateProfile = () => {
      console.log("Update profile:", profileForm)
      setIsEditing(false)
      // In real implementation, call the mutation here
    }

    if (isLoading) return <Spinner />

    return (
      <Box p={6} border="1px" borderColor="gray.200" borderRadius="md">
        <Heading size="md" mb={4}>Current User Profile</Heading>
        <VStack alignItems="start" gap={4}>
          <Box w="full">
            <Text><strong>Email:</strong> {userProfile?.email}</Text>
            <Text><strong>Full Name:</strong> {userProfile?.full_name || "N/A"}</Text>
            <Text><strong>Active:</strong> {userProfile?.is_active ? "Yes" : "No"}</Text>
            <Text><strong>Department:</strong> {userProfile?.profile?.department || "N/A"}</Text>
            <Text><strong>Position:</strong> {userProfile?.profile?.position || "N/A"}</Text>
          </Box>

          {isEditing ? (
            <VStack w="full" gap={3}>
              <Input
                value={profileForm.full_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Full Name"
              />
              <Input
                value={profileForm.email}
                onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
              />
              <Input
                value={profileForm.profile.department}
                onChange={(e) => setProfileForm(prev => ({ 
                  ...prev, 
                  profile: { ...prev.profile, department: e.target.value } 
                }))}
                placeholder="Department"
              />
              <Input
                value={profileForm.profile.position}
                onChange={(e) => setProfileForm(prev => ({ 
                  ...prev, 
                  profile: { ...prev.profile, position: e.target.value } 
                }))}
                placeholder="Position"
              />
              <HStack>
                <Button colorScheme="blue" onClick={handleUpdateProfile}>
                  Update Profile
                </Button>
                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
              </HStack>
            </VStack>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </VStack>
      </Box>
    )
  }

  // =============================================================================
  // USER RESOURCES SECTION
  // =============================================================================
  
  function UserResourcesSection() {
    const { data: resources, isLoading } = useCurrentUserResources()

    if (isLoading) return <Spinner />

    return (
      <Box p={6} border="1px" borderColor="gray.200" borderRadius="md">
        <Heading size="md" mb={4}>Accessible Resources</Heading>
        <VStack alignItems="start" gap={4}>
          <Box>
            <Text><strong>Companies:</strong> {resources?.companies.length || 0}</Text>
            <HStack mt={2} flexWrap="wrap">
              {resources?.companies.map((companyId: string) => (
                <Badge key={companyId} colorScheme="blue">
                  {companyId}
                </Badge>
              ))}
            </HStack>
          </Box>
          <Box>
            <Text><strong>Branches:</strong> {resources?.branches.length || 0}</Text>
            <HStack mt={2} flexWrap="wrap">
              {resources?.branches.map((branchId: string) => (
                <Badge key={branchId} colorScheme="green">
                  {branchId}
                </Badge>
              ))}
            </HStack>
          </Box>
        </VStack>
      </Box>
    )
  }

  // =============================================================================
  // ADMIN USERS SECTION
  // =============================================================================
  
  function AdminUsersSection() {
    const { isSuperAdmin } = useIsSuperAdmin()
    const { data: usersData, isLoading } = useAllUsers()

    if (!isSuperAdmin) {
      return (
        <Box p={4} bg="orange.50" color="orange.700" borderRadius="md">
          SuperAdmin access required to view this section
        </Box>
      )
    }

    return (
      <Box p={6} border="1px" borderColor="gray.200" borderRadius="md">
        <Heading size="md" mb={4}>All Users (Admin)</Heading>
        {isLoading ? (
          <Spinner />
        ) : (
          <VStack alignItems="start" gap={3}>
            <Text><strong>Total Users:</strong> {usersData?.total}</Text>
            
            {usersData?.data.map((user: any) => (
              <Box key={user.id} p={3} border="1px" borderColor="gray.100" borderRadius="md" w="full">
                <HStack justify="space-between">
                  <VStack alignItems="start" gap={1}>
                    <Text><strong>{user.full_name || "N/A"}</strong></Text>
                    <Text fontSize="sm" color="gray.600">{user.email}</Text>
                    <HStack>
                      <Badge colorScheme={user.is_active ? "green" : "red"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {user.is_superuser && (
                        <Badge colorScheme="purple">SuperAdmin</Badge>
                      )}
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    )
  }

  // =============================================================================
  // MAIN COMPONENT RENDER
  // =============================================================================

  const sections = [
    { id: "approval", label: "Approval Status", component: <ApprovalStatusSection /> },
    { id: "profile", label: "User Profile", component: <CurrentUserProfileSection /> },
    { id: "resources", label: "Resources", component: <UserResourcesSection /> },
    { id: "admin", label: "Admin Users", component: <AdminUsersSection /> },
  ]

  return (
    <Container maxW="6xl" py={8}>
      <VStack gap={8} align="stretch">
        <Heading size="xl" textAlign="center">
          Enhanced User Management Demo
        </Heading>
        
        <Text textAlign="center" color="gray.600">
          This demo showcases the new enhanced user management endpoints and authentication features.
        </Text>

        {/* Section Navigation */}
        <HStack justify="center" flexWrap="wrap" gap={4}>
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={selectedSection === section.id ? "solid" : "outline"}
              colorScheme="blue"
              onClick={() => setSelectedSection(section.id)}
            >
              {section.label}
            </Button>
          ))}
        </HStack>

        {/* Selected Section Content */}
        <Box>
          {sections.find(s => s.id === selectedSection)?.component}
        </Box>

        {/* Information Box */}
        <Box p={4} bg="blue.50" borderRadius="md">
          <Heading size="sm" color="blue.700" mb={2}>
            Enhanced User Management Features
          </Heading>
          <Text color="blue.600" fontSize="sm">
            This interface demonstrates the enhanced user management API with:
          </Text>
          <Box as="ul" ml={5} color="blue.600" fontSize="sm">
            <li>User approval status tracking</li>
            <li>Extended user profiles (department, position, etc.)</li>
            <li>Resource access management</li>
            <li>SuperAdmin role detection</li>
            <li>Enhanced authentication flow</li>
          </Box>
          <Text color="blue.600" fontSize="sm" mt={2}>
            See <code>ENHANCED_USER_API_INTEGRATION_GUIDE.md</code> for complete integration examples.
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}

export default EnhancedUserManagementDemo
