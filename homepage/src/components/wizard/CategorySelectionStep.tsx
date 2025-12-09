import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiService, Category } from "@/lib/api";

interface CategorySelectionStepProps {
  form: UseFormReturn<any>;
}

export function CategorySelectionStep({ form }: CategorySelectionStepProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await apiService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const selectedCategoryId = form.watch("company.category_id");
  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="company.category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Category</FormLabel>
            <FormDescription>
              Select the category that best describes your business
            </FormDescription>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedCategory && (
        <div className="p-4 rounded-lg bg-muted space-y-2">
          <h4 className="font-semibold text-sm">Category Details</h4>
          {selectedCategory.description && (
            <p className="text-sm text-muted-foreground">{selectedCategory.description}</p>
          )}
          
          <div className="mt-4 space-y-1 text-xs">
            <h5 className="font-medium">Required Documentation:</h5>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              {selectedCategory.requires_business_license && <li>Business License</li>}
              {selectedCategory.requires_tax_id && <li>Tax ID</li>}
              {selectedCategory.requires_professional_license && <li>Professional License</li>}
              {selectedCategory.requires_incorporation_docs && <li>Incorporation Documents</li>}
              {selectedCategory.requires_personal_id && <li>Personal ID</li>}
            </ul>
            
            {selectedCategory.min_employees !== null && selectedCategory.max_employees !== null && (
              <p className="mt-2">
                <span className="font-medium">Employee Range:</span> {selectedCategory.min_employees} - {selectedCategory.max_employees}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
