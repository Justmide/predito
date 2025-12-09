import { getAuthToken } from '@/utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetches the user's current wallet balance from the backend.
 * @returns {Promise<number>} The user's balance.
 */
const getWalletBalance = async (): Promise<number> => {
  const token = getAuthToken();
  if (!token) {
    console.error('getWalletBalance: No authentication token found.');
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/account/balance`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch wallet balance');
  }

  const data = await response.json();
  // Assuming the API returns a structure like { balance: 1234.56 }
  return data.balance;
};

export const walletService = {
  getWalletBalance,
};