import { RegistrationWizard } from "@/components/RegistrationWizard";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Register = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <RegistrationWizard />
      </div>
    </div>
  );
};

export default Register;
