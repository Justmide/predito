import { AUTH_API_BASE_URL as API_BASE_URL } from '../lib/api';

export const authService = {
  async register(username: string, email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    return response.json();
  },

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  },

  async verifyAccount(token: string) {
    const response = await fetch(`${API_BASE_URL}/verifyAccount/${token}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Verification failed');
    }
    
    return response.json();
  },

  async requestPasswordReset(email: string) {
    const response = await fetch(`${API_BASE_URL}/request-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset request failed');
    }
    
    return response.json();
  },

  async resetPassword(token: string, newPassword: string) {
    const response = await fetch(`${API_BASE_URL}/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password reset failed');
    }
    
    return response.json();
  },

  async resendVerification(email: string) {
    const response = await fetch(`${API_BASE_URL}/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Resend verification failed');
    }
    
    return response.json();
  },
};
