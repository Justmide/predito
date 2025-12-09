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
      // Clean the marketId (remove any URL encoding issues)
      const cleanMarketId = marketId.trim();
      
      // First try direct fetch by slug/id
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
            console.log(`✅ Found market via direct fetch`);
            return this.normalizeMarket(marketData);
          }
        } catch (err) {
          console.log(`⚠️ Endpoint failed: ${endpoint}`, err);
        }
      }
      
      // If direct fetch fails, search in all markets
      console.log(`🔄 Falling back to search in all markets`);
      const allMarkets = await this.getMarkets(undefined, false) as Market[];
      
      // Create a slug from the marketId
      const makeSlug = (s: string) =>
        String(s)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      
      const marketIdSlug = makeSlug(cleanMarketId);
      
      // Try multiple matching strategies
      const foundMarket = allMarkets.find(m => {
        if (!m) return false;
        
        // Exact ID match
        if (m.id === cleanMarketId) return true;
        
        // Exact slug match
        if (m.slug === cleanMarketId) return true;
        
        // Check if any slug matches
        if (m.slug && makeSlug(m.slug) === marketIdSlug) return true;
        
        // Check if question slug matches
        if (m.question && makeSlug(m.question) === marketIdSlug) return true;
        
        // Check if title slug matches
        if (m.title && makeSlug(m.title) === marketIdSlug) return true;
        
        return false;
      });
      
      if (foundMarket) {
        console.log(`✅ Found market in list: ${foundMarket.question}`);
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

  async getOrderbook(marketId: string): Promise<Orderbook> {
    try {
      console.log(`📡 getOrderbook: Starting for marketId="${marketId}"`);
      
      // First, clean the marketId
      const cleanMarketId = marketId.trim();
      
      // Try direct orderbook fetch first
      try {
        const url = `${API_BASE_URL}/trading/markets/${encodeURIComponent(cleanMarketId)}/orderbook`;
        console.log(`🔄 Trying direct orderbook fetch: ${url}`);
        
        const response = await fetch(url);
        
        if (response.ok) {
          const json = await response.json();
          console.log(`✅ Orderbook fetched successfully via direct fetch`);
          
          // If the API returns an error status in the JSON
          if (json.status === 'error') {
            throw new Error(json.message || 'Orderbook fetch failed');
          }
          
          return this.normalizeOrderbook(json.data || json);
        } else {
          console.log(`⚠️ Direct orderbook fetch failed with status: ${response.status}`);
        }
      } catch (directError) {
        console.log(`⚠️ Direct orderbook fetch error:`, directError);
      }
      
      // If direct fetch fails, get market details first
      console.log(`🔄 Falling back to market resolution for orderbook`);
      const market = await this.getMarket(cleanMarketId);
      
      if (!market) {
        throw new Error(`Market not found: ${cleanMarketId}`);
      }
      
      // Try with the resolved market slug/ID
      const resolvedId = market.slug || market.id || cleanMarketId;
      console.log(`🔄 Trying orderbook with resolved ID: ${resolvedId}`);
      
      const url = `${API_BASE_URL}/trading/markets/${encodeURIComponent(resolvedId)}/orderbook`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Final orderbook fetch failed:`, {
          status: response.status,
          error: errorText,
          url,
          market: {
            id: market.id,
            slug: market.slug,
            question: market.question
          }
        });
        
        // Return empty orderbook instead of throwing error
        console.log(`⚠️ Returning empty orderbook due to fetch failure`);
        return { bids: [], asks: [] };
      }
      
      const json = await response.json();
      
      if (json.status === 'error') {
        console.warn(`⚠️ Orderbook API returned error:`, json.message);
        return { bids: [], asks: [] };
      }
      
      console.log(`✅ Orderbook fetched successfully after market resolution`);
      return this.normalizeOrderbook(json.data || json);
      
    } catch (error) {
      console.error('❌ getOrderbook error:', error);
      // Instead of throwing, return empty orderbook
      console.log(`⚠️ Returning empty orderbook due to error`);
      return { bids: [], asks: [] };
    }
  },

  // Helper to normalize orderbook data
  normalizeOrderbook(data: any): Orderbook {
    console.log("🔄 Normalizing orderbook data:", data);
    
    // Handle different response formats
    let bids: OrderbookEntry[] = [];
    let asks: OrderbookEntry[] = [];
    
    if (data) {
      if (Array.isArray(data.bids) && Array.isArray(data.asks)) {
        // Standard format
        bids = data.bids.map((entry: any) => ({
          price: String(entry.price || entry[0] || "0"),
          size: String(entry.size || entry.amount || entry[1] || "0")
        }));
        
        asks = data.asks.map((entry: any) => ({
          price: String(entry.price || entry[0] || "0"),
          size: String(entry.size || entry.amount || entry[1] || "0")
        }));
      } else if (data.buy && data.sell) {
        // Alternative format
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
    
    // Sort bids descending, asks ascending
    bids.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    asks.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    
    // Calculate spread if we have both bids and asks
    let spread: number | undefined;
    if (bids.length > 0 && asks.length > 0) {
      const bestBid = parseFloat(bids[0].price);
      const bestAsk = parseFloat(asks[0].price);
      spread = bestAsk - bestBid;
    }
    
    return {
      bids: bids.slice(0, 20), // Limit to top 20
      asks: asks.slice(0, 20),
      spread
    };
  },

  async placeOrder(params: PlaceOrderParams): Promise<any> {
    try {
      console.log(`📡 Placing order:`, params);
      
      // Get market details to ensure we have correct ID
      const market = await this.getMarket(params.marketId);
      
      // Get auth token for protected route
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

  normalizeMarket(market: any): Market {
    // Extract tags safely
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
    
    // Extract category safely
    let category = '';
    if (market.category) {
      if (typeof market.category === 'string') {
        category = market.category;
      } else if (typeof market.category === 'object' && market.category !== null) {
        category = market.category.label || market.category.name || market.category.slug || '';
      }
    }
    
    // Extract outcomes
    const outcomes = this.normalizeOutcomes(market.outcomes || market.options);
    
    // Ensure we have a valid ID and slug
    let id = market.id || market._id || '';
    let slug = market.slug || market.ticker || '';
    
    // If no slug, create one from the question
    if (!slug && market.question) {
      slug = market.question
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
    
    // If no ID but we have a slug, use slug as ID
    if (!id && slug) {
      id = slug;
    }
    
    // If still no ID, generate one
    if (!id) {
      id = `market-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
      slug,
      ticker: market.ticker,
      title: market.title,
    };
    
    return normalized;
  },

  normalizeOutcomes(outcomes: any): Array<{ name: string; price: string }> {
    if (!outcomes) {
      return [
        { name: "YES", price: "0.5" },
        { name: "NO", price: "0.5" }
      ];
    }
    
    // Try to parse JSON string
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
      
      // Array of objects
      if (typeof firstItem === 'object' && firstItem !== null) {
        return outcomes.map((item: any) => ({
          name: item.name || item.title || item.label || 'Unknown',
          price: String(item.price || item.probability || item.odds || "0.5")
        }));
      }
      
      // Array of strings
      if (typeof firstItem === 'string') {
        return outcomes.map((name: string) => ({
          name,
          price: "0.5"
        }));
      }
    }
    
    // Object format
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
    
    // Fallback
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