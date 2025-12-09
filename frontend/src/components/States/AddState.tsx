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
import { 
  StatesService, 
  type StateCreate, 
  type StatePublic,
  type CountryPublic 
} from "../../client"
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

interface AddStateProps {
  onAdd: (state: StatePublic) => void
  countries: CountryPublic[]
  countriesLoading: boolean
}

export function AddState({ onAdd, countries, countriesLoading }: AddStateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    country_id: "",
    is_active: true,
  })

  const queryClient = useQueryClient()

  const createStateMutation = useMutation({
    mutationFn: (newState: StateCreate) => 
      StatesService.createState({ requestBody: newState }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["states"] })
      onAdd(data)
      setIsOpen(false)
      setFormData({
        name: "",
        code: "",
        country_id: "",
        is_active: true,
      })
    },
    onError: (error) => {
      console.error("Error creating state:", error)
      alert("Failed to create state. Please try again.")
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
    
    const stateData: StateCreate = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      country_id: formData.country_id,
      is_active: formData.is_active,
    }

    createStateMutation.mutate(stateData)
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
          Add State
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add State</DialogTitle>
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
                  disabled={countriesLoading}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">
                    {countriesLoading ? "Loading countries..." : "Select a country"}
                  </option>
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
            <Button variant="outline">
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            onClick={handleSubmit}
            loading={createStateMutation.isPending}
          >
            Create State
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}
