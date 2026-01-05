import { API_BASE_URL } from '../lib/api';

export interface WithdrawalRequest {
  currency: string;
  amount: string;
  withdrawalAddress: string;
}

export interface WithdrawalStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currency: string;
  amount: string;
  withdrawalAddress: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export const withdrawalService = {
  async initiateWithdrawal(token: string, withdrawal: WithdrawalRequest) {
    const response = await fetch(`${API_BASE_URL}/withdraw/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(withdrawal),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initiate withdrawal');
    }
    
    return response.json();
  },

  async getWithdrawalStatus(token: string, withdrawalId: string): Promise<WithdrawalStatus> {
    const response = await fetch(`${API_BASE_URL}/withdraw/status/${withdrawalId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch withdrawal status');
    }
    
    return response.json();
  },
};
