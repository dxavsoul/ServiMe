import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
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
import { apiService, Country, State, City } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface LocationSelectorProps {
  form: UseFormReturn<any>;
  fieldPrefix: string; // e.g., "company" or "main_branch"
  required?: boolean;
  showDescription?: boolean;
}

export function LocationSelector({ 
  form, 
  fieldPrefix, 
  required = true,
  showDescription = false 
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
  const { toast } = useToast();

  // Watch for changes in country and state selection
  const selectedCountryId = form.watch(`${fieldPrefix}.country_id`);
  const selectedStateId = form.watch(`${fieldPrefix}.state_id`);

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        const countriesData = await apiService.getCountries();
        setCountries(countriesData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load countries. Please refresh the page.",
        });
      } finally {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, [toast]);

  // Load states when country is selected
  useEffect(() => {
    const loadStates = async () => {
      if (!selectedCountryId) {
        setStates([]);
        setCities([]);
        return;
      }

      try {
        setLoadingStates(true);
        const statesData = await apiService.getStates(selectedCountryId);
        setStates(statesData);
        setCities([]); // Clear cities when country changes
        
        // Clear state and city selections
        form.setValue(`${fieldPrefix}.state_id`, "");
        form.setValue(`${fieldPrefix}.city_id`, "");
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load states for the selected country.",
        });
      } finally {
        setLoadingStates(false);
      }
    };

    loadStates();
  }, [selectedCountryId, form, fieldPrefix, toast]);

  // Load cities when state is selected
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedStateId) {
        setCities([]);
        return;
      }

      try {
        setLoadingCities(true);
        const citiesData = await apiService.getCities(selectedStateId);
        setCities(citiesData);
        
        // Clear city selection
        form.setValue(`${fieldPrefix}.city_id`, "");
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load cities for the selected state.",
        });
      } finally {
        setLoadingCities(false);
      }
    };

    loadCities();
  }, [selectedStateId, form, fieldPrefix, toast]);

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      <FormField
        control={form.control}
        name={`${fieldPrefix}.country_id`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country{required ? " *" : ""}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  {loadingCountries ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SelectValue placeholder="Select a country" />
                  )}
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showDescription && (
              <FormDescription>
                Select the country where this location is based
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* State Selection */}
      <FormField
        control={form.control}
        name={`${fieldPrefix}.state_id`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>State/Province{required ? " *" : ""}</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
              disabled={!selectedCountryId || loadingStates}
            >
              <FormControl>
                <SelectTrigger>
                  {loadingStates ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SelectValue placeholder="Select a state/province" />
                  )}
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state.id} value={state.id}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showDescription && (
              <FormDescription>
                Select the state or province
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* City Selection */}
      <FormField
        control={form.control}
        name={`${fieldPrefix}.city_id`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>City{required ? " *" : ""}</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
              disabled={!selectedStateId || loadingCities}
            >
              <FormControl>
                <SelectTrigger>
                  {loadingCities ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SelectValue placeholder="Select a city" />
                  )}
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {showDescription && (
              <FormDescription>
                Select the city for this location
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}