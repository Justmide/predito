// components/OrderbookDisplay.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { marketService, Orderbook } from "@/services/marketService";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrderbookDisplayProps {
  marketId: string;
  outcome: string;
  compact?: boolean;
}

const OrderbookDisplay = ({ marketId, outcome, compact = false }: OrderbookDisplayProps) => {
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [tradePrice, setTradePrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, balance, refreshBalance } = useAuth();
  const navigate = useNavigate();

  const fetchOrderbook = async () => {
    try {
      setLoading(true);
      const data = await marketService.getOrderbook(marketId);
      setOrderbook(data);
    } catch (error) {
      console.error("Failed to fetch orderbook:", error);
      // Set empty orderbook on error
      setOrderbook({ bids: [], asks: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderbook();

    // Only refresh if we have actual data
    if (orderbook && (orderbook.bids.length > 0 || orderbook.asks.length > 0)) {
      const interval = setInterval(fetchOrderbook, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [marketId]);

  const handleTrade = async (side: 'buy' | 'sell') => {
    if (!isAuthenticated) {
      navigate('/signin');
      toast.info("Please sign in to trade");
      return;
    }

    const amount = parseFloat(tradeAmount);
    const price = parseFloat(tradePrice);

    if (isNaN(amount) || amount <= 0 || isNaN(price) || price <= 0 || price >= 1) {
      toast.error("Please enter valid amount and price (0.01-0.99)");
      return;
    }

    if (balance < amount) {
      toast.error("Insufficient balance");
      return;
    }

    setIsSubmitting(true);
    try {
      await marketService.placeOrder({
        marketId,
        side,
        amount,
        price,
        outcome,
      });
      
      toast.success(`Successfully placed ${side} order`);
      await refreshBalance();
      setTradeAmount("");
      setTradePrice("");
    } catch (error: any) {
      console.error(`Failed to place ${side} order:`, error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "$0.00";
    return `$${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasOrders = orderbook && (orderbook.bids.length > 0 || orderbook.asks.length > 0);

  if (!hasOrders) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-2">
          No orders in the order book yet
        </div>
        <div className="text-sm text-muted-foreground">
          Be the first to place an order!
        </div>
      </div>
    );
  }

  // Calculate max size for width percentages
  const maxSize = Math.max(
    ...orderbook.bids.map(b => parseFloat(b.size)),
    ...orderbook.asks.map(a => parseFloat(a.size))
  );

  return (
    <div className="space-y-4">
      {/* Asks (Sell Orders) */}
      {orderbook.asks.length > 0 && (
        <div className="space-y-1">
          {!compact && (
            <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2 px-2">
              <span>Sell Orders</span>
              <span>Size</span>
            </div>
          )}
          
          <div className={`space-y-1 ${compact ? 'max-h-32' : 'max-h-48'} overflow-y-auto`}>
            {[...orderbook.asks]
              .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
              .slice(0, compact ? 5 : 10)
              .map((ask, index) => {
                const sizeNum = parseFloat(ask.size);
                const widthPercent = maxSize > 0 ? (sizeNum / maxSize) * 100 : 0;
                
                return (
                  <div key={index} className="relative">
                    <div 
                      className="absolute inset-0 bg-red-100 dark:bg-red-950/30 rounded"
                      style={{ width: `${widthPercent}%` }}
                    />
                    <div className="relative flex justify-between px-2 py-1 text-sm">
                      <span className="text-red-600 dark:text-red-400 font-mono">
                        {formatCurrency(ask.price)}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {sizeNum.toFixed(0)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Spread */}
      {orderbook.bids.length > 0 && orderbook.asks.length > 0 && (
        <div className="py-2 px-2 bg-muted/50 rounded text-center">
          <span className="text-xs font-semibold text-muted-foreground">
            Spread: {formatCurrency(String(orderbook.spread || 0))}
          </span>
        </div>
      )}

      {/* Bids (Buy Orders) */}
      {orderbook.bids.length > 0 && (
        <div className="space-y-1">
          {!compact && (
            <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2 px-2">
              <span>Buy Orders</span>
              <span>Size</span>
            </div>
          )}
          
          <div className={`space-y-1 ${compact ? 'max-h-32' : 'max-h-48'} overflow-y-auto`}>
            {orderbook.bids
              .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
              .slice(0, compact ? 5 : 10)
              .map((bid, index) => {
                const sizeNum = parseFloat(bid.size);
                const widthPercent = maxSize > 0 ? (sizeNum / maxSize) * 100 : 0;
                
                return (
                  <div key={index} className="relative">
                    <div 
                      className="absolute inset-0 bg-green-100 dark:bg-green-950/30 rounded"
                      style={{ width: `${widthPercent}%` }}
                    />
                    <div className="relative flex justify-between px-2 py-1 text-sm">
                      <span className="text-green-600 dark:text-green-400 font-mono">
                        {formatCurrency(bid.price)}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {sizeNum.toFixed(0)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Trade Execution - Only show if not compact */}
      {!compact && (
        <div className="border-t pt-4 mt-4 space-y-3">
          <h3 className="text-lg font-semibold text-center">Place Trade</h3>
          
          <div>
            <label htmlFor="price" className="text-sm font-medium text-muted-foreground">
              Price (0.01 - 0.99)
            </label>
            <input 
              id="price" 
              type="number" 
              min="0.01"
              max="0.99"
              step="0.01"
              value={tradePrice} 
              onChange={(e) => setTradePrice(e.target.value)} 
              placeholder="0.50" 
              className="w-full p-2 mt-1 bg-input rounded-md border" 
              disabled={isSubmitting} 
            />
          </div>
          
          <div>
            <label htmlFor="amount" className="text-sm font-medium text-muted-foreground">
              Amount ($)
            </label>
            <input 
              id="amount" 
              type="number" 
              min="0.01"
              step="0.01"
              value={tradeAmount} 
              onChange={(e) => setTradeAmount(e.target.value)} 
              placeholder={`Max ${balance.toFixed(2)}`} 
              className="w-full p-2 mt-1 bg-input rounded-md border" 
              disabled={isSubmitting} 
            />
          </div>
          
          <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">
            <div className="flex justify-between">
              <span>Your Balance:</span>
              <span className="font-semibold text-foreground">${balance.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleTrade('buy')}
              disabled={isSubmitting || !tradeAmount || !tradePrice}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy YES'}
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => handleTrade('sell')}
              disabled={isSubmitting || !tradeAmount || !tradePrice}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sell YES'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderbookDisplay;