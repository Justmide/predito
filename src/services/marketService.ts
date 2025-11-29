const API_BASE_URL = 'https://predito-middleware.onrender.com/api/v1';

export interface Market {
  id: string;
  question: string;
  outcomes: string | Array<{ name: string; price: string }>; // Can be string or array
  volume: string;
  end_date_iso?: string;
  endDateIso?: string; // API uses this format
  category?: string;
  tags?: string[];
  description?: string;
  image?: string;
}

export interface OrderbookEntry {
  price: string;
  size: string;
}

export interface Orderbook {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
}

export const marketService = {
  async getMarkets(limit = 100): Promise<Market[]> {
    const response = await fetch(`${API_BASE_URL}/trading/markets?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch markets');
    }
    const json = await response.json();
    // API returns {status: "success", data: [...]} - extract the data array
    const markets = json.data || [];
    
    // Normalize market data
    return markets.map((market: any) => ({
      ...market,
      end_date_iso: market.endDateIso || market.end_date_iso,
      outcomes: typeof market.outcomes === 'string' 
        ? JSON.parse(market.outcomes).map((name: string) => ({ name, price: "0.5" }))
        : market.outcomes,
    }));
  },

  async searchMarkets(query: string): Promise<Market[]> {
    const response = await fetch(`${API_BASE_URL}/trading/markets/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search markets');
    }
    const json = await response.json();
    const markets = json.data || [];
    
    return markets.map((market: any) => ({
      ...market,
      end_date_iso: market.endDateIso || market.end_date_iso,
      outcomes: typeof market.outcomes === 'string' 
        ? JSON.parse(market.outcomes).map((name: string) => ({ name, price: "0.5" }))
        : market.outcomes,
    }));
  },

  async getMarket(marketId: string): Promise<Market> {
    const response = await fetch(`${API_BASE_URL}/trading/markets/${marketId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch market details');
    }
    const json = await response.json();
    const market = json.data || json;
    
    return {
      ...market,
      end_date_iso: market.endDateIso || market.end_date_iso,
      outcomes: typeof market.outcomes === 'string' 
        ? JSON.parse(market.outcomes).map((name: string) => ({ name, price: "0.5" }))
        : market.outcomes,
    };
  },

  async getOrderbook(marketId: string): Promise<Orderbook> {
    const response = await fetch(`${API_BASE_URL}/trading/markets/${marketId}/orderbook`);
    if (!response.ok) {
      throw new Error('Failed to fetch orderbook');
    }
    const json = await response.json();
    return json.data || json;
  },
};
