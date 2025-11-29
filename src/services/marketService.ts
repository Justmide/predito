const API_BASE_URL = 'https://predito-middleware.onrender.com/api/v1';

export interface Market {
  id: string;
  question: string;
  outcomes: Array<{ name: string; price: string }>;
  volume: string;
  end_date_iso: string;
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
    return response.json();
  },

  async searchMarkets(query: string): Promise<Market[]> {
    const response = await fetch(`${API_BASE_URL}/trading/markets/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search markets');
    }
    return response.json();
  },

  async getMarket(marketId: string): Promise<Market> {
    const response = await fetch(`${API_BASE_URL}/trading/markets/${marketId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch market details');
    }
    return response.json();
  },

  async getOrderbook(marketId: string): Promise<Orderbook> {
    const response = await fetch(`${API_BASE_URL}/trading/markets/${marketId}/orderbook`);
    if (!response.ok) {
      throw new Error('Failed to fetch orderbook');
    }
    return response.json();
  },
};
