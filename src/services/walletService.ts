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
    // Try different possible localStorage keys
    const token = localStorage.getItem('auth_token') || 
                  localStorage.getItem('token') ||
                  localStorage.getItem('accessToken') ||
                  localStorage.getItem('jwtToken');
    
    if (token) {
      console.log('[Wallet API] Found auth token in localStorage');
      return token;
    }
    
    console.warn('[Wallet API] No auth token found in localStorage');
    return null;
  } catch (error) {
    console.error('[Wallet API] Error accessing localStorage:', error);
    return null;
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
  debugLog(response.url, 'Response', { status: response.status, ok: response.ok });
  
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    
    try {
      if (isJson) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        const text = await response.text();
        if (text) errorMessage = text;
      }
    } catch {
      // Ignore parsing errors, use default message
    }
    
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      console.warn('[Wallet API] Token expired, cleared from localStorage');
      throw new Error('Session expired. Please login again.');
    }
    
    throw new Error(errorMessage);
  }
  
  try {
    if (!isJson) {
      const text = await response.text();
      debugLog(response.url, 'Non-JSON response', text);
      return text;
    }
    
    const json = await response.json();
    debugLog(response.url, 'Parsed JSON', json);
    
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

export const walletService = {
  // Get current authentication status
  isAuthenticated(): boolean {
    const token = getAuthToken();
    return !!token;
  },

  // Get current user info
  getCurrentUser(): any | null {
    return getUserInfo();
  },

  // Logout (clear localStorage)
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    console.log('[Wallet API] User logged out');
  },

  async getBalance(): Promise<Balance> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}/wallet/balance`;
    debugLog(endpoint, 'GET Balance', { hasToken: !!token });
    
    if (!token) {
      console.error('[Wallet API] No auth token available');
      throw new Error('Authentication required. Please login.');
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
      
      // Handle different response formats
      return {
        usdc: data?.usdc?.toString() || 
              data?.usdcBalance?.toString() || 
              data?.balances?.usdc?.toString() || 
              '0.00',
        usdt: data?.usdt?.toString() || 
              data?.usdtBalance?.toString() || 
              data?.balances?.usdt?.toString() || 
              '0.00',
        total: data?.total?.toString() || 
               data?.totalBalance?.toString() || 
               data?.total?.toString() || 
               '0.00',
      };
    } catch (error: any) {
      console.error('[Wallet API] Error fetching balance:', error.message);
      
      // Check if it's an auth error
      if (error.message.includes('expired') || error.message.includes('401')) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      // Return default balance for other errors
      return {
        usdc: '0.00',
        usdt: '0.00',
        total: '0.00',
      };
    }
  },

  async getDepositAddresses(): Promise<DepositAddress[]> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}/wallet/deposit-addresses`;
    debugLog(endpoint, 'GET Deposit Addresses', { hasToken: !!token });
    
    if (!token) {
      throw new Error('Authentication required. Please login.');
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
      return ensureArray<DepositAddress>(data);
    } catch (error: any) {
      console.error('[Wallet API] Error fetching deposit addresses:', error.message);
      
      if (error.message.includes('expired') || error.message.includes('401')) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      return [];
    }
  },

  async getUSDCAddress(): Promise<DepositAddress> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}/api/v1/wallet/deposit-addresses/usdc`;
    debugLog(endpoint, 'GET USDC Address', { hasToken: !!token });
    
    if (!token) {
      throw new Error('Authentication required. Please login.');
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
      
      // Ensure the response matches DepositAddress interface
      return {
        currency: data?.currency || 'USDC',
        address: data?.address || data?.depositAddress || '',
        network: data?.network || data?.chain || 'Polygon',
      };
    } catch (error: any) {
      console.error('[Wallet API] Error fetching USDC address:', error.message);
      
      if (error.message.includes('expired') || error.message.includes('401')) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  },

  async getUSDTAddress(): Promise<DepositAddress> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}/wallet/deposit-addresses/usdt`;
    debugLog(endpoint, 'GET USDT Address', { hasToken: !!token });
    
    if (!token) {
      throw new Error('Authentication required. Please login.');
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
      
      if (error.message.includes('expired') || error.message.includes('401')) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}/wallet/transactions`;
    debugLog(endpoint, 'GET Transactions', { hasToken: !!token });
    
    if (!token) {
      throw new Error('Authentication required. Please login.');
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
      
      if (error.message.includes('expired') || error.message.includes('401')) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      return [];
    }
  },

  async getTransaction(txId: string): Promise<Transaction> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}/wallet/transactions/${txId}`;
    debugLog(endpoint, 'GET Transaction', { hasToken: !!token });
    
    if (!token) {
      throw new Error('Authentication required. Please login.');
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
      
      return await handleResponse(response);
    } catch (error: any) {
      console.error(`[Wallet API] Error fetching transaction ${txId}:`, error.message);
      
      if (error.message.includes('expired') || error.message.includes('401')) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      throw error;
    }
  },

  async getDeposits(): Promise<Transaction[]> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}/wallet/deposits`;
    debugLog(endpoint, 'GET Deposits', { hasToken: !!token });
    
    if (!token) {
      throw new Error('Authentication required. Please login.');
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
      console.error('[Wallet API] Error fetching deposits:', error.message);
      
      if (error.message.includes('expired') || error.message.includes('401')) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      return [];
    }
  },

  async getWithdrawals(): Promise<Transaction[]> {
    const token = getAuthToken();
    const endpoint = `${API_BASE_URL}/wallet/withdrawals`;
    debugLog(endpoint, 'GET Withdrawals', { hasToken: !!token });
    
    if (!token) {
      throw new Error('Authentication required. Please login.');
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
      console.error('[Wallet API] Error fetching withdrawals:', error.message);
      
      if (error.message.includes('expired') || error.message.includes('401')) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      return [];
    }
  },

  // Test the current token
  async testAuth(): Promise<{ valid: boolean; user?: any; error?: string }> {
    const token = getAuthToken();
    const user = getUserInfo();
    
    if (!token) {
      return { valid: false, error: 'No token found' };
    }
    
    try {
      // Try to get balance as a test
      const balance = await this.getBalance();
      return {
        valid: true,
        user,
        balance
      };
    } catch (error: any) {
      return {
        valid: false,
        user,
        error: error.message
      };
    }
  }
};