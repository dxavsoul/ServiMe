# Departments Component

This component manages departments with their operating hours/schedules.

## Features

- **Department Management**: Create, read, update, and delete departments
- **Schedule Management**: Manage operating hours for each day of the week
- **Weekly Schedule**: Set up complete weekly schedules at once
- **Branch Association**: Departments are associated with specific branches

## Components

- `DepartmentsDemo.tsx` - Main departments listing and management
- `AddDepartment.tsx` - Form to create new departments  
- `EditDepartment.tsx` - Form to edit existing departments
- `DeleteDepartment.tsx` - Confirmation dialog for department deletion
- `DepartmentActionsMenu.tsx` - Actions menu for each department
- `DepartmentSchedule.tsx` - Schedule management component
- `AddSchedule.tsx` - Form to add/edit department hours
- `WeeklySchedule.tsx` - Comprehensive weekly schedule management

## API Endpoints

- `GET /departments/` - List all departments
- `POST /departments/` - Create new department
- `GET /departments/{id}` - Get department details
- `GET /departments/{id}/with-hours` - Get department with schedule
- `PUT /departments/{id}` - Update department
- `DELETE /departments/{id}` - Delete department
- `POST /department-hours/department/{department_id}` - Add single day hours
- `POST /department-hours/department/{department_id}/weekly` - Set weekly schedule
- `GET /department-hours/department/{department_id}` - Get department hours
- `PUT /department-hours/{id}` - Update specific hours
- `DELETE /department-hours/{id}` - Delete specific hours

## Usage

```tsx
import { DepartmentsDemo } from '@/components/Departments'

// In your route or parent component
<DepartmentsDemo />
```
