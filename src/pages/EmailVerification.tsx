import { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { authService } from "@/services/authService";
import { toast } from "sonner";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [resendEmail, setResendEmail] = useState(location.state?.email || "");
  const [isResending, setIsResending] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (token: string) => {
    try {
      await authService.verifyAccount(token);
      setVerificationStatus('success');
      toast.success("Account verified successfully!");
    } catch (error: any) {
      setVerificationStatus('error');
      toast.error(error.message || "Verification failed.");
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);
    
    try {
      await authService.resendVerification(resendEmail);
      toast.success("Verification link resent successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification link.");
    } finally {
      setIsResending(false);
    }
  };

  if (token && verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Email Verified!</h1>
            <p className="text-muted-foreground">
              Your account has been successfully verified. You can now sign in and start trading.
            </p>
          </div>

          <Link to="/signin" className="block">
            <Button className="w-full">
              Go to Sign In
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (token && verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Verification Failed</h1>
            <p className="text-muted-foreground">
              The verification link is invalid or has expired. Please request a new one.
            </p>
          </div>

          <form onSubmit={handleResendVerification} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={isResending}>
              {isResending ? "Sending..." : "Resend Verification Link"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
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
          
          <form onSubmit={handleResendVerification} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email?
            </p>
            <Input
              type="email"
              placeholder="Enter your email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="outline" className="w-full" disabled={isResending}>
              {isResending ? "Sending..." : "Resend Verification Link"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default EmailVerification;
