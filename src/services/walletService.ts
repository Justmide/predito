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
  return response.json();
};

export const walletService = {
  async getBalance(token?: string): Promise<Balance> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/balance`, { headers });
    return handleResponse(response);
  },

  async getDepositAddresses(token?: string): Promise<DepositAddress[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/deposit-addresses`, { headers });
    return handleResponse(response);
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
    return handleResponse(response);
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
    return handleResponse(response);
  },

  async getWithdrawals(token?: string): Promise<Transaction[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/withdrawals`, { headers });
    return handleResponse(response);
  },
};
