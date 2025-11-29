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

export const walletService = {
  async getBalance(token?: string): Promise<Balance> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/balance`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }
    
    return response.json();
  },

  async getDepositAddresses(token?: string): Promise<DepositAddress[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/deposit-addresses`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch deposit addresses');
    }
    
    return response.json();
  },

  async getUSDCAddress(token?: string): Promise<DepositAddress> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/deposit-addresses/usdc`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch USDC address');
    }
    
    return response.json();
  },

  async getUSDTAddress(token?: string): Promise<DepositAddress> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/deposit-addresses/usdt`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch USDT address');
    }
    
    return response.json();
  },

  async getTransactions(token?: string): Promise<Transaction[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/transactions`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    
    return response.json();
  },

  async getTransaction(token: string, txId: string): Promise<Transaction> {
    const response = await fetch(`${API_BASE_URL}/wallet/transactions/${txId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch transaction');
    }
    
    return response.json();
  },

  async getDeposits(token?: string): Promise<Transaction[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/deposits`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch deposits');
    }
    
    return response.json();
  },

  async getWithdrawals(token?: string): Promise<Transaction[]> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/wallet/withdrawals`, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch withdrawals');
    }
    
    return response.json();
  },
};
