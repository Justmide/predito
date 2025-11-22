// Restricted countries based on user specification
export const RESTRICTED_COUNTRIES = [
  'US', // United States
  'GB', // United Kingdom
  'FR', // France
  'SG', // Singapore
  'PL', // Poland
  'TH', // Thailand
  'AU', // Australia
  'BE', // Belgium
  'TW', // Taiwan
];

export interface GeoLocation {
  country: string;
  countryCode: string;
  isRestricted: boolean;
}

export const checkGeoRestriction = async (): Promise<GeoLocation> => {
  try {
    // Using ipapi.co for free IP geolocation
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error('Failed to fetch location');
    }

    const data = await response.json();
    const countryCode = data.country_code || '';
    
    return {
      country: data.country_name || 'Unknown',
      countryCode,
      isRestricted: RESTRICTED_COUNTRIES.includes(countryCode),
    };
  } catch (error) {
    console.error('Geo-restriction check failed:', error);
    // In case of error, allow access (fail-open approach)
    // You can change this to fail-closed if preferred
    return {
      country: 'Unknown',
      countryCode: '',
      isRestricted: false,
    };
  }
};
