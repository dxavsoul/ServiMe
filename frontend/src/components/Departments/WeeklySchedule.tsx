import { useState } from "react"
import {
  Container,
  Heading,
  VStack,
  Text,
  Button,
  HStack,
  Input,
  Table,
  Card,
} from "@chakra-ui/react"
import { FiSave, FiArrowLeft } from "react-icons/fi"

import { Checkbox } from "../ui/checkbox"

interface DepartmentPublic {
  id: string
  name: string
  description?: string | null
  is_active: boolean
  branch_id: string
  created_by: string
}

interface DepartmentHourPublic {
  id: string
  day_of_week: string
  open_time: string | null
  close_time: string | null
  is_closed: boolean
  department_id: string
}

interface WeeklyScheduleProps {
  department: DepartmentPublic
  currentHours: DepartmentHourPublic[]
  onBack: () => void
}

interface WeeklyHour {
  day_of_week: string
  open_time: string
  close_time: string
  is_closed: boolean
}

const WeeklySchedule = ({ department, currentHours, onBack }: WeeklyScheduleProps) => {
  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ]

  // Initialize weekly schedule with current hours or defaults
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHour[]>(() => {
    return daysOfWeek.map(day => {
      const existingHour = currentHours.find(h => h.day_of_week === day.value)
      return {
        day_of_week: day.value,
        open_time: existingHour?.open_time?.slice(0, 5) || "08:00",
        close_time: existingHour?.close_time?.slice(0, 5) || "18:00",
        is_closed: existingHour?.is_closed || false,
      }
    })
  })

  const updateDayHours = (dayIndex: number, field: keyof WeeklyHour, value: any) => {
    setWeeklyHours(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, [field]: value } : day
    ))
  }

  const copyToAllDays = (sourceDay: WeeklyHour) => {
    if (sourceDay.is_closed) {
      setWeeklyHours(prev => prev.map(day => ({ ...day, is_closed: true })))
    } else {
      setWeeklyHours(prev => prev.map(day => ({
        ...day,
        open_time: sourceDay.open_time,
        close_time: sourceDay.close_time,
        is_closed: false,
      })))
    }
  }

  const handleSave = () => {
    // TODO: Implement actual submission logic with DepartmentHoursService
    const weeklyScheduleData = weeklyHours.map(day => ({
      day_of_week: day.day_of_week,
      open_time: day.is_closed ? null : `${day.open_time}:00`,
      close_time: day.is_closed ? null : `${day.close_time}:00`,
      is_closed: day.is_closed,
    }))
    console.log("Weekly schedule data:", weeklyScheduleData)
    onBack()
  }

  return (
    <Container maxW="4xl">
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <VStack align="start" gap={1}>
            <Heading size="lg">Weekly Schedule</Heading>
            <Text color="gray.500">
              Set operating hours for {department.name} for the entire week
            </Text>
          </VStack>
          <HStack gap={2}>
            <Button variant="outline" onClick={onBack}>
              <FiArrowLeft />
              Back
            </Button>
            <Button onClick={handleSave}>
              <FiSave />
              Save Schedule
            </Button>
          </HStack>
        </HStack>

        {/* Weekly Schedule Form */}
        <Card.Root>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <Heading size="md">Configure Hours for Each Day</Heading>
              
              <Table.Root size="md">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader w="150px">Day</Table.ColumnHeader>
                    <Table.ColumnHeader w="120px">Closed</Table.ColumnHeader>
                    <Table.ColumnHeader w="150px">Open Time</Table.ColumnHeader>
                    <Table.ColumnHeader w="150px">Close Time</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {weeklyHours.map((dayHour, index) => {
                    const dayInfo = daysOfWeek.find(d => d.value === dayHour.day_of_week)
                    return (
                      <Table.Row key={dayHour.day_of_week}>
                        <Table.Cell>
                          <Text fontWeight="medium">{dayInfo?.label}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Checkbox
                            checked={dayHour.is_closed}
                            onCheckedChange={(details) => 
                              updateDayHours(index, 'is_closed', !!details.checked)
                            }
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <Input
                            type="time"
                            value={dayHour.open_time}
                            onChange={(e) => 
                              updateDayHours(index, 'open_time', e.target.value)
                            }
                            disabled={dayHour.is_closed}
                            size="sm"
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <Input
                            type="time"
                            value={dayHour.close_time}
                            onChange={(e) => 
                              updateDayHours(index, 'close_time', e.target.value)
                            }
                            disabled={dayHour.is_closed}
                            size="sm"
                          />
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => copyToAllDays(dayHour)}
                          >
                            Copy to All
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    )
                  })}
                </Table.Body>
              </Table.Root>

              <Text fontSize="sm" color="gray.500">
                Tip: Use "Copy to All" to quickly apply the same hours to all days, 
                then adjust individual days as needed.
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  )
}

export default WeeklySchedule
