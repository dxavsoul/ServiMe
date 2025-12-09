# Cities Edit Form Implementation

## Overview
Added edit functionality for cities in the location management system.

## Changes Made

### 1. Created EditCity Component (`src/components/Cities/EditCity.tsx`)
- Form-based dialog for editing existing cities
- Pre-populates all fields with current city data
- Supports editing:
  - City name
  - Country and state selection (with cascading dropdowns)
  - Geographic coordinates (latitude/longitude)
  - Population (optional)
  - Active status
- Form validation for required fields and coordinate ranges
- Uses React Query mutations for API calls
- Automatically refreshes data after successful updates

### 2. Updated Cities Index (`src/components/Cities/index.ts`)
- Added export for the new `EditCity` component

### 3. Updated Cities Page (`src/routes/_layout/cities.tsx`)
- Imported and integrated the `EditCity` component
- Replaced placeholder edit button with functional edit form
- Removed unused imports and functions

## Key Features

### Form Validation
- Required fields: city name, country, state, coordinates
- Latitude range: -90 to 90 degrees
- Longitude range: -180 to 180 degrees
- Population must be a positive integer

### Cascading Dropdowns
- Country selection filters available states
- State dropdown resets when country changes
- Only shows active countries and states

### API Integration
- Uses `CitiesService.updateCity()` for updates
- Proper TypeScript typing with `CityWithDetailsPublic`
- Error handling with user-friendly messages
- Automatic query invalidation for real-time updates

### User Experience
- Modal dialog interface
- Pre-populated form fields
- Loading states during submission
- Success feedback through automatic data refresh
- Cancel functionality with form reset

## Usage
1. Navigate to the Cities page
2. Click the "Edit" button on any city row
3. Modify the desired fields in the dialog
4. Click "Update City" to save changes
5. The dialog closes and the table updates automatically

## Technical Notes
- Component follows the same pattern as `AddCity` for consistency
- Uses Chakra UI components for styling
- Implements proper TypeScript interfaces
- Handles the difference between `CityPublic` (API response) and `CityWithDetailsPublic` (with relations)