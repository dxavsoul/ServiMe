/// <reference types="google.maps" />
import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GooglePlacesAutocompleteProps
  extends Omit<React.ComponentProps<"input">, "onChange"> {
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  apiKey: string;
}

const GooglePlacesAutocomplete = React.forwardRef<
  HTMLInputElement,
  GooglePlacesAutocompleteProps
>(({ className, onPlaceSelected, apiKey, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useImperativeHandle(ref, () => inputRef.current!);

  React.useEffect(() => {
    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup is handled by browser
    };
  }, [apiKey]);

  React.useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      fields: ["formatted_address", "geometry", "address_components"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place && onPlaceSelected) {
        onPlaceSelected(place);
      }
    });

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, onPlaceSelected]);

  return (
    <Input
      ref={inputRef}
      className={cn(className)}
      {...props}
    />
  );
});

GooglePlacesAutocomplete.displayName = "GooglePlacesAutocomplete";

export { GooglePlacesAutocomplete };
