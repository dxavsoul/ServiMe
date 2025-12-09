import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react"

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "../ui/dialog"
import { Field } from "../ui/field"
import { Checkbox } from "../ui/checkbox"
import { DepartmentHoursService } from "../../client"
import type { DepartmentHourCreate } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"

interface DepartmentPublic {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  branch_id: string
  created_by: string
}

interface AddScheduleProps {
  department: DepartmentPublic
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void // Optional callback when schedule is successfully added
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AddSchedule = ({ department, isOpen, onClose, onSuccess }: AddScheduleProps) => {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  
  const [formData, setFormData] = useState({
    day_of_week: "monday" as const,
    open_time: "08:00",
    close_time: "18:00",
    is_closed: false,
  })

  // Mutation to create department hours
  const createHoursMutation = useMutation({
    mutationFn: (hourData: DepartmentHourCreate) =>
      DepartmentHoursService.createSingleDayHours({
        department_id: department.id,
        requestBody: hourData,
      }),
    onSuccess: () => {
      showSuccessToast(`Schedule for ${daysOfWeek.find(d => d.value === formData.day_of_week)?.label} added successfully`)
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: ["department-hours", department.id],
      })
      queryClient.invalidateQueries({
        queryKey: ["departments"],
      })
      
      // Reset form
      setFormData({
        day_of_week: "monday",
        open_time: "08:00",
        close_time: "18:00",
        is_closed: false,
      })
      
      // Close dialog and call success callback
      onClose()
      onSuccess?.()
    },
    onError: (error: any) => {
      console.error("Error creating department hours:", error)
      showErrorToast("Failed to add schedule. Please try again.")
    },
  })

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create the department hour data
    const hourData: DepartmentHourCreate = {
      day_of_week: formData.day_of_week,
      open_time: formData.is_closed ? null : `${formData.open_time}:00`,
      close_time: formData.is_closed ? null : `${formData.close_time}:00`,
      is_closed: formData.is_closed,
      department_id: department.id, // Required by API
    }
    
    // Submit using the mutation
    createHoursMutation.mutate(hourData)
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={({ open }) => !open && onClose()}
      placement="center"
      size={{ base: "xs", md: "md" }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Department Hours</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <VStack gap={4}>
              <Field label="Day of Week" required>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => 
                    setFormData({ ...formData, day_of_week: e.target.value as typeof formData.day_of_week })
                  }
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <HStack>
                  <Checkbox
                    checked={formData.is_closed}
                    onCheckedChange={(details) => 
                      setFormData({ ...formData, is_closed: !!details.checked })
                    }
                  />
                  <Text>Department is closed this day</Text>
                </HStack>
              </Field>

              {!formData.is_closed && (
                <>
                  <Field label="Open Time" required>
                    <Input
                      type="time"
                      value={formData.open_time}
                      onChange={(e) => 
                        setFormData({ ...formData, open_time: e.target.value })
                      }
                      required
                    />
                  </Field>

                  <Field label="Close Time" required>
                    <Input
                      type="time"
                      value={formData.close_time}
                      onChange={(e) => 
                        setFormData({ ...formData, close_time: e.target.value })
                      }
                      required
                    />
                  </Field>
                </>
              )}
            </VStack>
          </form>
        </DialogBody>
        <DialogFooter gap={2}>
          <DialogActionTrigger asChild>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={createHoursMutation.isPending}
            >
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button 
            variant="solid" 
            onClick={handleSubmit}
            loading={createHoursMutation.isPending}
            disabled={createHoursMutation.isPending}
          >
            Add Hours
          </Button>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddSchedule
