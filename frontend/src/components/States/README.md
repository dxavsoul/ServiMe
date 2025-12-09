# States Management Components

This module provides comprehensive state/province management functionality with country relationships.

## Components

### AddState
- **Purpose**: Create new states or provinces
- **Features**:
  - State name input
  - State code validation (2+ characters)
  - Country selection dropdown
  - Active/inactive status toggle
  - Real-time country filtering

### EditState
- **Purpose**: Update existing state information
- **Features**:
  - Pre-populated form with current values
  - Country reassignment capability
  - State code modification
  - Status updates

### DeleteState
- **Purpose**: Remove states from the system
- **Features**:
  - Confirmation dialog with context
  - Warning about cascade effects on cities
  - Safe deletion with error handling

## Usage

```tsx
import { AddState, EditState, DeleteState } from "../../components/States"

// In your component
<AddState 
  onAdd={handleAddState}
  countries={countries}
  countriesLoading={countriesLoading}
/>

{editingState && (
  <EditState
    state={editingState}
    onUpdate={handleUpdateState}
    onClose={() => setEditingState(null)}
    countries={countries}
  />
)}

{deletingState && (
  <DeleteState
    state={deletingState}
    onDelete={handleDeleteState}
    onClose={() => setDeletingState(null)}
  />
)}
```

## Data Structure

### StateCreate/StateUpdate
```typescript
{
  name: string          // State name (e.g., "California")
  code: string          // State code (e.g., "CA")
  country_code: string  // Country ISO code (e.g., "US")
  is_active: boolean    // Whether the state is active
}
```

### StateWithCountryPublic
```typescript
{
  id: string           // Unique identifier
  name: string         // State name
  code: string         // State code
  country_code: string // Country ISO code
  is_active: boolean   // Active status
  country_name: string // Country name for display
}
```

## API Endpoints

- `GET /api/v1/locations/states/` - List states with country info
- `POST /api/v1/locations/states/` - Create state
- `PUT /api/v1/locations/states/{state_id}` - Update state
- `DELETE /api/v1/locations/states/{state_id}` - Delete state

## Features

- **Country Integration**: Automatic country filtering and validation
- **Search**: Filter states by name, code, or country
- **Country Filter**: Show states for specific countries
- **Status Filter**: Show only active states
- **Validation**: State code and country validation
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Immediate UI updates with server sync
