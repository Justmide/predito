import { API_BASE_URL } from "@/lib/api";

/**
 * INTERFACES
 */
export interface Market {
  id: string;
  question: string;
  outcomes: Array<{ name: string; price: string }>;
  volume: string;
  slug?: string;
  endDateIso?: string;
  category?: string;
  tags?: string[];
  description?: string;
  image?: string;
  ticker?: string;
  title?: string;
}

export interface PlaceOrderParams {
  marketId: string;
  marketSlug?: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  outcome: string;
  size?: number; // Alternative to amount for compatibility
}

export interface UserPosition {
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

export interface UserOrder {
  id: string;
  marketId: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  outcome: string;
  status: 'open' | 'filled' | 'canceled';
  createdAt: string;
}

export interface CategoryGroup { 
  [category: string]: Market[]; 
}

export interface OrderbookEntry { 
  price: string; 
  size: string; 
}

export interface Orderbook { 
  bids: OrderbookEntry[]; 
  asks: OrderbookEntry[]; 
  spread?: number; 
}

export interface ProfitPreviewData {
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

/**
 * SERVICE OBJECT
 */
export const marketService = {
  /**
   * FETCH ALL MARKETS
   */
  async getMarkets(limit?: number, groupByCategory = false, category?: string): Promise<Market[] | CategoryGroup> {
    try {
      const url = new URL(`${API_BASE_URL}/trading/markets`);
      if (limit) url.searchParams.set('limit', limit.toString());
      if (groupByCategory) url.searchParams.set('groupByCategory', 'true');
      if (category) url.searchParams.set('category', category);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
      
      const json = await response.json();
      const marketsData = json.data || [];
      
      if (Array.isArray(marketsData)) {
        const normalized = marketsData.map((m: any) => this.normalizeMarket(m));
        return groupByCategory ? this.groupMarketsByCategory(normalized) : normalized;
      }
      return [];
    } catch (error) {
      console.error('❌ getMarkets error:', error);
      throw error;
    }
  },

  /**
   * FETCH SINGLE MARKET
   */
  async getMarket(marketId: string): Promise<Market> {
    const cleanMarketId = marketId.trim();
    const endpoint = `${API_BASE_URL}/trading/markets/${encodeURIComponent(cleanMarketId)}`;
    
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const json = await response.json();
        return this.normalizeMarket(json.data || json);
      }
      
      // Fallback: search through all markets
      const all = await this.getMarkets() as Market[];
      const found = all.find(m => 
        m.slug === cleanMarketId || 
        m.id === cleanMarketId || 
        m.ticker === cleanMarketId ||
        m.question.toLowerCase().includes(cleanMarketId.toLowerCase())
      );
      if (found) return found;
      
      throw new Error(`Market ${cleanMarketId} not found`);
    } catch (error) {
      console.error('❌ getMarket error:', error);
      throw error;
    }
  },

  /**
   * GET ORDERBOOK
   */
  async getOrderbook(marketSlug: string, outcome: string = "Yes"): Promise<Orderbook> {
    try {
      const url = `${API_BASE_URL}/trading/markets/${encodeURIComponent(marketSlug)}/orderbook?outcome=${encodeURIComponent(outcome)}`;
      const response = await fetch(url);
      if (!response.ok) return { bids: [], asks: [] };
      
      const json = await response.json();
      return this.normalizeOrderbook(json.orderbook || json.data);
    } catch (err) {
      console.error('❌ getOrderbook error:', err);
      return { bids: [], asks: [] };
    }
  },

  /**
   * PLACE ORDER - FIXED VERSION
   */
  async placeOrder(params: PlaceOrderParams): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error("Authentication required. Please sign in.");

    try {
      // Validate parameters before sending
      if (!params.marketId && !params.marketSlug) {
        throw new Error("Market ID or Slug is required");
      }

      // CRITICAL: Ensure we send marketSlug for profit calculation
      const orderData = {
        marketId: params.marketId,
        marketSlug: params.marketSlug || params.marketId, // Fallback to marketId if no slug
        outcome: params.outcome,
        side: params.side.toUpperCase(), // Backend expects 'BUY' or 'SELL'
        price: params.price,
        size: params.amount || params.size, // Use amount or size
        amount: params.amount // Also send amount
      };

      console.log('📤 Sending order:', orderData);

      const response = await fetch(`${API_BASE_URL}/trading/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(orderData),
      });

      const responseText = await response.text();
      let json;
      try {
        json = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (!response.ok) {
        console.error('❌ Order failed response:', {
          status: response.status,
          statusText: response.statusText,
          json
        });
        
        // Handle specific error cases
        if (response.status === 404) {
          throw new Error(`Market not found. Please check the market ID/slug.`);
        } else if (response.status === 400) {
          throw new Error(json.message || 'Invalid order parameters');
        } else if (response.status === 401) {
          throw new Error('Session expired. Please sign in again.');
        } else if (response.status === 402) {
          throw new Error(json.message || 'Insufficient balance');
        } else {
          throw new Error(json.message || json.error || `Order failed: ${response.status}`);
        }
      }

      console.log('✅ Order response:', json);
      return json.data || json;
    } catch (error: any) {
      console.error('❌ placeOrder error:', error);
      throw error;
    }
  },

  /**
   * PREVIEW BET PROFIT
   * Calculate potential profit before placing order
   */
  async previewBetProfit(data: {
    marketSlug: string;
    outcome: string;
    side: string;
    price: number;
    size: number;
  }): Promise<{ status: string; data: ProfitPreviewData }> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error("Authentication required. Please sign in.");

    try {
      const response = await fetch(`${API_BASE_URL}/trading/bet/preview`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data),
      });

      const json = await response.json();
      
      if (!response.ok) {
        throw new Error(json.message || json.error || "Profit preview failed");
      }

      return json;
    } catch (error: any) {
      console.error('❌ previewBetProfit error:', error);
      throw error;
    }
  },

  /**
   * FETCH USER POSITIONS
   */
  async getUserPositions(): Promise<UserPosition[]> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return [];

      const response = await fetch(`${API_BASE_URL}/trading/positions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch positions:', response.status);
        return [];
      }
      
      const json = await response.json();
      
      // Handle the 'data' array from your backend controller
      const positions = json.data || [];

      return positions.map((pos: any, index: number) => {
        // Normalize values
        const qty = Number(pos.shares || pos.quantity || pos.size || 0);
        const avg = Number(pos.avgPrice || pos.averagePrice || pos.costBasis || 0);
        const curr = Number(pos.currentPrice || pos.curPrice || 0);

        // Calculate PnL
        let pnl = pos.unrealizedPnL !== undefined ? Number(pos.unrealizedPnL) : 0;
        if (pnl === 0 && avg > 0 && qty > 0) {
          pnl = (curr - avg) * qty;
        }
        
        // Calculate percentage
        let pnlPct = pos.percentageGain !== undefined ? Number(pos.percentageGain) : 0;
        if (pnlPct === 0 && avg > 0) {
          pnlPct = ((curr - avg) / avg) * 100;
        }

        return {
          id: pos.id || pos.marketId || `pos-${index}-${Date.now()}`,
          marketId: pos.marketId || pos.conditionId || '',
          marketSlug: pos.slug || pos.marketSlug,
          marketQuestion: pos.title || pos.marketQuestion || pos.question || 'Active Position',
          outcome: pos.outcome || (pos.outcomeIndex === 0 ? "Yes" : "No"),
          quantity: qty,
          avgPrice: avg,
          currentPrice: curr,
          pnlAmount: pnl,
          pnlPercentage: pnlPct,
          value: qty * curr
        };
      });
    } catch (error) {
      console.error('❌ getUserPositions error:', error);
      return [];
    }
  },

  /**
   * SEARCH MARKETS
   */
  async searchMarkets(query: string): Promise<Market[]> {
    try {
      const url = `${API_BASE_URL}/trading/markets/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) return [];
      
      const json = await response.json();
      const marketsData = json.data || [];
      
      return marketsData.map((m: any) => this.normalizeMarket(m));
    } catch (error) {
      console.error('❌ searchMarkets error:', error);
      return [];
    }
  },

  /**
   * CANCEL ORDER
   */
  async cancelOrder(orderId: string): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error("Authentication required");

    try {
      const response = await fetch(`${API_BASE_URL}/trading/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const json = await response.json();
      
      if (!response.ok) {
        throw new Error(json.message || "Failed to cancel order");
      }

      return json;
    } catch (error: any) {
      console.error('❌ cancelOrder error:', error);
      throw error;
    }
  },

  /**
   * NORMALIZATION LOGIC
   */
  normalizeMarket(market: any): Market {
    const slug = market.slug || market.ticker || '';
    const id = market.id || market._id || slug;

    return {
      id: String(id),
      question: market.question || market.title || 'Untitled',
      outcomes: this.normalizeOutcomes(market.outcomes || market.options),
      volume: String(market.volume || market.volume24h || "0"),
      endDateIso: market.endDateIso || market.endDate || market.expiresAt,
      category: typeof market.category === 'string' ? market.category : (market.category?.name || 'General'),
      tags: Array.isArray(market.tags) ? market.tags : [],
      description: market.description || '',
      image: market.image || market.imageUrl || market.icon,
      slug,
      ticker: market.ticker,
      title: market.title
    };
  },

  normalizeOutcomes(outcomes: any): Array<{ name: string; price: string }> {
    if (!outcomes) return [{ name: "Yes", price: "0.5" }, { name: "No", price: "0.5" }];
    
    if (typeof outcomes === 'string') {
      try {
        outcomes = JSON.parse(outcomes);
      } catch {
        return [{ name: "Yes", price: "0.5" }, { name: "No", price: "0.5" }];
      }
    }

    if (!Array.isArray(outcomes)) {
      return [{ name: "Yes", price: "0.5" }, { name: "No", price: "0.5" }];
    }

    return outcomes.map((o: any) => ({
      name: typeof o === 'string' ? o : (o.name || o.title || 'Unknown'),
      price: String(o.price || o.lastPrice || "0.5")
    }));
  },

  normalizeOrderbook(data: any): Orderbook {
    if (!data) return { bids: [], asks: [] };

    const normalizeEntry = (e: any) => ({
      price: String(e.price || e[0] || "0"),
      size: String(e.size || e.amount || e[1] || "0")
    });

    const bids = (data.bids || []).map(normalizeEntry)
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    
    const asks = (data.asks || []).map(normalizeEntry)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    const spread = (bids[0] && asks[0]) 
      ? parseFloat(asks[0].price) - parseFloat(bids[0].price) 
      : 0;

    return {
      bids: bids.slice(0, 20),
      asks: asks.slice(0, 20),
      spread
    };
  },

  groupMarketsByCategory(markets: Market[]): CategoryGroup {
    return markets.reduce((acc: CategoryGroup, m) => {
      const cat = m.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    }, {});
  },

  /**
   * FORMAT VOLUME
   */
  formatVolume(volume: string | number): string {
    const num = Number(volume);
    if (isNaN(num)) return "$0";
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  },

  /**
   * GET TIME REMAINING
   */
  getTimeRemaining(endDate?: string): string {
    if (!endDate) return "No end date";
    
    const diff = new Date(endDate).getTime() - new Date().getTime();
    if (diff < 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return "Ending soon";
  },

  /**
   * SIMPLE FRONTEND PROFIT CALCULATION (Fallback)
   */
  calculateProfitFrontend(side: 'buy' | 'sell', price: number, amount: number) {
    const cost = side === 'buy' 
      ? price * amount 
      : (1 - price) * amount;
    
    const maxReturn = amount; // Shares * $1
    const potentialProfit = maxReturn - cost;
    const roi = cost > 0 ? (potentialProfit / cost) * 100 : 0;

    return {
      cost: parseFloat(cost.toFixed(2)),
      maxReturn: parseFloat(maxReturn.toFixed(2)),
      potentialProfit: parseFloat(potentialProfit.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      breakEvenPrice: side === 'buy' ? price : (1 - price)
    };
  }
};