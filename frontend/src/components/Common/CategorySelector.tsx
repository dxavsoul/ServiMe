import { useQuery } from "@tanstack/react-query"
import { CategoriesService } from "../../client"
import { Field } from "../ui/field"

interface CategorySelectorProps {
  categoryId?: string | null
  onCategoryChange: (categoryId: string | null) => void
  required?: boolean
  errorText?: string
}

const CategorySelector = ({
  categoryId,
  onCategoryChange,
  required = false,
  errorText,
}: CategorySelectorProps) => {
  // Fetch categories
  const { data: categoriesData, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories", "active"],
    queryFn: () => CategoriesService.readCategories({ 
      active_only: true, 
      limit: 100,
      skip: 0
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
  })

  // Extract data array
  const categories = categoriesData?.data || []

  const handleCategoryChange = (newCategoryId: string | null) => {
    onCategoryChange(newCategoryId)
  }

  return (
    <Field
      required={required}
      invalid={!!errorText}
      errorText={errorText}
      label="Category"
    >
      <select
        value={categoryId || ""}
        onChange={(e) => handleCategoryChange(e.target.value || null)}
        disabled={loadingCategories}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: 'white',
        }}
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </Field>
  )
}

export default CategorySelector