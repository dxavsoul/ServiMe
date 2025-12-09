# Cities Management Components

This module provides comprehensive city management functionality with geographic and demographic data.

## Components

### AddCity
- **Purpose**: Create new cities with geographic coordinates
- **Features**:
  - City name input
  - Country and state selection (dependent dropdowns)
  - Latitude/longitude coordinate input with validation
  - Population input (optional)
  - Active/inactive status toggle
  - Organized form sections for better UX

## Usage

```tsx
import { AddCity } from "../../components/Cities"

// In your component
<AddCity 
  onAdd={handleAddCity}
  countries={countries}
  states={states}
  countriesLoading={countriesLoading}
  statesLoading={statesLoading}
/>
```

## Data Structure

### CityCreate/CityUpdate
```typescript
{
  name: string          // City name (e.g., "Los Angeles")
  state_code: string    // State code (e.g., "CA")
  country_code: string  // Country ISO code (e.g., "US")
  latitude: number      // Latitude (-90 to 90)
  longitude: number     // Longitude (-180 to 180)
  population?: number   // Population (optional)
  is_active: boolean    // Whether the city is active
}
```

### CityWithDetailsPublic
```typescript
{
  id: string           // Unique identifier
  name: string         // City name
  state_code: string   // State code
  country_code: string // Country ISO code
  latitude: number     // Latitude coordinate
  longitude: number    // Longitude coordinate
  population?: number  // Population (optional)
  is_active: boolean   // Active status
  country_name: string // Country name for display
  state_name: string   // State name for display
}
```

## API Endpoints

- `GET /api/v1/locations/cities/` - List cities with details
- `GET /api/v1/locations/cities/nearby` - Find nearby cities by coordinates
- `POST /api/v1/locations/cities/` - Create city
- `PUT /api/v1/locations/cities/{city_id}` - Update city
- `DELETE /api/v1/locations/cities/{city_id}` - Delete city
- `GET /api/v1/locations/bulk` - Get comprehensive location data

## Features

- **Geographic Coordinates**: Precise latitude/longitude input with validation
- **Dependent Dropdowns**: State selection filtered by country
- **Population Tracking**: Optional demographic data
- **Search and Filters**: 
  - Text search across city, state, and country names
  - Country and state filtering
  - Active status filter
  - Popular cities filter (100K+ population)
- **Coordinate Display**: Formatted coordinates with directional indicators
- **Population Formatting**: Nicely formatted numbers with locale support
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Immediate UI updates with server sync

## Form Sections

The AddCity component is organized into logical sections:

1. **Basic Information**: City name, country, and state selection
2. **Geographic Coordinates**: Latitude and longitude with validation hints
3. **Demographics**: Population data (optional)
4. **Status**: Active/inactive toggle

## Coordinate Validation

- **Latitude**: -90 to 90 degrees
- **Longitude**: -180 to 180 degrees
- **Format**: Decimal degrees (e.g., 34.0522, -118.2437)
- **Helper Text**: Guidance for finding coordinates using Google Maps

## Notes

- Edit and Delete functionality for cities is planned but not yet implemented
- The nearby cities endpoint allows finding cities within a specified radius
- Bulk location data endpoint provides hierarchical country > state > city data
- Population filter shows cities with 100,000+ residents as "popular"
