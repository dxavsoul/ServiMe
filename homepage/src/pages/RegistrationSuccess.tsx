import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";
import { CompanyRegistrationResponse } from "@/lib/api";

const RegistrationSuccess = () => {
  const location = useLocation();
  const response = location.state?.response as CompanyRegistrationResponse | undefined;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl shadow-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-glow">
              <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl">Registration Successful!</CardTitle>
          <CardDescription className="text-base mt-2">
            {response?.message || "Your company registration has been submitted successfully."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {response && (
            <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registration Status</p>
                <p className="text-base font-semibold capitalize">
                  {response.registration_status.replace("_", " ")}
                </p>
              </div>
              
              {response.company_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company ID</p>
                  <p className="text-base font-mono">{response.company_id}</p>
                </div>
              )}
              
              {response.next_steps && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Next Steps</p>
                  <p className="text-base">{response.next_steps}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Link to="/">
              <Button size="lg" className="gap-2">
                <Home className="w-4 h-4" />
                Go to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationSuccess;
