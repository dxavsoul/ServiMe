import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { CategorySelectionStep } from "./wizard/CategorySelectionStep";
import { CompanyInfoStep } from "./wizard/CompanyInfoStep";
import { AdminUserStep } from "./wizard/AdminUserStep";
import { MainBranchStep } from "./wizard/MainBranchStep";
import { ReviewStep } from "./wizard/ReviewStep";
import { apiService, CompanyRegistrationData } from "@/lib/api";

const registrationSchema = z.object({
  company: z.object({
    name: z.string().min(1, "Company name is required").max(100),
    description: z.string().min(10, "Description must be at least 10 characters").max(500),
    industry_type_id: z.string().min(1, "Industry type is required"),
    category_id: z.string().min(1, "Category is required"),
    website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    email: z.string().email("Must be a valid email").max(255),
    phone: z.string().min(1, "Phone is required").max(20),
    address: z.string().min(1, "Address is required").max(200),
    country_id: z.string().min(1, "Country is required"),
    state_id: z.string().min(1, "State is required"),
    city_id: z.string().min(1, "City is required"),
  }),
  admin_user: z.object({
    email: z.string().email("Must be a valid email").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
    confirm_password: z.string().min(8, "Password must be at least 8 characters").max(100),
    full_name: z.string().min(1, "Full name is required").max(100),
  }).refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  }),
  main_branch: z.object({
    name: z.string().min(1, "Branch name is required").max(100),
    code: z.string().min(1, "Branch code is required").max(10),
    address: z.string().min(1, "Branch address is required").max(200),
    postal_code: z.string().min(1, "Postal code is required").max(20),
    phone: z.string().min(1, "Branch phone is required").max(20),
    email: z.string().email("Must be a valid email").max(255),
    manager_name: z.string().min(1, "Manager name is required").max(100),
    country_id: z.string().min(1, "Country is required"),
    state_id: z.string().min(1, "State is required"),
    city_id: z.string().min(1, "City is required"),
    latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
    longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  }),
  registration_notes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export function RegistrationWizard() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      company: {
        name: "",
        description: "",
        industry_type_id: "",
        category_id: "",
        website: "",
        email: "",
        phone: "",
        address: "",
        country_id: "",
        state_id: "",
        city_id: "",
      },
      admin_user: {
        email: "",
        password: "",
        confirm_password: "",
        full_name: "",
      },
      main_branch: {
        name: "",
        code: "",
        address: "",
        postal_code: "",
        phone: "",
        email: "",
        manager_name: "",
        country_id: "",
        state_id: "",
        city_id: "",
        latitude: 0,
        longitude: 0,
      },
      registration_notes: "",
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    
    try {
      // Transform form data to match API structure
      const registrationData: CompanyRegistrationData = {
        company: {
          name: data.company.name,
          description: data.company.description,
          industry_type_id: data.company.industry_type_id,
          category_id: data.company.category_id,
          website: data.company.website || undefined,
          email: data.company.email,
          phone: data.company.phone,
          address: data.company.address,
          city_id: data.company.city_id,
        },
        admin_user: {
          email: data.admin_user.email,
          password: data.admin_user.password,
          full_name: data.admin_user.full_name,
        },
        main_branch: {
          name: data.main_branch.name,
          code: data.main_branch.code,
          address: data.main_branch.address,
          postal_code: data.main_branch.postal_code,
          phone: data.main_branch.phone,
          email: data.main_branch.email,
          manager_name: data.main_branch.manager_name,
          city_id: data.main_branch.city_id,
          latitude: data.main_branch.latitude,
          longitude: data.main_branch.longitude,
        },
        registration_notes: data.registration_notes,
      };

      const response = await apiService.registerCompany(registrationData);

      // Navigate to success page with response data
      navigate("/registration-success", { state: { response } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    let isValid = false;
    
    if (step === 1) {
      isValid = await form.trigger(["company.category_id"]);
    } else if (step === 2) {
      isValid = await form.trigger([
        "company.name",
        "company.description",
        "company.industry_type_id",
        "company.website",
        "company.email",
        "company.phone",
        "company.address",
        "company.country_id",
        "company.state_id",
        "company.city_id",
      ]);
    } else if (step === 3) {
      isValid = await form.trigger([
        "admin_user.email",
        "admin_user.password",
        "admin_user.confirm_password",
        "admin_user.full_name",
      ]);
    } else if (step === 4) {
      isValid = await form.trigger([
        "main_branch.name",
        "main_branch.code",
        "main_branch.address",
        "main_branch.postal_code",
        "main_branch.phone",
        "main_branch.email",
        "main_branch.manager_name",
        "main_branch.country_id",
        "main_branch.state_id",
        "main_branch.city_id",
        "main_branch.latitude",
        "main_branch.longitude",
      ]);
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const steps = [
    { number: 1, title: "Category" },
    { number: 2, title: "Company Info" },
    { number: 3, title: "Admin User" },
    { number: 4, title: "Main Branch" },
    { number: 5, title: "Review" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s.number
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                </div>
                <span className="text-xs mt-2 text-center hidden sm:block">{s.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 rounded transition-all ${
                    step > s.number ? "bg-gradient-to-r from-primary to-accent" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 1 && "Select Your Business Category"}
            {step === 2 && "Company Information"}
            {step === 3 && "Admin User Details"}
            {step === 4 && "Main Branch Information"}
            {step === 5 && "Review & Submit"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Choose the category that best fits your business"}
            {step === 2 && "Tell us about your company"}
            {step === 3 && "Create an admin account"}
            {step === 4 && "Configure your main branch"}
            {step === 5 && "Review your information before submitting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && <CategorySelectionStep form={form} />}
              {step === 2 && <CompanyInfoStep form={form} />}
              {step === 3 && <AdminUserStep form={form} />}
              {step === 4 && <MainBranchStep form={form} />}
              {step === 5 && <ReviewStep form={form} />}

              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                {step < 5 ? (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="ml-auto">
                    {isSubmitting ? "Submitting..." : "Submit Registration"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
