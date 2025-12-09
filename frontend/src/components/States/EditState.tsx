import { useState } from "react"
import {
  Button,
  Input,
  VStack,
  HStack,
  Text,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  StatesService, 
  type StateUpdate, 
  type StateWithCountryPublic,
  type CountryPublic 
} from "../../client"
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

interface EditStateProps {
  state: StateWithCountryPublic
  onUpdate: (state: StateWithCountryPublic) => void
  onClose: () => void
  countries: CountryPublic[]
}

export function EditState({ state, onUpdate, onClose, countries }: EditStateProps) {
  const [formData, setFormData] = useState({
    name: state.name,
    code: state.code,
    country_id: state.country_id,
    is_active: state.is_active,
  })

  const queryClient = useQueryClient()

  const updateStateMutation = useMutation({
    mutationFn: (data: { state_id: string; updateData: StateUpdate }) => 
      StatesService.updateState({ 
        state_id: data.state_id, 
        requestBody: data.updateData 
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["states"] })
      // Create a state with country info for the callback
      const stateWithCountry = {
        ...data,
        country: countries.find(c => c.id === data.country_id) || state.country
      } as StateWithCountryPublic
      onUpdate(stateWithCountry)
      onClose()
    },
    onError: (error) => {
      console.error("Error updating state:", error)
      alert("Failed to update state. Please try again.")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert("Please enter a state name")
      return
    }
    
    if (!formData.code.trim() || formData.code.length < 2) {
      alert("Please enter a valid state code (2+ characters)")
      return
    }
    
    if (!formData.country_id) {
      alert("Please select a country")
      return
    }
    
    const updateData: StateUpdate = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      country_id: formData.country_id,
      is_active: formData.is_active,
    }

    updateStateMutation.mutate({ 
      state_id: state.id, 
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
          <DialogTitle>Edit State</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Field label="Name" required>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter state name"
                  type="text"
                  required
                />
              </Field>

              <Field label="State Code" required>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="CA, TX, NY..."
                  type="text"
                  maxLength={5}
                  required
                />
                <Text fontSize="sm" color="gray.500">
                  State/province abbreviation
                </Text>
              </Field>

              <Field label="Country" required>
                <select
                  value={formData.country_id}
                  onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white"
                  }}
                >
                  {countries
                    .filter(country => country.is_active)
                    .map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
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
            loading={updateStateMutation.isPending}
          >
            Update State
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}
