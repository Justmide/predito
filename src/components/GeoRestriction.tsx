import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface GeoRestrictionProps {
  children: React.ReactNode;
}

const GeoRestriction = ({ children }: GeoRestrictionProps) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detectedTimezone, setDetectedTimezone] = useState("");

  useEffect(() => {
    const checkTimezone = () => {
      try {
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setDetectedTimezone(userTimezone);
        
        // Only block if explicitly Africa/Lagos (weaker restriction, bypassable with VPN)
        if (userTimezone.includes("Lagos")) {
          setIsBlocked(true);
        } else {
          setIsBlocked(false);
        }
      } catch (error) {
        console.error('Timezone check failed:', error);
        // Fail open - allow access if check fails
        setIsBlocked(false);
      }
      setLoading(false);
    };

    checkTimezone();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying location...</p>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
        <Card className="max-w-md p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Access Restricted
            </h1>
            <p className="text-muted-foreground">
              We're sorry, but Predito is not available in your region.
            </p>
          </div>

          <div className="pt-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Detected timezone:</strong> {detectedTimezone}
            </p>
            <p className="text-xs">
              This platform complies with international regulations and is not accessible 
              from certain jurisdictions.
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default GeoRestriction;
