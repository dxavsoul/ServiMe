import { useQuery } from "@tanstack/react-query"
import { CategoriesService } from "../client"

// Hook to get category name by ID
export const useCategoryName = (categoryId?: string | null) => {
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "active"],
    queryFn: () => CategoriesService.readCategories({ 
      active_only: true, 
      limit: 100,
      skip: 0
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  })

  const categories = categoriesData?.data || []
  const category = categories.find(cat => cat.id === categoryId)
  
  return category?.name || null
}

// Hook to get all categories for mapping
export const useCategories = () => {
  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories", "active"],
    queryFn: () => CategoriesService.readCategories({ 
      active_only: true, 
      limit: 100,
      skip: 0
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const categories = categoriesData?.data || []
  const categoriesMap = categories.reduce((acc, category) => {
    acc[category.id] = category.name
    return acc
  }, {} as Record<string, string>)

  return {
    categories,
    categoriesMap,
    isLoading
  }
}

// Hook to get category requirements by ID
export const useCategoryRequirements = (categoryId?: string | null) => {
  return useQuery({
    queryKey: ["category-requirements", categoryId],
    queryFn: () => CategoriesService.readCategoryRequirements({ 
      category_id: categoryId! 
    }),
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}