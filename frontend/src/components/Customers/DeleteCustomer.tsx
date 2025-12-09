import { Button, Text, VStack } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FiTrash2 } from "react-icons/fi"

import type { CustomerPublic } from "@/client"
import { CustomersService } from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DeleteCustomerProps {
  customer: CustomerPublic
  children: React.ReactNode
}

function DeleteCustomer({ customer, children }: DeleteCustomerProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const mutation = useMutation({
    mutationFn: () => CustomersService.deleteCustomer({ customer_id: customer.id }),
    onSuccess: () => {
      showSuccessToast(`Customer "${customer.full_name}" deleted successfully`)
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] })
    },
    onError: (error: any) => {
      showErrorToast(
        `Failed to delete customer: ${error.message || "Unknown error"}`
      )
    },
  })

  const handleDelete = () => {
    mutation.mutate()
  }

  return (
    <DialogRoot>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent maxW="md">
        <DialogHeader>
          <DialogTitle>
            <FiTrash2 style={{ display: "inline", marginRight: "8px" }} />
            Delete Customer
          </DialogTitle>
        </DialogHeader>
        
        <DialogBody>
          <VStack gap={4} alignItems="stretch">
            <Text>
              Are you sure you want to delete the customer{" "}
              <Text as="span" fontWeight="bold" color="red.600">
                "{customer.full_name}"
              </Text>
              ?
            </Text>
            
            <VStack gap={2} alignItems="stretch" p={3} bg="red.50" borderRadius="md">
              <Text fontSize="sm" color="red.700" fontWeight="semibold">
                This action cannot be undone and will:
              </Text>
              <Text fontSize="sm" color="red.600" ml={4}>
                • Permanently delete the customer account
              </Text>
              <Text fontSize="sm" color="red.600" ml={4}>
                • Remove all customer data and history
              </Text>
              <Text fontSize="sm" color="red.600" ml={4}>
                • Cancel any active services or orders
              </Text>
            </VStack>

            <VStack gap={1} p={3} bg="gray.50" borderRadius="md">
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                Customer Details:
              </Text>
              <Text fontSize="sm" color="gray.600">
                Email: {customer.email}
              </Text>
              {customer.phone && (
                <Text fontSize="sm" color="gray.600">
                  Phone: {customer.phone}
                </Text>
              )}
              <Text fontSize="sm" color="gray.600">
                Status: {customer.is_active ? "Active" : "Inactive"}
              </Text>
            </VStack>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button
            colorScheme="red"
            onClick={handleDelete}
            loading={mutation.isPending}
          >
            <FiTrash2 style={{ marginRight: "8px" }} />
            Delete Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export default DeleteCustomer
