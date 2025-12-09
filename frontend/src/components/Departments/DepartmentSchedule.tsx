import { useState } from "react"
import {
  Container,
  Heading,
  VStack,
  Text,
  Button,
  HStack,
  Badge,
  Table,
  Card,
} from "@chakra-ui/react"
import { FiClock, FiPlus, FiEdit } from "react-icons/fi"

import WeeklySchedule from "./WeeklySchedule"
import AddSchedule from "./AddSchedule"

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

interface DepartmentScheduleProps {
  department: DepartmentPublic
}

// Mock data for department hours
const mockHours: DepartmentHourPublic[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174010",
    day_of_week: "monday",
    open_time: "08:00:00",
    close_time: "18:00:00",
    is_closed: false,
    department_id: "123e4567-e89b-12d3-a456-426614174001"
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174011",
    day_of_week: "tuesday",
    open_time: "08:00:00",
    close_time: "18:00:00",
    is_closed: false,
    department_id: "123e4567-e89b-12d3-a456-426614174001"
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174012",
    day_of_week: "sunday",
    open_time: null,
    close_time: null,
    is_closed: true,
    department_id: "123e4567-e89b-12d3-a456-426614174001"
  }
]

const DepartmentSchedule = ({ department }: DepartmentScheduleProps) => {
  const [hours] = useState<DepartmentHourPublic[]>(mockHours)
  const [isAddingSchedule, setIsAddingSchedule] = useState(false)
  const [isManagingWeekly, setIsManagingWeekly] = useState(false)

  const daysOfWeek = [
    "monday", "tuesday", "wednesday", "thursday", 
    "friday", "saturday", "sunday"
  ]

  const formatTime = (time: string | null) => {
    if (!time) return "N/A"
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getHourForDay = (day: string) => {
    return hours.find(hour => hour.day_of_week === day)
  }

  if (isManagingWeekly) {
    return (
      <WeeklySchedule 
        department={department} 
        currentHours={hours}
        onBack={() => setIsManagingWeekly(false)}
      />
    )
  }

  return (
    <Container maxW="4xl">
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Card.Root>
          <Card.Header>
            <HStack justify="space-between" align="start">
              <VStack align="start" gap={2}>
                <HStack align="center" gap={3}>
                  <FiClock size="24px" />
                  <Heading size="lg">Department Schedule</Heading>
                </HStack>
                <Text color="gray.500" fontSize="sm">
                  Manage operating hours for {department.name}
                </Text>
              </VStack>
              <HStack gap={2}>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsManagingWeekly(true)}
                >
                  <FiEdit />
                  Manage Weekly
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setIsAddingSchedule(true)}
                >
                  <FiPlus />
                  Add Day
                </Button>
              </HStack>
            </HStack>
          </Card.Header>
        </Card.Root>

        {/* Schedule Overview */}
        <Card.Root>
          <Card.Body>
            <VStack gap={4} align="stretch">
              <Heading size="md">Current Schedule</Heading>
              
              {hours.length === 0 ? (
                <Text color="gray.500" textAlign="center" py={8}>
                  No schedule configured yet. Add operating hours to get started.
                </Text>
              ) : (
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Day</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Open Time</Table.ColumnHeader>
                      <Table.ColumnHeader>Close Time</Table.ColumnHeader>
                      <Table.ColumnHeader>Actions</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {daysOfWeek.map((day) => {
                      const dayHour = getHourForDay(day)
                      return (
                        <Table.Row key={day}>
                          <Table.Cell>
                            <Text fontWeight="medium" textTransform="capitalize">
                              {day}
                            </Text>
                          </Table.Cell>
                          <Table.Cell>
                            {dayHour ? (
                              <Badge 
                                variant={dayHour.is_closed ? "subtle" : "solid"}
                                colorScheme={dayHour.is_closed ? "gray" : "green"}
                              >
                                {dayHour.is_closed ? "Closed" : "Open"}
                              </Badge>
                            ) : (
                              <Badge variant="subtle" colorScheme="gray">
                                Not Set
                              </Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            {dayHour ? formatTime(dayHour.open_time) : "N/A"}
                          </Table.Cell>
                          <Table.Cell>
                            {dayHour ? formatTime(dayHour.close_time) : "N/A"}
                          </Table.Cell>
                          <Table.Cell>
                            <Button 
                              size="xs" 
                              variant="outline"
                              onClick={() => setIsAddingSchedule(true)}
                            >
                              {dayHour ? "Edit" : "Add"}
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      )
                    })}
                  </Table.Body>
                </Table.Root>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>

      {/* Add Schedule Modal */}
      <AddSchedule
        department={department}
        isOpen={isAddingSchedule}
        onClose={() => setIsAddingSchedule(false)}
        onSuccess={() => {
          // TODO: Refresh department hours data when real API integration is implemented
          console.log("Schedule added successfully - would refresh data here")
        }}
      />
    </Container>
  )
}

export default DepartmentSchedule
