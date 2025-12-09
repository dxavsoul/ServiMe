import React, { useState, useCallback } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { Box, Button, Text, VStack } from '@chakra-ui/react'
import { useGoogleMaps } from './GoogleMapsProvider'

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  initialLat?: number
  initialLng?: number
  height?: string
  width?: string
}

const containerStyle = {
  width: '100%',
  height: '300px'
}

// Default center - you can change this to your preferred default location
const defaultCenter = {
  lat: 40.7128, // New York City
  lng: -74.0060
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLat,
  initialLng,
  height = '300px',
  width = '100%'
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [mapCenter, setMapCenter] = useState(
    initialLat && initialLng 
      ? { lat: initialLat, lng: initialLng }
      : defaultCenter
  )
  const { isLoaded, loadError } = useGoogleMaps()

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      setSelectedLocation({ lat, lng })
      onLocationSelect(lat, lng)
    }
  }, [onLocationSelect])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setSelectedLocation({ lat, lng })
          setMapCenter({ lat, lng })
          onLocationSelect(lat, lng)
        },
        (error) => {
          console.error('Error getting current location:', error)
          alert('Unable to get your current location. Please click on the map to select a location.')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser. Please click on the map to select a location.')
    }
  }

  if (loadError) {
    return (
      <Box p={4} border="1px solid" borderColor="red.300" borderRadius="md" bg="red.50">
        <Text color="red.600" fontWeight="bold">
          Google Maps Error
        </Text>
        <Text color="red.600" fontSize="sm">
          {loadError.message}
        </Text>
      </Box>
    )
  }

  if (!isLoaded) {
    return (
      <Box p={4} border="1px solid" borderColor="gray.300" borderRadius="md" bg="gray.50">
        <Text color="gray.600">
          Loading Google Maps...
        </Text>
      </Box>
    )
  }

  return (
    <VStack gap={3} align="stretch">
      <Box>
        <Text fontSize="sm" color="gray.600" mb={2}>
          Click on the map to select the branch location, or use your current location.
        </Text>
        <Button size="sm" onClick={getCurrentLocation} mb={2}>
          Use Current Location
        </Button>
      </Box>
      
      <Box border="1px solid" borderColor="gray.300" borderRadius="md">
        <GoogleMap
          mapContainerStyle={{
            ...containerStyle,
            height,
            width
          }}
          center={mapCenter}
          zoom={13}
          onClick={onMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {selectedLocation && (
            <Marker
              position={selectedLocation}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      </Box>
      
      {selectedLocation && (
        <Box p={3} bg="gray.50" borderRadius="md">
          <Text fontSize="sm">
            <strong>Selected Location:</strong>
          </Text>
          <Text fontSize="xs" color="gray.600">
            Latitude: {selectedLocation.lat.toFixed(6)}
          </Text>
          <Text fontSize="xs" color="gray.600">
            Longitude: {selectedLocation.lng.toFixed(6)}
          </Text>
        </Box>
      )}
    </VStack>
  )
}

export default LocationPicker
