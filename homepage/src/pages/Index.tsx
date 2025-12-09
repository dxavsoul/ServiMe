import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MapPin, Users, Building2, TrendingUp, CheckCircle, Sparkles } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import { useState, useEffect } from "react";

const Index = () => {
  const [professionalCount, setProfessionalCount] = useState(0);
  const [businessCount, setBusinessCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const professionalTarget = 10000;
    const businessTarget = 5000;
    const serviceTarget = 50000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setProfessionalCount(Math.floor(professionalTarget * progress));
      setBusinessCount(Math.floor(businessTarget * progress));
      setServiceCount(Math.floor(serviceTarget * progress));

      if (currentStep >= steps) {
        clearInterval(timer);
        setProfessionalCount(professionalTarget);
        setBusinessCount(businessTarget);
        setServiceCount(serviceTarget);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary opacity-10"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Location-Based Service Marketplace</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              Welcome to ServiMe
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              Connect companies and professionals with customers who need their services. 
              Discover local expertise, anytime, anywhere.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 h-14 shadow-elegant hover:shadow-glow transition-all">
                  Register Your Company
                </Button>
              </Link>
              <Button 
                size="lg" 
                className="text-lg px-8 h-14 shadow-elegant hover:shadow-glow transition-all"
                onClick={() => window.open('https://companies.servime.brainsolutions.nyc/', '_blank')}
              >
                Sign In
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ServiMe?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make it easy for service providers to reach customers and for customers to find the perfect professional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-primary/20 hover:shadow-card transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 shadow-glow">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Location-Based</CardTitle>
                <CardDescription>
                  Find services nearby with our advanced location matching technology
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-accent/20 hover:shadow-card transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-secondary flex items-center justify-center mb-4 shadow-glow">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Verified Professionals</CardTitle>
                <CardDescription>
                  All service providers are verified to ensure quality and reliability
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-secondary/20 hover:shadow-card transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-primary flex items-center justify-center mb-4 shadow-glow">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Business Growth</CardTitle>
                <CardDescription>
                  Expand your reach and grow your customer base with our platform
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-primary/20 hover:shadow-card transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center mb-4 shadow-glow">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Real-Time Updates</CardTitle>
                <CardDescription>
                  Get instant notifications and stay connected with your customers
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Started in Minutes</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of companies and professionals already using ServiMe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-glow">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Register Your Company</h3>
              <p className="text-muted-foreground">
                Fill out our simple registration form with your company details
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-glow">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Set Up Your Profile</h3>
              <p className="text-muted-foreground">
                Add your services, pricing, and availability to attract customers
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold shadow-glow">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Connecting</h3>
              <p className="text-muted-foreground">
                Begin receiving requests from customers in your area
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-accent to-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAtMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-lg mb-8 text-white/90">
              Join ServiMe today and start connecting with customers who need your services
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="text-lg px-8 h-14 shadow-elegant hover:shadow-glow transition-all">
                  Get Started Now
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-8 h-14 shadow-elegant hover:shadow-glow transition-all"
                onClick={() => window.open('https://companies.servime.brainsolutions.nyc/', '_blank')}
              >
                Sign In
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-1">{professionalCount.toLocaleString()}+</div>
                <div className="text-white/80">Active Professionals</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">{businessCount.toLocaleString()}+</div>
                <div className="text-white/80">Active Businesses</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">{serviceCount.toLocaleString()}+</div>
                <div className="text-white/80">Services Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-1">4.9/5</div>
                <div className="text-white/80">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ServiMe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
