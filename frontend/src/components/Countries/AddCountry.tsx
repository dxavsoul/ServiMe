import { useState } from "react"
import {
  Button,
  Input,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FiPlus } from "react-icons/fi"
import { CountriesService, type CountryCreate, type CountryPublic } from "../../client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
  DialogTitle,
  DialogActionTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"
import { Checkbox } from "../ui/checkbox"

interface AddCountryProps {
  onAdd: (country: CountryPublic) => void
}

export function AddCountry({ onAdd }: AddCountryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    is_active: true,
  })

  const queryClient = useQueryClient()

  const createCountryMutation = useMutation({
    mutationFn: (newCountry: CountryCreate) => 
      CountriesService.createCountry({ requestBody: newCountry }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["countries"] })
      onAdd(data)
      setIsOpen(false)
      setFormData({
        name: "",
        code: "",
        is_active: true,
      })
    },
    onError: (error) => {
      console.error("Error creating country:", error)
      alert("Failed to create country. Please try again.")
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
    
    const countryData: CountryCreate = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      is_active: formData.is_active,
    }

    createCountryMutation.mutate(countryData)
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      placement="center"
      size={{ base: "xs", md: "sm" }}
    >
      <DialogTrigger asChild>
        <Button>
          <FiPlus />
          Add Country
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Country</DialogTitle>
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
            <Button variant="outline">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            onClick={handleSubmit}
            loading={createCountryMutation.isPending}
          >
            Create Country
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}
