import {
  Button,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CountriesService, type CountryPublic } from "../../client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogActionTrigger,
} from "../ui/dialog"

interface DeleteCountryProps {
  country: CountryPublic
  onDelete: (id: string) => void
  onClose: () => void
}

export function DeleteCountry({ country, onDelete, onClose }: DeleteCountryProps) {
  const queryClient = useQueryClient()

  const deleteCountryMutation = useMutation({
    mutationFn: (country_id: string) => 
      CountriesService.deleteCountry({ country_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countries"] })
      onDelete(country.id)
      onClose()
    },
    onError: (error) => {
      console.error("Error deleting country:", error)
      alert("Failed to delete country. Please try again.")
    }
  })

  const handleDelete = () => {
    deleteCountryMutation.mutate(country.id)
  }

  return (
    <DialogRoot
      open={true}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
      size={{ base: "xs", md: "sm" }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Country</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Text>
            Are you sure you want to delete the country "{country.name}" ({country.code})? 
            This action cannot be undone and may affect related states and cities.
          </Text>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            colorScheme="red" 
            onClick={handleDelete}
            loading={deleteCountryMutation.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}
