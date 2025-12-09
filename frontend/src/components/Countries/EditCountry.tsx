import { useState } from "react"
import {
  Button,
  Input,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CountriesService, type CountryUpdate, type CountryPublic } from "../../client"
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
import { Field } from "../ui/field"
import { Checkbox } from "../ui/checkbox"

interface EditCountryProps {
  country: CountryPublic
  onUpdate: (country: CountryPublic) => void
  onClose: () => void
}

export function EditCountry({ country, onUpdate, onClose }: EditCountryProps) {
  const [formData, setFormData] = useState({
    name: country.name,
    code: country.code,
    is_active: country.is_active,
  })

  const queryClient = useQueryClient()

  const updateCountryMutation = useMutation({
    mutationFn: (data: { country_id: string; updateData: CountryUpdate }) => 
      CountriesService.updateCountry({ 
        country_id: data.country_id, 
        requestBody: data.updateData 
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["countries"] })
      onUpdate(data)
      onClose()
    },
    onError: (error) => {
      console.error("Error updating country:", error)
      alert("Failed to update country. Please try again.")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert("Please enter a country name")
      return
    }
    
    if (!formData.code.trim() || formData.code.length !== 2) {
      alert("Please enter a valid 2-letter country code")
      return
    }
    
    const updateData: CountryUpdate = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      is_active: formData.is_active,
    }

    updateCountryMutation.mutate({ 
      country_id: country.id, 
      updateData 
    })
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
          <DialogTitle>Edit Country</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Field label="Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter country name"
                  type="text"
                  required
                />
              </Field>

              <Field label="ISO Code" required>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="US, CA, MX..."
                  type="text"
                  maxLength={2}
                  required
                />
                <Text fontSize="sm" color="gray.500">
                  2-letter ISO country code
                </Text>
              </Field>

              <Field>
                <HStack>
                  <Checkbox
                    checked={formData.is_active}
                    onCheckedChange={(details) => 
                      setFormData({ ...formData, is_active: !!details.checked })
                    }
                  />
                  <Text>Active</Text>
                </HStack>
              </Field>
            </VStack>
          </form>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            onClick={handleSubmit}
            loading={updateCountryMutation.isPending}
          >
            Update Country
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}
