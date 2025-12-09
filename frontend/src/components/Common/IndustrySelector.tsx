import { useQuery } from "@tanstack/react-query"
import { IndustryTypesService } from "../../client"
import { Field } from "../ui/field"

interface IndustrySelectorProps {
  industryTypeId?: string | null
  onIndustryChange: (industryTypeId: string | null) => void
  required?: boolean
  errorText?: string
}

const IndustrySelector = ({
  industryTypeId,
  onIndustryChange,
  required = false,
  errorText,
}: IndustrySelectorProps) => {
  // Fetch industry types
  const { data: industryTypesData, isLoading: loadingIndustryTypes } = useQuery({
    queryKey: ["industry-types", "active"],
    queryFn: () => IndustryTypesService.readIndustryTypes({ 
      active_only: true, 
      limit: 100,
      skip: 0
    }),
    staleTime: 10 * 60 * 1000, // 10 minutes - industry types don't change often
  })

  // Extract data array
  const industryTypes = industryTypesData?.data || []

  const handleIndustryChange = (newIndustryTypeId: string | null) => {
    onIndustryChange(newIndustryTypeId)
  }

  return (
    <Field
      required={required}
      invalid={!!errorText}
      errorText={errorText}
      label="Industry"
    >
      <select
        value={industryTypeId || ""}
        onChange={(e) => handleIndustryChange(e.target.value || null)}
        disabled={loadingIndustryTypes}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #E2E8F0',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: 'white',
        }}
      >
        <option value="">Select an industry</option>
        {industryTypes.map((industryType) => (
          <option key={industryType.id} value={industryType.id}>
            {industryType.name}
          </option>
        ))}
      </select>
    </Field>
  )
}

export default IndustrySelector