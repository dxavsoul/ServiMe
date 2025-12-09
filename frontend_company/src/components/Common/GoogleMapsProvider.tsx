import React, { createContext, useContext, useState } from 'react'
import { LoadScript } from '@react-google-maps/api'
import { env } from '../../utils/env'

interface GoogleMapsContextType {
  isLoaded: boolean
  loadError: Error | null
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null
})

export const useGoogleMaps = () => {
  return useContext(GoogleMapsContext)
}

// Libraries needed for Google Maps
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"]

interface GoogleMapsProviderProps {
  children: React.ReactNode
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)

  const GOOGLE_MAPS_API_KEY = env.VITE_GOOGLE_MAPS_API_KEY

  const onLoad = () => {
    setIsLoaded(true)
    setLoadError(null)
  }

  const onError = (error: Error) => {
    console.error('Google Maps API Error:', error)
    setLoadError(error)
    setIsLoaded(false)
  }

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError: new Error('API key not configured') }}>
        {children}
      </GoogleMapsContext.Provider>
    )
  }

  return (
    <LoadScript 
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      onLoad={onLoad}
      onError={onError}
    >
      <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  )
}
