import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, User, Mail, Phone, MapPin, Globe, Briefcase, Code2, Navigation } from "lucide-react";

interface ReviewStepProps {
  form: UseFormReturn<any>;
}

export function ReviewStep({ form }: ReviewStepProps) {
  const values = form.getValues();

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-primary" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Company Name</p>
            <p className="text-base">{values.company.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-base">{values.company.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                Industry
              </p>
              <p className="text-base">{values.company.industry}</p>
            </div>
            {values.company.website && (
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Website
                </p>
                <p className="text-base truncate">{values.company.website}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </p>
              <p className="text-base">{values.company.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Phone
              </p>
              <p className="text-base">{values.company.phone}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Address
            </p>
            <p className="text-base">{values.company.address}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Country</p>
              <p className="text-base">{values.company.country_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">State</p>
              <p className="text-base">{values.company.state_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">City</p>
              <p className="text-base">{values.company.city_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-accent" />
            Administrator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
            <p className="text-base">{values.admin_user.full_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-base">{values.admin_user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Password</p>
            <p className="text-base">••••••••</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Main Branch Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Branch Name</p>
              <p className="text-base">{values.main_branch.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Code2 className="w-3 h-3" />
                Branch Code
              </p>
              <p className="text-base">{values.main_branch.code}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Address
            </p>
            <p className="text-base">{values.main_branch.address}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Postal Code</p>
              <p className="text-base">{values.main_branch.postal_code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Manager</p>
              <p className="text-base">{values.main_branch.manager_name}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </p>
              <p className="text-base">{values.main_branch.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Phone
              </p>
              <p className="text-base">{values.main_branch.phone}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Latitude
              </p>
              <p className="text-base">{values.main_branch.latitude}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Longitude
              </p>
              <p className="text-base">{values.main_branch.longitude}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Country</p>
              <p className="text-base">{values.main_branch.country_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">State</p>
              <p className="text-base">{values.main_branch.state_id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">City</p>
              <p className="text-base">{values.main_branch.city_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {values.registration_notes && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Registration Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base">{values.registration_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
