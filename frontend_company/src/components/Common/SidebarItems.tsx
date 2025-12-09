import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { FiHome, FiSettings, FiUsers, FiMapPin, FiUserCheck, FiClock, FiTool, FiPackage, FiUserPlus, FiStar, FiClipboard } from "react-icons/fi"
import type { IconType } from "react-icons/lib"

import type { UserPublic } from "@/client"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiUsers, title: "Companies", path: "/companies" },
  { icon: FiMapPin, title: "Branches", path: "/branches" },
  { icon: FiClock, title: "Departments", path: "/departments" },
  { icon: FiPackage, title: "Services", path: "/services" },
  { icon: FiClipboard, title: "Service Requests", path: "/service-requests" },
  { icon: FiStar, title: "Ratings", path: "/ratings" },
  { icon: FiUserCheck, title: "Branch Users", path: "/branch-users" },
  { icon: FiSettings, title: "User Settings", path: "/settings" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const finalItems: Item[] = currentUser?.is_superuser
    ? [
        ...items,
        { icon: FiTool, title: "Service Types", path: "/service-types" },
        { icon: FiUserPlus, title: "Customers", path: "/customers" },
        { icon: FiUsers, title: "Admin", path: "/admin" }
      ]
    : items

  const listItems = finalItems.map(({ icon, title, path }) => (
    <RouterLink key={title} to={path} onClick={onClose}>
      <Flex
        gap={4}
        px={4}
        py={2}
        _hover={{
          background: "gray.subtle",
        }}
        alignItems="center"
        fontSize="sm"
      >
        <Icon as={icon} alignSelf="center" />
        <Text ml={2}>{title}</Text>
      </Flex>
    </RouterLink>
  ))

  return (
    <>
      <Text fontSize="xs" px={4} py={2} fontWeight="bold">
        Menu
      </Text>
      <Box>{listItems}</Box>
    </>
  )
}

export default SidebarItems
