import React, { useRef, useEffect } from 'react'
import { Input } from '@chakra-ui/react'
import { useGoogleMaps } from './GoogleMapsProvider'

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  required?: boolean
  id?: string
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter address...",
  required = false,
  id
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const { isLoaded, loadError } = useGoogleMaps()

  useEffect(() => {
    if (isLoaded && inputRef.current && window.google?.maps?.places) {
      // Initialize the autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'geometry', 'place_id', 'address_components']
      })

      // Add listener for place selection
      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (place && place.formatted_address) {
          onChange(place.formatted_address)
          onPlaceSelect?.(place)
        }
      })

      return () => {
        if (listener) {
          window.google.maps.event.removeListener(listener)
        }
      }
    }
  }, [isLoaded, onChange, onPlaceSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  if (loadError) {
    // Fallback to regular input if there's an error
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        id={id}
        type="text"
      />
    )
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      required={required}
      id={id}
      type="text"
    />
  )
}

export default AddressAutocomplete
