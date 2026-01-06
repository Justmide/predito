import { API_BASE_URL } from "@/lib/api";

/** * INTERFACES
 */
export interface Market {
  id: string;
  question: string;
  outcomes: Array<{ name: string; price: string }>;
  volume: string;
  endDateIso?: string;
  category?: string;
  tags?: string[];
  description?: string;
  image?: string;
  slug?: string;
  ticker?: string;
  title?: string;
  [key: string]: any;
}

export interface UserPosition {
  id: string;
  marketId: string;
  marketSlug?: string;
  marketQuestion?: string;
  outcome: string;
  quantity: number;      
  avgPrice: number;      // Entry Price
  currentPrice: number;  // Real-time Market Price
  pnlAmount: number;     // Profit in Currency (e.g., USDT)
  pnlPercentage: number; // Profit in %
  value: number;         // quantity * currentPrice
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

export interface CategoryGroup { [category: string]: Market[]; }
export interface OrderbookEntry { price: string; size: string; }
export interface Orderbook { bids: OrderbookEntry[]; asks: OrderbookEntry[]; spread?: number; }
export interface PlaceOrderParams { marketId: string; side: 'buy' | 'sell'; amount: number; price: number; outcome: string; }

/** * SERVICE OBJECT
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
   * FETCH USER POSITIONS (This handles the PROFIT calculation)
   */
  async getUserPositions(): Promise<UserPosition[]> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return [];

      // Note: Ensure your backend provides this endpoint or calculate it from orders
      const response = await fetch(`${API_BASE_URL}/trading/positions/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) return [];
      const json = await response.json();
      const positions = json.data || [];

      return positions.map((pos: any) => {
        const qty = Number(pos.quantity || pos.amount || 0);
        const avg = Number(pos.avgPrice || pos.averagePrice || 0);
        const curr = Number(pos.currentPrice || 0);
        
        // Manual PnL fallback if backend doesn't send it
        const pnl = pos.pnlAmount !== undefined ? Number(pos.pnlAmount) : (curr - avg) * qty;
        const pnlPct = pos.pnlPercentage !== undefined ? Number(pos.pnlPercentage) : (avg > 0 ? ((curr - avg) / avg) * 100 : 0);

        return {
          id: pos.id,
          marketId: pos.marketId,
          marketSlug: pos.marketSlug,
          marketQuestion: pos.marketQuestion,
          outcome: pos.outcome,
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
      
      // Fallback search
      const all = await this.getMarkets() as Market[];
      const found = all.find(m => m.slug === cleanMarketId || m.id === cleanMarketId || m.ticker === cleanMarketId);
      if (found) return found;
      
      throw new Error(`Market ${cleanMarketId} not found`);
    } catch (error) {
      console.error('❌ getMarket error:', error);
      throw error;
    }
  },

  /**
   * GET ORDERBOOK (Never pass numeric IDs here, only slugs)
   */
  async getOrderbook(marketSlug: string, outcome: string = "Yes"): Promise<Orderbook> {
    try {
      const url = `${API_BASE_URL}/trading/markets/${encodeURIComponent(marketSlug)}/orderbook?outcome=${encodeURIComponent(outcome)}`;
      const response = await fetch(url);
      if (!response.ok) return { bids: [], asks: [] };
      
      const json = await response.json();
      return this.normalizeOrderbook(json.data);
    } catch (err) {
      return { bids: [], asks: [] };
    }
  },

  /**
   * PLACE ORDER
   */
  async placeOrder(params: PlaceOrderParams): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error("Auth Required");

    const response = await fetch(`${API_BASE_URL}/trading/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(params),
    });
    
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || "Order failed");
    return json.data || json;
  },

  /**
   * NORMALIZATION LOGIC
   */
  normalizeMarket(market: any): Market {
    const slug = market.slug || market.ticker || '';
    const id = market.id || market._id || slug || `m-${Date.now()}`;

    return {
      id: String(id),
      question: market.question || market.title || 'Untitled',
      outcomes: this.normalizeOutcomes(market.outcomes || market.options),
      volume: String(market.volume || "0"),
      endDateIso: market.endDateIso || market.expiresAt,
      category: typeof market.category === 'string' ? market.category : (market.category?.name || 'uncategorized'),
      tags: Array.isArray(market.tags) ? market.tags : [],
      description: market.description || '',
      image: market.image || market.imageUrl,
      slug,
      ticker: market.ticker,
      title: market.title
    };
  },

  normalizeOutcomes(outcomes: any): Array<{ name: string; price: string }> {
    if (!Array.isArray(outcomes)) return [{ name: "YES", price: "0.5" }, { name: "NO", price: "0.5" }];
    return outcomes.map((o: any) => ({
      name: o.name || o.title || 'Unknown',
      price: String(o.price || o.probability || "0.5")
    }));
  },

  normalizeOrderbook(data: any): Orderbook {
    const normalizeEntry = (e: any) => ({
      price: String(e.price || e[0] || "0"),
      size: String(e.size || e.amount || e[1] || "0")
    });

    const bids = (data?.bids || data?.buy || []).map(normalizeEntry).sort((a,b) => parseFloat(b.price) - parseFloat(a.price));
    const asks = (data?.asks || data?.sell || []).map(normalizeEntry).sort((a,b) => parseFloat(a.price) - parseFloat(b.price));

    return {
      bids: bids.slice(0, 20),
      asks: asks.slice(0, 20),
      spread: (bids[0] && asks[0]) ? parseFloat(asks[0].price) - parseFloat(bids[0].price) : 0
    };
  },

  groupMarketsByCategory(markets: Market[]): CategoryGroup {
    return markets.reduce((acc: CategoryGroup, m) => {
      const cat = m.category || 'uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    }, {});
  }
};