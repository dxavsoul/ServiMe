# Countries Management Components

This module provides comprehensive country management functionality with CRUD operations.

## Components

### AddCountry
- **Purpose**: Create new countries with ISO codes
- **Features**:
  - Country name input
  - 2-letter ISO code validation
  - Active/inactive status toggle
  - Form validation and error handling

### EditCountry
- **Purpose**: Update existing country information
- **Features**:
  - Pre-populated form with current values
  - ISO code modification
  - Status updates
  - Validation and error handling

### DeleteCountry
- **Purpose**: Remove countries from the system
- **Features**:
  - Confirmation dialog
  - Warning about cascade effects on states/cities
  - Safe deletion with error handling

## Usage

```tsx
import { AddCountry, EditCountry, DeleteCountry } from "../../components/Countries"

// In your component
<AddCountry onAdd={handleAddCountry} />

{editingCountry && (
  <EditCountry
    country={editingCountry}
    onUpdate={handleUpdateCountry}
    onClose={() => setEditingCountry(null)}
  />
)}

{deletingCountry && (
  <DeleteCountry
    country={deletingCountry}
    onDelete={handleDeleteCountry}
    onClose={() => setDeletingCountry(null)}
  />
)}
```

## Data Structure

### CountryCreate/CountryUpdate
```typescript
{
  name: string          // Country name (e.g., "United States")
  code: string          // 2-letter ISO code (e.g., "US")
  is_active: boolean    // Whether the country is active
}
```

### CountryPublic
```typescript
{
  id: string           // Unique identifier
  name: string         // Country name
  code: string         // ISO code
  is_active: boolean   // Active status
}
```

## API Endpoints

- `GET /api/v1/locations/countries/` - List countries
- `POST /api/v1/locations/countries/` - Create country
- `GET /api/v1/locations/countries/{country_code}` - Get by ISO code
- `PUT /api/v1/locations/countries/{country_id}` - Update country
- `DELETE /api/v1/locations/countries/{country_id}` - Delete country

## Features

- **Search**: Filter countries by name or ISO code
- **Status Filter**: Show only active countries
- **Validation**: ISO code format validation
- **Error Handling**: Comprehensive error messages
- **Responsive**: Works on mobile and desktop
- **Real-time Updates**: Immediate UI updates with server sync
