// services/tradingService.ts
import { API_BASE_URL } from '../lib/api';

export interface Order {
  marketId: string;
  outcome: string;
  side: 'buy' | 'sell';
  size: string;
  price: string;
}

export interface Position {
  id: string;
  marketId: string;
  marketSlug?: string;
  marketQuestion?: string;
  outcome: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnlAmount: number;
  pnlPercentage: number;
  value: number;
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

export interface PnLSummary {
  totalPnL: number;
  totalPnLPercentage: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalValue: number;
  positions: Position[];
}

export const tradingService = {
  /**
   * Place a new order
   */
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

  /**
   * Get a specific order by ID
   */
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

  /**
   * Cancel an order
   */
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

  /**
   * Get all user positions with profit/loss calculations
   * THIS IS THE KEY METHOD FOR FETCHING USER PROFITS
   */
  async getPositions(token: string): Promise<Position[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/trading/positions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please sign in again');
        }
        throw new Error('Failed to fetch positions');
      }
      
      const data = await response.json();
      const positions = data.data || data.positions || data;
      
      // Normalize the position data
      return Array.isArray(positions) ? positions.map(this.normalizePosition) : [];
    } catch (error) {
      console.error('❌ getPositions error:', error);
      throw error;
    }
  },

  /**
   * Get position for a specific market
   */
  async getMarketPosition(token: string, marketId: string): Promise<Position | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/trading/positions/${marketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No position in this market
        }
        throw new Error('Failed to fetch market position');
      }
      
      const data = await response.json();
      return this.normalizePosition(data.data || data);
    } catch (error) {
      console.error('❌ getMarketPosition error:', error);
      return null;
    }
  },

  /**
   * Get trade history
   */
  async getTrades(token: string): Promise<Trade[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/trading/trades`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      
      const data = await response.json();
      return data.data || data.trades || data || [];
    } catch (error) {
      console.error('❌ getTrades error:', error);
      return [];
    }
  },

  /**
   * Get comprehensive PnL summary with all positions
   */
  async getPnL(token: string): Promise<PnLSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/trading/pnl`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch PnL');
      }
      
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('❌ getPnL error:', error);
      // Fallback: calculate from positions if PnL endpoint fails
      const positions = await this.getPositions(token);
      return this.calculatePnLFromPositions(positions);
    }
  },

  /**
   * Reconcile balance (sync with blockchain or external system)
   */
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

  /**
   * Normalize position data from backend
   */
  normalizePosition(pos: any): Position {
    const qty = Number(pos.quantity || pos.size || pos.amount || 0);
    const avg = Number(pos.avgPrice || pos.averagePrice || pos.entryPrice || 0);
    const curr = Number(pos.currentPrice || pos.price || pos.marketPrice || 0);
    
    // Calculate PnL if not provided by backend
    const pnlAmount = pos.pnlAmount !== undefined 
      ? Number(pos.pnlAmount) 
      : (curr - avg) * qty;
    
    const pnlPercentage = pos.pnlPercentage !== undefined 
      ? Number(pos.pnlPercentage) 
      : (avg > 0 ? ((curr - avg) / avg) * 100 : 0);

    return {
      id: pos.id || `${pos.marketId}-${pos.outcome}`,
      marketId: pos.marketId,
      marketSlug: pos.marketSlug || pos.slug,
      marketQuestion: pos.marketQuestion || pos.question || pos.title,
      outcome: pos.outcome,
      quantity: qty,
      avgPrice: avg,
      currentPrice: curr,
      pnlAmount,
      pnlPercentage,
      value: qty * curr
    };
  },

  /**
   * Calculate total PnL from positions array
   */
  calculatePnLFromPositions(positions: Position[]): PnLSummary {
    const totalPnL = positions.reduce((sum, pos) => sum + pos.pnlAmount, 0);
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    const totalCost = positions.reduce((sum, pos) => sum + (pos.quantity * pos.avgPrice), 0);
    
    const totalPnLPercentage = totalCost > 0 
      ? (totalPnL / totalCost) * 100 
      : 0;

    return {
      totalPnL,
      totalPnLPercentage,
      realizedPnL: 0, // Would need trade history to calculate
      unrealizedPnL: totalPnL, // All PnL is unrealized for open positions
      totalValue,
      positions
    };
  }
};