const API_BASE_URL = 'https://predito-middleware.onrender.com/api/v1';

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

// Helper to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      const error = await response.json().catch(() => ({ message: 'Unauthorized' }));
      throw new Error(error.message || 'Token expired');
    }
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }
  const json = await response.json();
  // Handle wrapped responses like { status: 'success', data: [...] }
  return json.data !== undefined ? json.data : json;
};

// Helper to ensure array response
const ensureArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
};

export const walletService = {
  async getBalance(token?: string): Promise<Balance> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/balance`, { headers });
    const data = await handleResponse(response);
    // Return balance with defaults
    return {
      usdc: data?.usdc || '0.00',
      usdt: data?.usdt || '0.00',
      total: data?.total || '0.00',
    };
  },

  async getDepositAddresses(token?: string): Promise<DepositAddress[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/deposit-addresses`, { headers });
    const data = await handleResponse(response);
    return ensureArray(data);
  },

  async getUSDCAddress(token?: string): Promise<DepositAddress> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/deposit-addresses/usdc`, { headers });
    return handleResponse(response);
  },

  async getUSDTAddress(token?: string): Promise<DepositAddress> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/deposit-addresses/usdt`, { headers });
    return handleResponse(response);
  },

  async getTransactions(token?: string): Promise<Transaction[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/transactions`, { headers });
    const data = await handleResponse(response);
    return ensureArray(data);
  },

  async getTransaction(token: string, txId: string): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/wallet/transactions/${txId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  async getDeposits(token?: string): Promise<Transaction[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/deposits`, { headers });
    const data = await handleResponse(response);
    return ensureArray(data);
  },

  async getWithdrawals(token?: string): Promise<Transaction[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/withdrawals`, { headers });
    const data = await handleResponse(response);
    return ensureArray(data);
  },
};
