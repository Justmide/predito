import { useEffect, useState } from 'react';
import { checkGeoRestriction, GeoLocation } from '@/services/geoService';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface GeoRestrictionProps {
  children: React.ReactNode;
}

const GeoRestriction = ({ children }: GeoRestrictionProps) => {
  const [geoStatus, setGeoStatus] = useState<{
    loading: boolean;
    location: GeoLocation | null;
  }>({
    loading: true,
    location: null,
  });

  useEffect(() => {
    const checkLocation = async () => {
      const location = await checkGeoRestriction();
      setGeoStatus({
        loading: false,
        location,
      });

      // Store in sessionStorage to avoid checking again during the session
      sessionStorage.setItem('geo_checked', 'true');
      sessionStorage.setItem('geo_restricted', location.isRestricted.toString());
      sessionStorage.setItem('geo_country', location.country);
    };

    // Check if we already verified in this session
    const alreadyChecked = sessionStorage.getItem('geo_checked');
    if (alreadyChecked) {
      const isRestricted = sessionStorage.getItem('geo_restricted') === 'true';
      const country = sessionStorage.getItem('geo_country') || 'Unknown';
      setGeoStatus({
        loading: false,
        location: {
          country,
          countryCode: '',
          isRestricted,
        },
      });
    } else {
      checkLocation();
    }
  }, []);

  if (geoStatus.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying location...</p>
        </div>
      </div>
    );
  }

  if (geoStatus.location?.isRestricted) {
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
              <strong>Detected location:</strong> {geoStatus.location.country}
            </p>
            <p className="text-xs">
              This platform complies with international regulations and is not accessible 
              from certain jurisdictions, including the United States, United Kingdom, 
              and other restricted territories.
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
