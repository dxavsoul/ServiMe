import { useState, useEffect } from "react"
import {
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Card,
  Heading,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FiEdit, FiMapPin, FiUsers } from "react-icons/fi"
import { 
  CitiesService, 
  type CityUpdate, 
  type CityWithDetailsPublic,
  type CountryPublic,
  type StateWithCountryPublic
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

interface EditCityProps {
  city: CityWithDetailsPublic
  onEdit: (city: CityWithDetailsPublic) => void
  countries: CountryPublic[]
  states: StateWithCountryPublic[]
  countriesLoading: boolean
  statesLoading: boolean
}

export function EditCity({ city, countries, states, countriesLoading, statesLoading }: Omit<EditCityProps, 'onEdit'>) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    state_id: "",
    country_id: "",
    latitude: "",
    longitude: "",
    population: "",
    is_active: true,
  })

  const queryClient = useQueryClient()

  // Initialize form data when city prop changes or dialog opens
  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name || "",
        state_id: city.state?.id || "",
        country_id: city.country?.id || "",
        latitude: city.latitude?.toString() || "",
        longitude: city.longitude?.toString() || "",
        population: city.population?.toString() || "",
        is_active: city.is_active ?? true,
      })
    }
  }, [city, isOpen])

  // Filter states based on selected country
  const filteredStates = states.filter(state => 
    state.country_id === formData.country_id && state.is_active
  )

  const updateCityMutation = useMutation({
    mutationFn: (updatedCity: CityUpdate) => 
      CitiesService.updateCity({ city_id: city.id, requestBody: updatedCity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cities"] })
      // Since the API returns CityPublic, we need to refetch to get the full details
      setIsOpen(false)
    },
    onError: (error) => {
      console.error("Error updating city:", error)
      alert("Failed to update city. Please try again.")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert("Please enter a city name")
      return
    }
    
    if (!formData.country_id) {
      alert("Please select a country")
      return
    }
    
    if (!formData.state_id) {
      alert("Please select a state")
      return
    }
    
    if (!formData.latitude || !formData.longitude) {
      alert("Please enter valid coordinates")
      return
    }
    
    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      alert("Latitude must be between -90 and 90")
      return
    }
    
    if (isNaN(lng) || lng < -180 || lng > 180) {
      alert("Longitude must be between -180 and 180")
      return
    }
    
    const cityData: CityUpdate = {
      name: formData.name.trim(),
      state_id: formData.state_id,
      country_id: formData.country_id,
      latitude: lat,
      longitude: lng,
      population: formData.population ? parseInt(formData.population) : null,
      is_active: formData.is_active,
    }

    updateCityMutation.mutate(cityData)
  }

  const handleCountryChange = (countryId: string) => {
    setFormData({ 
      ...formData, 
      country_id: countryId,
      state_id: "" // Reset state when country changes
    })
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
      placement="center"
      size={{ base: "xs", md: "lg" }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FiEdit />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit City - {city.name}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              {/* Basic Information */}
              <Card.Root width="full">
                <Card.Header>
                  <Heading size="sm">Basic Information</Heading>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <Field label="City Name" required>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter city name"
                        type="text"
                        required
                      />
                    </Field>

                    <HStack gap={4} width="full">
                      <Field label="Country" required>
                        <select
                          value={formData.country_id}
                          onChange={(e) => handleCountryChange(e.target.value)}
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

                      <Field label="State/Province" required>
                        <select
                          value={formData.state_id}
                          onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                          required
                          disabled={statesLoading || !formData.country_id}
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
                            {!formData.country_id 
                              ? "Select country first"
                              : statesLoading 
                                ? "Loading states..." 
                                : "Select a state"}
                          </option>
                          {filteredStates.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.name} ({state.code})
                            </option>
                          ))}
                        </select>
                      </Field>
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Location Coordinates */}
              <Card.Root width="full">
                <Card.Header>
                  <HStack>
                    <FiMapPin />
                    <Heading size="sm">Geographic Coordinates</Heading>
                  </HStack>
                </Card.Header>
                <Card.Body>
                  <VStack gap={4}>
                    <HStack gap={4} width="full">
                      <Field label="Latitude" required>
                        <Input
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          placeholder="e.g., 34.0522"
                          type="number"
                          step="any"
                          min="-90"
                          max="90"
                          required
                        />
                        <Text fontSize="xs" color="gray.500">
                          -90 to 90
                        </Text>
                      </Field>
                      
                      <Field label="Longitude" required>
                        <Input
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          placeholder="e.g., -118.2437"
                          type="number"
                          step="any"
                          min="-180"
                          max="180"
                          required
                        />
                        <Text fontSize="xs" color="gray.500">
                          -180 to 180
                        </Text>
                      </Field>
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      Use decimal degrees format. You can find coordinates using Google Maps.
                    </Text>
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Demographics */}
              <Card.Root width="full">
                <Card.Header>
                  <HStack>
                    <FiUsers />
                    <Heading size="sm">Demographics</Heading>
                  </HStack>
                </Card.Header>
                <Card.Body>
                  <Field label="Population (optional)">
                    <Input
                      value={formData.population}
                      onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                      placeholder="e.g., 3979576"
                      type="number"
                      min="0"
                    />
                    <Text fontSize="sm" color="gray.500">
                      Total population of the city
                    </Text>
                  </Field>
                </Card.Body>
              </Card.Root>

              {/* Status */}
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
            loading={updateCityMutation.isPending}
          >
            Update City
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}