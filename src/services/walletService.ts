import { log } from 'console';
import { API_BASE_URL } from '../lib/api';

export interface Balance {
  usdc: string;
  usdt: string;
  total: string;
}

export interface DepositAddress {
  currency: string;
  address: string;
  network: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade';
  currency: string;
  amount: string;
  status: string;
  timestamp: string;
  txHash?: string;
}


// Debug helper
const debugLog = (endpoint: string, method: string, data?: any) => {
  console.log(`[Wallet API] ${method} ${endpoint}`, data || '');
};

// Get token from localStorage
const getAuthToken = (): string | null => {
  try {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      console.log('[Wallet API] Found auth_token in localStorage');
      return token;
    }
    
    console.warn('[Wallet API] No auth_token found in localStorage');
    return null;
  } catch (error) {
    console.error('[Wallet API] Error accessing localStorage:', error);
    return null;
  }
};

// Check if token is expired (basic JWT expiration check)
const isTokenExpired = (token: string): boolean => {
  try {
    // JWT tokens are in format: header.payload.signature
    const payload = token.split('.')[1];
    if (!payload) return false;
    
    const decodedPayload = JSON.parse(atob(payload));
    const expiryTime = decodedPayload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // Check if token expired (with 60 second buffer)
    const isExpired = currentTime >= (expiryTime - 60000);
    
    if (isExpired) {
      console.log('[Wallet API] Token is expired or about to expire');
    }
    
    return isExpired;
  } catch (error) {
    console.error('[Wallet API] Error checking token expiry:', error);
    return false; // If we can't parse, don't assume it's expired
  }
};

// Get user info from localStorage
const getUserInfo = (): any | null => {
  try {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('[Wallet API] Found user:', user.id);
      return user;
    }
    return null;
  } catch (error) {
    console.error('[Wallet API] Error parsing user info:', error);
    return null;
  }
};

// Helper to handle API responses
const handleResponse = async (response: Response): Promise<any> => {
  const url = new URL(response.url);
  const endpoint = url.pathname;
  debugLog(endpoint, 'Response', { 
    status: response.status, 
    ok: response.ok,
    statusText: response.statusText 
  });
  
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    
    try {
      if (isJson) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('[Wallet API] Error response:', errorData);
      } else {
        const text = await response.text();
        if (text) errorMessage = text;
      }
    } catch {
      // Ignore parsing errors, use default message
    }
    
    // Only clear localStorage for 401 if token exists
    if (response.status === 401) {
      console.warn('[Wallet API] 401 Unauthorized response');
      throw new Error('UNAUTHORIZED_401'); // Special error code
    }
    
    throw new Error(errorMessage);
  }
  
  try {
    if (!isJson) {
      const text = await response.text();
      debugLog(endpoint, 'Non-JSON response', text);
      return text;
    }
    
    const json = await response.json();
    debugLog(endpoint, 'Parsed JSON', json);
    
    // Handle various response formats
    if (json.data !== undefined) {
      return json.data;
    }
    if (json.status === 'success' && json.result !== undefined) {
      return json.result;
    }
    if (json.error) {
      throw new Error(json.error);
    }
    
    return json;
  } catch (error) {
    console.error('[Wallet API] Parse error:', error);
    throw new Error('Failed to parse server response');
  }
};

// Helper to ensure array response with proper typing
const ensureArray = <T>(data: any): T[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray(data.data)) return data.data as T[];
  if (data && Array.isArray(data.result)) return data.result as T[];
  return [];
};

// All endpoints should start with /api/v1/wallet
const WALLET_BASE_PATH = '/wallet';

export const walletService = {
  // Get current authentication status
  isAuthenticated(): boolean {
    const token = getAuthToken();
    if (!token) return false;
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      console.log('[Wallet API] Token is expired');
      return false;
    }
    
    return true;
  },

  // Get current user info
  getCurrentUser(): any | null {
    return getUserInfo();
  },

  // Check if token is valid without making API call
  checkTokenValidity(): { valid: boolean; reason?: string } {
    const token = getAuthToken();
    
    if (!token) {
      return { valid: false, reason: 'No token found' };
    }
    
    if (isTokenExpired(token)) {
      return { valid: false, reason: 'Token expired' };
    }
    
    return { valid: true };
  },

  // Soft logout (only clears wallet data, not auth)
  softLogout(): void {
    console.log('[Wallet API] Soft logout - clearing wallet data only');
    // Don't clear auth_token here, let AuthContext handle that
  },

  // Full logout (clears everything)
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    console.log('[Wallet API] Full logout - cleared all auth data');
  },
/**
   * GET BALANCE
   * FIXED: Maps generic "balance" to USDT because that is where scanner credits funds.
   */
  async getBalance(suppressErrors = false): Promise<Balance> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}${WALLET_BASE_PATH}/balance`;
    
    if (!token || isTokenExpired(token)) {
      if (suppressErrors) return this.getDefaultBalance();
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        method: 'GET',
      });
      
      const data = await handleResponse(response);
      
      // LOGIC FIX: Prioritize mapping the main balance to USDT
      // because the scanner records deposits as USDT.
      const usdtVal = data?.usdt || data?.usdtBalance || data?.balance || data?.availableBalance || '0';
      const usdcVal = data?.usdc || data?.usdcBalance || '0';

      return {
        usdt: parseFloat(usdtVal).toFixed(2),
        usdc: parseFloat(usdcVal).toFixed(2),
        total: (parseFloat(usdtVal) + parseFloat(usdcVal)).toFixed(2),
      };
    } catch (error: any) {
      if (suppressErrors) return this.getDefaultBalance();
      throw error;
    }
  },

  // Helper to get default balance
    getDefaultBalance(): Balance {
    return {
      usdc: '0.00',
      usdt: '0.00',
      total: '0.00',
    };
  },

  async getDepositAddresses(suppressErrors = false): Promise<DepositAddress[]> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}${WALLET_BASE_PATH}/deposit-addresses`;
    
    if (!token) {
      if (!suppressErrors) {
        throw new Error('Authentication required. Please login.');
      }
      return [];
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    try {
      const response = await fetch(endpoint, {
        headers,
        method: 'GET',
      });
      
      const data = await handleResponse(response);
      
      // If data is an object, transform it into an array of DepositAddress
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return Object.entries(data)
          .filter(([, details]) => typeof details === 'object' && details !== null) // Filter out non-object values like the 'note'
          .map(([currency, details]: [string, any]) => ({
            currency: currency.toUpperCase(),
            address: details.address || details.depositAddress || '',
            network: details.network || details.chain || 'Polygon',
          }));
      }
      
      return ensureArray<DepositAddress>(data);
    } catch (error: any) {
      console.error('[Wallet API] Error fetching deposit addresses:', error.message);
      
      if (error.message === 'UNAUTHORIZED_401' && !suppressErrors) {
        throw new Error('UNAUTHORIZED_401');
      }
      
      if (suppressErrors) {
        return [];
      }
      
      throw error;
    }
  },

  async getUSDCAddress(suppressErrors = false): Promise<DepositAddress> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}${WALLET_BASE_PATH}/deposit-addresses/usdc`;
    
    if (!token) {
      if (!suppressErrors) {
        throw new Error('Authentication required. Please login.');
      }
      return this.getDefaultAddress('USDC');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    try {
      const response = await fetch(endpoint, {
        headers,
        method: 'GET',
      });
      
      const data = await handleResponse(response);
      console.log(data);
      
      return {
        currency: data?.currency || 'USDC',
        address: data.usdc?.address,     
        network: data?.network || data?.chain || 'Polygon',
      };
    } catch (error: any) {
      console.error('[Wallet API] Error fetching USDC address:', error.message);
      
      if (error.message === 'UNAUTHORIZED_401' && !suppressErrors) {
        throw new Error('UNAUTHORIZED_401');
      }
      
      if (suppressErrors) {
        return this.getDefaultAddress('USDC');
      }
      
      throw error;
    }
  },

  async getUSDTAddress(suppressErrors = false): Promise<DepositAddress> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}${WALLET_BASE_PATH}/deposit-addresses/usdt`;
    
    if (!token) {
      if (!suppressErrors) {
        throw new Error('Authentication required. Please login.');
      }
      return this.getDefaultAddress('USDT');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    try {
      const response = await fetch(endpoint, {
        headers,
        method: 'GET',
      });
      
      const data = await handleResponse(response);
      
      return {
        currency: data?.currency || 'USDT',
        address: data?.address || data?.depositAddress || '',
        network: data?.network || data?.chain || 'Polygon',
      };
    } catch (error: any) {
      console.error('[Wallet API] Error fetching USDT address:', error.message);
      
      if (error.message === 'UNAUTHORIZED_401' && !suppressErrors) {
        throw new Error('UNAUTHORIZED_401');
      }
      
      if (suppressErrors) {
        return this.getDefaultAddress('USDT');
      }
      
      throw error;
    }
  },

  // Helper for default address
   getDefaultAddress(currency: string): DepositAddress {
    return {
      currency,
      address: '',
      network: 'Polygon',
    };
  },

  async getTransactions(suppressErrors = false): Promise<Transaction[]> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}${WALLET_BASE_PATH}/transactions`;
    
    if (!token) {
      if (!suppressErrors) {
        throw new Error('Authentication required. Please login.');
      }
      return [];
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    try {
      const response = await fetch(endpoint, {
        headers,
        method: 'GET',
      });
      
      const data = await handleResponse(response);
      return ensureArray<Transaction>(data);
    } catch (error: any) {
      console.error('[Wallet API] Error fetching transactions:', error.message);
      
      if (error.message === 'UNAUTHORIZED_401' && !suppressErrors) {
        throw new Error('UNAUTHORIZED_401');
      }
      
      if (suppressErrors) {
        return [];
      }
      
      throw error;
    }
  },

  // Test the current token (with optional error suppression)
  async testAuth(suppressErrors = false): Promise<{ 
    valid: boolean; 
    user?: any; 
    error?: string;
    balance?: Balance;
  }> {
    const token = getAuthToken();
    const user = getUserInfo();
    
    if (!token) {
      return { 
        valid: false, 
        user,
        error: 'No token found' 
      };
    }
    
    // Check token expiry first
    if (isTokenExpired(token)) {
      return { 
        valid: false, 
        user,
        error: 'Token expired' 
      };
    }
    
    try {
      // Try to get balance as a test (with error suppression)
      const balance = await this.getBalance(true); // suppressErrors = true
      return {
        valid: true,
        user,
        balance
      };
    } catch (error: any) {
      console.log('[Wallet API] testAuth caught error:', error.message);
      
      // If we get 401 in testAuth, token is invalid
      if (error.message === 'UNAUTHORIZED_401') {
        return {
          valid: false,
          user,
          error: 'Invalid token'
        };
      }
      
      // For network errors, token might still be valid
      if (error.message.includes('Network error') || 
          error.message.includes('Failed to fetch')) {
        return {
          valid: true, // Assume token is still valid
          user,
          error: 'Network issue'
        };
      }
      
      if (suppressErrors) {
        return {
          valid: false,
          user,
          error: error.message
        };
      }
      
      return {
        valid: false,
        user,
        error: error.message
      };
    }
  },

  // Refresh token (if your backend supports it)
  async refreshToken(): Promise<{ success: boolean; token?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // For refresh token in cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          console.log('[Wallet API] Token refreshed successfully');
          return { success: true, token: data.token };
        }
      }
      return { success: false };
    } catch (error) {
      console.error('[Wallet API] Error refreshing token:', error);
      return { success: false };
    }
  }
};