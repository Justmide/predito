import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

const EmailVerification = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Check your email</h1>
          <p className="text-muted-foreground">
            We've sent a verification link to your email address. Click the link to verify your account and start predicting.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Link to="/signin" className="block">
            <Button className="w-full">
              Go to Sign In
            </Button>
          </Link>
          
          <p className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder
          </p>
        </div>
      </Card>
    </div>
  );
};

export default EmailVerification;
