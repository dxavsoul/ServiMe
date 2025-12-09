import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FaPlus } from "react-icons/fa"

import { Checkbox } from "../../components/ui/checkbox"
import LocationPicker from "../Common/LocationPicker"
import AddressAutocomplete from "../Common/AddressAutocomplete"
import { GoogleMapsProvider } from "../Common/GoogleMapsProvider"

import { 
  type BranchCreate, 
  BranchesService, 
  CompaniesService,
  CountriesService,
  StatesService,
  CitiesService
} from "@/client"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

const AddBranch = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountryId, setSelectedCountryId] = useState("")
  const [selectedStateId, setSelectedStateId] = useState("")
  const [selectedCityId, setSelectedCityId] = useState("")
  
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  
  // Fetch companies for the dropdown
  const { data: companiesData } = useQuery({
    queryKey: ["companies"],
    queryFn: () => CompaniesService.readCompanies({ limit: 100 }), // Get all companies
  })

  // Fetch countries for dropdown
  const { data: countriesData, isLoading: _countriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: () => CountriesService.readCountries({ limit: 1000, active_only: true }),
  })

  // Fetch states when country is selected
  const { data: statesData, isLoading: _statesLoading } = useQuery({
    queryKey: ["states", selectedCountryId],
    queryFn: () => StatesService.readStates({ limit: 1000, country_id: selectedCountryId }),
    enabled: !!selectedCountryId,
  })

  // Fetch cities when state is selected
  const { data: citiesData, isLoading: _citiesLoading } = useQuery({
    queryKey: ["cities", selectedStateId],
    queryFn: () => CitiesService.readCities({ limit: 1000, state_id: selectedStateId }),
    enabled: !!selectedStateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Extract data arrays
  const countries = countriesData?.data || []
  const states = statesData?.data || []
  const cities = selectedStateId ? (citiesData?.data || []) : []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<BranchCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      company_id: "",
      code: "",
      address: "",
      postal_code: "",
      city_id: "",
      latitude: null,
      longitude: null,
      phone: "",
      email: "",
      manager_name: "",
      is_active: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: BranchCreate) =>
      BranchesService.createBranch({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Branch created successfully.")
      reset()
      setIsOpen(false)
    },
    onError: (err: any) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] })
    },
  })

  // Location selection handlers
  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId)
    setSelectedStateId("") // Reset state when country changes
    setSelectedCityId("") // Reset city when country changes
    setValue("city_id", "") // Clear city_id in form
  }

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId)
    setSelectedCityId("") // Reset city when state changes
    setValue("city_id", "") // Clear city_id in form
    
    // Invalidate cities cache to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ["cities"] })
  }

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId)
    setValue("city_id", cityId) // Set city_id in form
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setValue("latitude", lat)
    setValue("longitude", lng)
  }

  const handleAddressChange = (address: string) => {
    setValue("address", address)
  }

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      setValue("latitude", lat)
      setValue("longitude", lng)
    }
  }

  const onSubmit: SubmitHandler<BranchCreate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "lg" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-branch" my={4}>
          <FaPlus fontSize="16px" />
          Add Branch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <GoogleMapsProvider>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Branch</DialogTitle>
            </DialogHeader>
          <DialogBody>
            <Text mb={4}>Fill in the details to add a new branch.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.company_id}
                errorText={errors.company_id?.message}
                label="Company"
              >
                <select
                  id="company_id"
                  {...register("company_id", {
                    required: "Please select a company.",
                  })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white",
                  }}
                >
                  <option value="">Select a company...</option>
                  {companiesData?.data.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                required
                invalid={!!errors.name}
                errorText={errors.name?.message}
                label="Branch Name"
              >
                <Input
                  id="name"
                  {...register("name", {
                    required: "Branch name is required.",
                  })}
                  placeholder="Tech Corp Main Branch"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.code}
                errorText={errors.code?.message}
                label="Code"
              >
                <Input
                  id="code"
                  {...register("code", {
                    required: "Branch code is required"
                  })}
                  placeholder="BR001"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.manager_name}
                errorText={errors.manager_name?.message}
                label="Manager Name"
              >
                <Input
                  id="manager_name"
                  {...register("manager_name")}
                  placeholder="John Doe"
                  type="text"
                />
              </Field>

              {/* Location Selection */}
              <Field label="Country" required>
                <select
                  value={selectedCountryId}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">Select a country</option>
                  {countries
                    ?.filter((country) => country.is_active)
                    .map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="State/Province" required={!!selectedCountryId}>
                <select
                  value={selectedStateId}
                  onChange={(e) => handleStateChange(e.target.value)}
                  disabled={!selectedCountryId}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: selectedCountryId ? "white" : "#f7fafc"
                  }}
                >
                  <option value="">Select a state/province</option>
                  {states
                    ?.filter((state) => state.is_active)
                    .map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
              </Field>

              <Field 
                label="City" 
                required={!!selectedStateId}
                invalid={!!errors.city_id}
                errorText={errors.city_id?.message}
              >
                <select
                  value={selectedCityId}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!selectedStateId}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: selectedStateId ? "white" : "#f7fafc"
                  }}
                >
                  <option value="">Select a city</option>
                  {cities
                    ?.filter((city) => city.is_active && city.state_id === selectedStateId)
                    .map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                invalid={!!errors.postal_code}
                errorText={errors.postal_code?.message}
                label="Postal Code"
              >
                <Input
                  id="postal_code"
                  {...register("postal_code")}
                  placeholder="94105"
                  type="text"
                />
              </Field>

              <Field
                label="Is Active"
              >
                <Checkbox
                  id="is_active"
                  {...register("is_active")}
                  defaultChecked={true}
                  colorPalette="blue"
                >
                  Active Branch
                </Checkbox>
              </Field>

              <Field
                invalid={!!errors.email}
                errorText={errors.email?.message}
                label="Email"
              >
                <Input
                  id="email"
                  {...register("email", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address"
                    }
                  })}
                  placeholder="contact@techcorp.com"
                  type="email"
                />
              </Field>

              <Field
                invalid={!!errors.phone}
                errorText={errors.phone?.message}
                label="Phone"
              >
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+1234567890"
                  type="tel"
                />
              </Field>

              <Field
                invalid={!!errors.address}
                errorText={errors.address?.message}
                label="Address"
                helperText="Start typing to get address suggestions"
              >
                <AddressAutocomplete
                  id="address"
                  value={watch("address") || ""}
                  onChange={handleAddressChange}
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="123 Tech Street"
                  required={false}
                />
              </Field>

              {/* Location Picker */}
              <Field label="Branch Location" helperText="Click on the map to select the exact location of your branch">
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  height="250px"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
        </GoogleMapsProvider>
      </DialogContent>
    </DialogRoot>
  )
}

export default AddBranch
