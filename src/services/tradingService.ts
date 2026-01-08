// services/tradingService.ts
import { API_BASE_URL } from '../lib/api';

export interface Order {
  marketId: string;
  marketSlug?: string; // CRITICAL: Add this for profit calculation
  outcome: string;
  side: 'buy' | 'sell';
  size: string;
  price: string;
  amount?: string | number; // Alternative field name
}

export interface ProfitPreviewRequest {
  marketSlug: string;
  outcome: string;
  side: 'BUY' | 'SELL'; // Backend expects uppercase
  price: number;
  size: number;
}

export interface ProfitPreviewResponse {
  market: {
    slug: string;
    question: string;
    outcome: string;
  };
  bet: {
    side: string;
    price: number;
    size: number;
  };
  profit: {
    cost: number;
    maxReturn: number;
    potentialProfit: number;
    roi: number;
    breakEvenPrice: number;
  };
  userBalance: {
    available: number;
    sufficient: boolean;
    remainingAfterBet: number | null;
  };
  scenarios: {
    ifWin: {
      return: number;
      profit: number;
      roi: number;
    };
    ifLose: {
      loss: number;
      roi: number;
    };
  };
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
  costBasis?: number;
  unrealizedPnL?: number;
  percentageGain?: number;
}

export interface Trade {
  id: string;
  marketId: string;
  outcome: string;
  side: 'buy' | 'sell';
  size: string;
  price: string;
  timestamp: string;
  profit?: number; // Profit/loss from this trade
}

export interface PnLSummary {
  totalPnL: number;
  totalPnLPercentage: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalValue: number;
  positions: Position[];
  walletBalance: number;
  totalPortfolioValue: number;
}

export const tradingService = {
  /**
   * Place a new order with profit calculation
   * FIXED: Now includes marketSlug for backend profit calculation
   */
  async placeOrder(token: string, order: Order) {
    console.log('📤 Placing order:', order);
    
    // Ensure we have both marketId and marketSlug
    if (!order.marketSlug && order.marketId) {
      console.warn('⚠️ No marketSlug provided, profit calculation may fail');
    }
    
    // Normalize the order data for backend
    const orderData = {
      marketId: order.marketId,
      marketSlug: order.marketSlug, // CRITICAL FOR PROFIT CALC
      outcome: order.outcome,
      side: order.side.toUpperCase(), // Backend expects 'BUY'/'SELL'
      price: parseFloat(order.price),
      size: parseFloat(order.size || order.amount as string || '0'),
      amount: parseFloat(order.amount as string || order.size || '0')
    };

    const response = await fetch(`${API_BASE_URL}/trading/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Order failed:', error);
      throw new Error(error.message || error.error || 'Failed to place order');
    }
    
    const result = await response.json();
    console.log('✅ Order placed:', result);
    return result;
  },

  /**
   * Preview profit before placing order
   * This is the key method to show users their potential profit
   */
  async previewProfit(token: string, previewData: ProfitPreviewRequest): Promise<ProfitPreviewResponse> {
    try {
      console.log('📊 Previewing profit:', previewData);
      
      const response = await fetch(`${API_BASE_URL}/trading/bet/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(previewData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to preview profit');
      }
      
      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('❌ Profit preview error:', error);
      throw error;
    }
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
   * ENHANCED: Better normalization and error handling
   */
  async getPositions(token: string): Promise<Position[]> {
    try {
      console.log('📊 Fetching positions...');
      const response = await fetch(`${API_BASE_URL}/trading/positions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - please sign in again');
        }
        console.error('❌ Positions fetch failed:', response.status);
        return [];
      }
      
      const data = await response.json();
      console.log('📊 Raw positions data:', data);
      
      // Handle different response structures
      let positions = [];
      if (data.data && Array.isArray(data.data)) {
        positions = data.data;
      } else if (Array.isArray(data.positions)) {
        positions = data.positions;
      } else if (Array.isArray(data)) {
        positions = data;
      }
      
      // Normalize each position with profit calculation
      const normalizedPositions = positions.map((pos: any, index: number) => 
        this.normalizePosition(pos, index)
      );
      
      console.log(`✅ Fetched ${normalizedPositions.length} positions`);
      return normalizedPositions;
    } catch (error) {
      console.error('❌ getPositions error:', error);
      return [];
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
   * Get trade history with profit/loss calculations
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
      const trades = data.data || data.trades || data || [];
      
      // Calculate profit for each trade if not provided
      return trades.map((trade: any) => ({
        id: trade.id || trade.tradeId,
        marketId: trade.marketId,
        outcome: trade.outcome,
        side: trade.side?.toLowerCase(),
        size: trade.size || trade.amount,
        price: trade.price,
        timestamp: trade.timestamp || trade.createdAt,
        profit: trade.profit || this.calculateTradeProfit(trade)
      }));
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
        console.log('📊 PnL endpoint failed, calculating from positions...');
        const positions = await this.getPositions(token);
        return this.calculatePnLFromPositions(positions, 0); // TODO: Get actual wallet balance
      }
      
      const data = await response.json();
      
      if (data.data) {
        return data.data;
      } else if (data.summary) {
        // Handle the summary structure from your backend
        const positions = await this.getPositions(token);
        return {
          totalPnL: data.summary.totalUnrealizedPnL || 0,
          totalPnLPercentage: 0,
          realizedPnL: 0,
          unrealizedPnL: data.summary.totalUnrealizedPnL || 0,
          totalValue: data.summary.totalPortfolioValue || 0,
          walletBalance: data.summary.walletBalance || 0,
          totalPortfolioValue: data.summary.totalPortfolioValue || 0,
          positions
        };
      }
      
      return data;
    } catch (error) {
      console.error('❌ getPnL error:', error);
      const positions = await this.getPositions(token);
      return this.calculatePnLFromPositions(positions, 0);
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
   * Enhanced position normalization with profit calculation
   */
  normalizePosition(pos: any, index?: number): Position {
    // Extract core values
    const qty = Number(pos.shares || pos.quantity || pos.size || 0);
    const avg = Number(pos.avgPrice || pos.averagePrice || pos.entryPrice || pos.costBasis || 0);
    const curr = Number(pos.currentPrice || pos.price || pos.marketPrice || 0);
    
    // Calculate profit/loss if not provided
    let pnlAmount = pos.unrealizedPnL !== undefined ? Number(pos.unrealizedPnL) : 0;
    let pnlPercentage = pos.percentageGain !== undefined ? Number(pos.percentageGain) : 0;
    
    // Fallback calculation if not provided or zero
    if ((pnlAmount === 0 || pnlPercentage === 0) && avg > 0 && qty > 0) {
      pnlAmount = (curr - avg) * qty;
      pnlPercentage = ((curr - avg) / avg) * 100;
    }
    
    const value = qty * curr;
    const costBasis = qty * avg;

    return {
      id: pos.id || pos.positionId || `pos-${index || 0}-${Date.now()}`,
      marketId: pos.marketId || pos.conditionId,
      marketSlug: pos.marketSlug || pos.slug,
      marketQuestion: pos.marketQuestion || pos.question || pos.title || 'Position',
      outcome: pos.outcome || (pos.outcomeIndex === 0 ? "Yes" : "No"),
      quantity: qty,
      avgPrice: avg,
      currentPrice: curr,
      pnlAmount,
      pnlPercentage,
      value,
      costBasis,
      unrealizedPnL: pnlAmount,
      percentageGain: pnlPercentage
    };
  },

  /**
   * Calculate trade profit
   */
  calculateTradeProfit(trade: any): number {
    // This is a simplified calculation
    // In reality, you'd need entry price and exit price
    const size = parseFloat(trade.size || trade.amount || '0');
    const price = parseFloat(trade.price || '0');
    
    if (trade.side?.toLowerCase() === 'buy') {
      // For buys, profit is based on price movement
      return 0; // Would need entry price
    } else {
      // For sells, profit is immediate
      return size * price;
    }
  },

  /**
   * Calculate total PnL from positions array
   */
  calculatePnLFromPositions(positions: Position[], walletBalance: number = 0): PnLSummary {
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
      unrealizedPnL: totalPnL,
      totalValue,
      walletBalance,
      totalPortfolioValue: totalValue + walletBalance,
      positions
    };
  },

  /**
   * Calculate potential profit for an order (frontend fallback)
   */
  calculatePotentialProfitFrontend(
    side: 'BUY' | 'SELL',
    price: number,
    size: number
  ) {
    const cost = side === 'BUY' ? price * size : (1 - price) * size;
    const maxReturn = size; // Maximum return is always the size (shares * $1)
    const potentialProfit = maxReturn - cost;
    const roi = (potentialProfit / cost) * 100;

    return {
      cost: parseFloat(cost.toFixed(2)),
      maxReturn: parseFloat(maxReturn.toFixed(2)),
      potentialProfit: parseFloat(potentialProfit.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      breakEvenPrice: side === 'BUY' ? price : (1 - price)
    };
  },

  /**
   * Calculate actual profit from a position (frontend fallback)
   */
  calculateActualProfitFrontend(
    shares: number,
    avgPrice: number,
    currentPrice: number,
    side: 'BUY' | 'SELL' = 'BUY'
  ) {
    let unrealizedPnL = 0;
    let roi = 0;
    
    if (side === 'BUY') {
      const currentValue = shares * currentPrice;
      const costBasis = shares * avgPrice;
      unrealizedPnL = currentValue - costBasis;
      roi = avgPrice > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
    } else {
      const currentValue = shares * (1 - currentPrice);
      const costBasis = shares * (1 - avgPrice);
      unrealizedPnL = currentValue - costBasis;
      roi = avgPrice > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
    }

    return {
      unrealizedPnL: parseFloat(unrealizedPnL.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      currentValue: parseFloat((shares * currentPrice).toFixed(2)),
      costBasis: parseFloat((shares * avgPrice).toFixed(2))
    };
  }
};