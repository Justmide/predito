// services/marketService.ts
import { API_BASE_URL } from "@/lib/api";

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

export interface MarketsResponse {
  data: Market[] | CategoryGroup;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlaceOrderParams {
  marketId: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  outcome: string;
}

export const marketService = {
  async getMarkets(limit?: number, groupByCategory = false, category?: string): Promise<Market[] | CategoryGroup> {
    try {
      const url = new URL(`${API_BASE_URL}/trading/markets`);
      
      if (limit) {
        url.searchParams.set('limit', limit.toString());
      }
      
      if (groupByCategory) {
        url.searchParams.set('groupByCategory', 'true');
      }

      if (category) {
        url.searchParams.set('category', category);
      }

      console.log(`📡 Fetching markets from: ${url.toString()}`);
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`Failed to fetch markets: ${response.status} ${response.statusText}`);
      }
      
      const json = await response.json();
      
      if (json.status !== 'success') {
        throw new Error(json.message || 'API returned unsuccessful status');
      }

      const marketsData = json.data || [];
      
      if (Array.isArray(marketsData)) {
        const normalizedMarkets = marketsData.map((market: any) => this.normalizeMarket(market));
        console.log(`✅ Received ${normalizedMarkets.length} markets as array`);
        
        if (groupByCategory) {
          return this.groupMarketsByCategory(normalizedMarkets);
        }
        
        return normalizedMarkets;
      }

      if (typeof marketsData === 'object' && marketsData !== null) {
        const normalizedGroups: CategoryGroup = {};
        Object.keys(marketsData).forEach(cat => {
          if (Array.isArray(marketsData[cat])) {
            normalizedGroups[cat] = marketsData[cat].map((market: any) => 
              this.normalizeMarket(market)
            );
          }
        });
        return normalizedGroups;
      }

      return [];
    } catch (error) {
      console.error('❌ getMarkets error:', error);
      throw error;
    }
  },

  async getMarket(marketId: string): Promise<Market> {
    try {
      // CRITICAL: Use the marketId exactly as provided (it should be the full slug in most cases)
      const cleanMarketId = marketId.trim();
      
      console.log(`📡 getMarket: attempting to fetch market: ${cleanMarketId}`);
      
      // Try multiple possible endpoints
      const endpoints = [
        `${API_BASE_URL}/trading/markets/${encodeURIComponent(cleanMarketId)}`,
        `${API_BASE_URL}/markets/${encodeURIComponent(cleanMarketId)}`,
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint);
          
          if (response.ok) {
            const json = await response.json();
            const marketData = json.data || json;
            console.log(`✅ Found market via direct fetch:`, {
              id: marketData.id,
              slug: marketData.slug,
              ticker: marketData.ticker
            });
            return this.normalizeMarket(marketData);
          }
        } catch (err) {
          // Suppress error log for failed endpoint to keep console clean
        }
      }
      
      // If direct fetch fails, search in all markets
      console.log(`🔄 Falling back to search in all markets`);
      const allMarkets = await this.getMarkets(undefined, false) as Market[];
      
      // Try multiple matching strategies WITHOUT modifying the slug
      const foundMarket = allMarkets.find(m => {
        if (!m) return false;
        
        // Prioritize the full slug/ticker match
        if (m.slug === cleanMarketId) return true; 
        if (m.ticker === cleanMarketId) return true;
        if (m.id === cleanMarketId) return true; // Numeric match
        
        return false;
      });
      
      if (foundMarket) {
        console.log(`✅ Found market in list:`, {
          id: foundMarket.id,
          slug: foundMarket.slug,
          ticker: foundMarket.ticker,
          question: foundMarket.question
        });
        return foundMarket;
      }
      
      throw new Error(`Market not found: ${cleanMarketId}`);
      
    } catch (error) {
      console.error('❌ getMarket error:', error);
      throw error;
    }
  },

  async searchMarkets(query: string): Promise<Market[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/trading/markets/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search markets');
      }
      const json = await response.json();
      const markets = json.data || [];
      
      return markets.map((market: any) => this.normalizeMarket(market));
    } catch (error) {
      console.error('❌ searchMarkets error:', error);
      throw error;
    }
  },

async getOrderbook(
  marketSlug: string,
  outcome: string = "Yes"
): Promise<Orderbook> {
  try {
    const cleanSlug = marketSlug.trim();

    // 🚨 HARD GUARD — orderbooks NEVER accept numeric IDs
    if (/^\d+$/.test(cleanSlug)) {
      throw new Error(
        `Invalid market slug "${cleanSlug}". Orderbooks require a slug, not an ID.`
      );
    }

    console.log(
      `📡 getOrderbook → slug="${cleanSlug}", outcome="${outcome}"`
    );

    const url = `${API_BASE_URL}/trading/markets/${encodeURIComponent(
      cleanSlug
    )}/orderbook?outcome=${encodeURIComponent(outcome)}`;

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Orderbook fetch failed (${response.status}): ${text}`
      );
    }

    const json = await response.json();

    if (json.status === "error") {
      throw new Error(json.message || "Orderbook error");
    }

    return this.normalizeOrderbook(json.data);
  } catch (err) {
    console.error("❌ getOrderbook error:", err);
    return { bids: [], asks: [] };
  }
},
  normalizeOrderbook(data: any): Orderbook {
    console.log("🔄 Normalizing orderbook data:", data);
    
    let bids: OrderbookEntry[] = [];
    let asks: OrderbookEntry[] = [];
    
    if (data) {
      if (Array.isArray(data.bids) && Array.isArray(data.asks)) {
        bids = data.bids.map((entry: any) => ({
          price: String(entry.price || entry[0] || "0"),
          size: String(entry.size || entry.amount || entry[1] || "0")
        }));
        
        asks = data.asks.map((entry: any) => ({
          price: String(entry.price || entry[0] || "0"),
          size: String(entry.size || entry.amount || entry[1] || "0")
        }));
      } else if (data.buy && data.sell) {
        bids = (data.buy || []).map((entry: any) => ({
          price: String(entry.price || "0"),
          size: String(entry.size || "0")
        }));
        
        asks = (data.sell || []).map((entry: any) => ({
          price: String(entry.price || "0"),
          size: String(entry.size || "0")
        }));
      }
    }
    
    bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
    let spread: number | undefined;
    if (bids.length > 0 && asks.length > 0) {
      const bestBid = parseFloat(bids[0].price);
      const bestAsk = parseFloat(asks[0].price);
      spread = bestAsk - bestBid;
    }
    
    return {
      bids: bids.slice(0, 20),
      asks: asks.slice(0, 20),
      spread
    };
  },

  async placeOrder(params: PlaceOrderParams): Promise<any> {
    try {
      console.log(`📡 Placing order:`, params);
      
      const market = await this.getMarket(params.marketId);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error("User is not authenticated");
      }
      
      const response = await fetch(`${API_BASE_URL}/trading/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...params,
          marketId: market.id,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Place order error ${response.status}:`, errorText);
        throw new Error(`Failed to place order: ${response.status} ${response.statusText}`);
      }
      
      const json = await response.json();
      return json.data || json;
    } catch (error) {
      console.error('❌ placeOrder error:', error);
      throw error;
    }
  },

  async cancelOrder(orderId: string): Promise<any> {
    try {
      console.log(`📡 Cancelling order: ${orderId}`);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error("User is not authenticated");
      }
      
      const url = `${API_BASE_URL}/trading/orders/${encodeURIComponent(orderId)}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Cancel order error ${response.status}:`, errorText);
        throw new Error(`Failed to cancel order: ${response.status} ${response.statusText}`);
      }
      
      const responseText = await response.text();
      let json;
      try {
        json = JSON.parse(responseText);
      } catch (e) {
        return { status: 'success', message: `Order ${orderId} cancelled.` };
      }
      
      return json.data || json;
      
    } catch (error) {
      console.error('❌ cancelOrder error:', error);
      throw error;
    }
  },
  
  async getUserOrders(): Promise<UserOrder[]> {
    try {
      console.log(`📡 Fetching user orders...`);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn("User is not authenticated. Cannot fetch orders.");
        return [];
      }

      const url = `${API_BASE_URL}/trading/orders/me`; 
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Get user orders error ${response.status}:`, errorText);
        throw new Error(`Failed to fetch user orders: ${response.status} ${response.statusText}`);
      }
      
      const json = await response.json();
      
      if (json.status === 'error') {
        throw new Error(json.message || 'API returned unsuccessful status for user orders');
      }

      const orders: UserOrder[] = json.data || [];
      console.log(`✅ Received ${orders.length} user orders.`);

      return orders.map(order => ({
        id: order.id,
        marketId: order.marketId,
        side: order.side,
        amount: Number(order.amount),
        price: Number(order.price),
        outcome: order.outcome,
        status: order.status,
        createdAt: order.createdAt,
      }));

    } catch (error) {
      console.error('❌ getUserOrders error:', error);
      return [];
    }
  },

  normalizeMarket(market: any): Market {
    console.log('🔄 Normalizing market:', {
      raw_id: market.id,
      raw_slug: market.slug,
      raw_ticker: market.ticker,
      raw_question: market.question
    });

    let tags: string[] = [];
    if (market.tags) {
      if (Array.isArray(market.tags)) {
        tags = market.tags.map((tag: any) => {
          if (typeof tag === 'string') return tag;
          if (typeof tag === 'object' && tag !== null) {
            return tag.label || tag.name || tag.slug || tag.title || '';
          }
          return String(tag);
        }).filter(Boolean);
      } else if (typeof market.tags === 'string') {
        tags = market.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    
    let category = '';
    if (market.category) {
      if (typeof market.category === 'string') {
        category = market.category;
      } else if (typeof market.category === 'object' && market.category !== null) {
        category = market.category.label || market.category.name || market.category.slug || '';
      }
    }
    
    const outcomes = this.normalizeOutcomes(market.outcomes || market.options);
    
    // CRITICAL FIX: Preserve the full slug/ticker from backend and ONLY create a new slug 
    // if neither slug nor ticker is provided by the API response.
    let id = market.id || market._id || '';
    let slug = market.slug || market.ticker || '';
    
    // If no unique identifier is available, create a basic slug (LAST RESORT)
    if (!slug && market.question) {
      slug = market.question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    
    if (!id) {
      id = slug || `market-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const normalized: Market = {
      id,
      question: market.title || market.question || market.name || 'Untitled Market',
      outcomes,
      volume: String(market.volume || market.tradingVolume || market.totalVolume || "0"),
      endDateIso: market.endDateIso || market.end_date_iso || market.endDate || market.expiresAt,
      category: category || 'uncategorized',
      tags,
      description: market.description || market.details || '',
      image: market.image || market.imageUrl || market.thumbnail,
      slug, // Keep the full slug intact!
      ticker: market.ticker,
      title: market.title,
    };

    console.log('✅ Normalized market:', {
      final_id: normalized.id,
      final_slug: normalized.slug,
      final_ticker: normalized.ticker
    });
    
    return normalized;
  },

  normalizeOutcomes(outcomes: any): Array<{ name: string; price: string }> {
    if (!outcomes) {
      return [
        { name: "YES", price: "0.5" },
        { name: "NO", price: "0.5" }
      ];
    }
    
    if (typeof outcomes === 'string') {
      try {
        const parsed = JSON.parse(outcomes);
        return this.normalizeOutcomes(parsed);
      } catch (error) {
        // Not JSON, continue
      }
    }
    
    if (Array.isArray(outcomes)) {
      if (outcomes.length === 0) {
        return [
          { name: "YES", price: "0.5" },
          { name: "NO", price: "0.5" }
        ];
      }
      
      const firstItem = outcomes[0];
      
      if (typeof firstItem === 'object' && firstItem !== null) {
        return outcomes.map((item: any) => ({
          name: item.name || item.title || item.label || 'Unknown',
          price: String(item.price || item.probability || item.odds || "0.5")
        }));
      }
      
      if (typeof firstItem === 'string') {
        return outcomes.map((name: string) => ({
          name,
          price: "0.5"
        }));
      }
    }
    
    if (typeof outcomes === 'object' && outcomes !== null && !Array.isArray(outcomes)) {
      const result: Array<{ name: string; price: string }> = [];
      
      for (const [key, value] of Object.entries(outcomes)) {
        if (key.toLowerCase().includes('yes')) {
          result.push({ name: "YES", price: String(value) });
        } else if (key.toLowerCase().includes('no')) {
          result.push({ name: "NO", price: String(value) });
        } else {
          result.push({ name: key, price: String(value) });
        }
      }
      
      if (result.length > 0) return result;
    }
    
    return [
      { name: "YES", price: "0.5" },
      { name: "NO", price: "0.5" }
    ];
  },

  groupMarketsByCategory(markets: Market[]): CategoryGroup {
    const grouped: CategoryGroup = {};
    
    markets.forEach(market => {
      const category = market.category || 'uncategorized';
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(market);
    });
    
    return grouped;
  }
};