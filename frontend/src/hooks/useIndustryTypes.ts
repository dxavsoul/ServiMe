import { useQuery } from "@tanstack/react-query"
import { IndustryTypesService } from "../client"

// Hook to get industry name by ID
export const useIndustryName = (industryTypeId?: string | null) => {
  const { data: industryTypesData } = useQuery({
    queryKey: ["industry-types", "active"],
    queryFn: () => IndustryTypesService.readIndustryTypes({ 
      active_only: true, 
      limit: 100,
      skip: 0
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes - industry types don't change often
  })

  const industryTypes = industryTypesData?.data || []
  const industryType = industryTypes.find(type => type.id === industryTypeId)
  
  return industryType?.name || null
}

// Hook to get all industry types for mapping
export const useIndustryTypes = () => {
  const { data: industryTypesData, isLoading } = useQuery({
    queryKey: ["industry-types", "active"],
    queryFn: () => IndustryTypesService.readIndustryTypes({ 
      active_only: true, 
      limit: 100,
      skip: 0
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const industryTypes = industryTypesData?.data || []
  const industryTypesMap = industryTypes.reduce((acc, type) => {
    acc[type.id] = type.name
    return acc
  }, {} as Record<string, string>)

  return {
    industryTypes,
    industryTypesMap,
    isLoading
  }
}