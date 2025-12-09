/// <reference types="google.maps" />
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationSelector } from "@/components/LocationSelector";
import { GooglePlacesAutocomplete } from "@/components/ui/google-places-autocomplete";

interface MainBranchStepProps {
  form: UseFormReturn<any>;
}

export function MainBranchStep({ form }: MainBranchStepProps) {
  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (place.formatted_address) {
      form.setValue("main_branch.address", place.formatted_address);
    }
    
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      form.setValue("main_branch.latitude", lat);
      form.setValue("main_branch.longitude", lng);
    }
  };

  return (
    <div className="space-y-4">
      {!googleApiKey && (
        <div className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
          <FormLabel className="text-sm font-medium mb-2 block">
            Google Maps API Key Missing
          </FormLabel>
          <p className="text-sm text-muted-foreground mb-3">
            Please add your Google Maps API key to the .env file as VITE_GOOGLE_MAPS_API_KEY.
            Get one from{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="main_branch.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Name</FormLabel>
              <FormControl>
                <Input placeholder="Headquarters" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="main_branch.code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Code</FormLabel>
              <FormControl>
                <Input placeholder="HQ" {...field} />
              </FormControl>
              <FormDescription>
                A short code to identify this branch
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="main_branch.address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Branch Address</FormLabel>
            <FormControl>
              {googleApiKey ? (
                <GooglePlacesAutocomplete
                  placeholder="Start typing address..."
                  apiKey={googleApiKey}
                  onPlaceSelected={handlePlaceSelected}
                  {...field}
                />
              ) : (
                <Input placeholder="123 Main Street, City, State" {...field} />
              )}
            </FormControl>
            <FormDescription>
              {googleApiKey ? "Start typing to search for an address" : "Enter the branch address manually"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="main_branch.postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postal Code</FormLabel>
              <FormControl>
                <Input placeholder="12345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="main_branch.manager_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Manager</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="main_branch.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="branch@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="main_branch.phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="main_branch.latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude</FormLabel>
              <FormControl>
                <Input 
                  type="hidden"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              {field.value && (
                <p className="text-sm text-muted-foreground">
                  {field.value}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="main_branch.longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude</FormLabel>
              <FormControl>
                <Input 
                  type="hidden"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              {field.value && (
                <p className="text-sm text-muted-foreground">
                  {field.value}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Branch Location</h3>
        <LocationSelector 
          form={form} 
          fieldPrefix="main_branch" 
          showDescription={true}
        />
      </div>

      <FormField
        control={form.control}
        name="registration_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Registration Notes (Optional)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any additional notes about this registration..."
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormDescription>
              Optional notes about the company registration
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}