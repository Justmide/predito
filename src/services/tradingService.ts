const API_BASE_URL = 'https://predito-middleware.onrender.com/api/v1';

export interface Order {
  marketId: string;
  outcome: string;
  side: 'buy' | 'sell';
  size: string;
  price: string;
}

export interface Position {
  marketId: string;
  outcome: string;
  size: string;
  avgPrice: string;
  currentValue: string;
  pnl: string;
}

export interface Trade {
  id: string;
  marketId: string;
  outcome: string;
  side: 'buy' | 'sell';
  size: string;
  price: string;
  timestamp: string;
}

export const tradingService = {
  async placeOrder(token: string, order: Order) {
    const response = await fetch(`${API_BASE_URL}/trading/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(order),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to place order');
    }
    
    return response.json();
  },

  async getOrder(token: string, orderId: string) {
    const response = await fetch(`${API_BASE_URL}/trading/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    
    return response.json();
  },

  async cancelOrder(token: string, orderId: string) {
    const response = await fetch(`${API_BASE_URL}/trading/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }
    
    return response.json();
  },

  async getPositions(token: string): Promise<Position[]> {
    const response = await fetch(`${API_BASE_URL}/trading/positions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch positions');
    }
    
    return response.json();
  },

  async getMarketPosition(token: string, marketId: string): Promise<Position> {
    const response = await fetch(`${API_BASE_URL}/trading/positions/${marketId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch market position');
    }
    
    return response.json();
  },

  async getTrades(token: string): Promise<Trade[]> {
    const response = await fetch(`${API_BASE_URL}/trading/trades`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch trades');
    }
    
    return response.json();
  },

  async getPnL(token: string) {
    const response = await fetch(`${API_BASE_URL}/trading/pnl`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch PnL');
    }
    
    return response.json();
  },

  async reconcileBalance(token: string) {
    const response = await fetch(`${API_BASE_URL}/trading/reconcile-balance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to reconcile balance');
    }
    
    return response.json();
  },
};
