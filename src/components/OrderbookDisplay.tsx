import { useEffect, useState } from "react";
import { marketService, Orderbook } from "@/services/marketService";
import { Loader2 } from "lucide-react";

interface OrderbookDisplayProps {
  marketId: string;
  outcome: string;
}

const OrderbookDisplay = ({ marketId, outcome }: OrderbookDisplayProps) => {
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchOrderbook();

    // Refresh orderbook every 10 seconds
    const interval = setInterval(fetchOrderbook, 10000);
    return () => clearInterval(interval);
  }, [marketId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!orderbook || (orderbook.bids.length === 0 && orderbook.asks.length === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No orders in the order book yet</p>
        <p className="text-sm mt-2">Be the first to place an order!</p>
      </div>
    );
  }

  const maxSize = Math.max(
    ...orderbook.bids.map(b => parseFloat(b.size)),
    ...orderbook.asks.map(a => parseFloat(a.size))
  );

  return (
    <div className="space-y-4">
      {/* Asks (Sell Orders) */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2 px-2">
          <span>Price</span>
          <span>Size</span>
        </div>
        
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {orderbook.asks.length > 0 ? (
            [...orderbook.asks].reverse().slice(0, 10).map((ask, index) => {
              const sizeNum = parseFloat(ask.size);
              const widthPercent = (sizeNum / maxSize) * 100;
              
              return (
                <div key={index} className="relative">
                  <div 
                    className="absolute inset-0 bg-red-100 dark:bg-red-950/30"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <div className="relative flex justify-between px-2 py-1 text-sm">
                    <span className="text-red-600 dark:text-red-400 font-mono">
                      ${parseFloat(ask.price).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {sizeNum.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No sell orders
            </p>
          )}
        </div>
      </div>

      {/* Spread */}
      <div className="py-2 px-2 bg-muted/50 rounded text-center">
        <span className="text-xs font-semibold text-muted-foreground">
          {orderbook.bids.length > 0 && orderbook.asks.length > 0 ? (
            <>
              Spread: $
              {(parseFloat(orderbook.asks[0].price) - parseFloat(orderbook.bids[0].price)).toFixed(2)}
            </>
          ) : (
            "No spread data"
          )}
        </span>
      </div>

      {/* Bids (Buy Orders) */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-2 px-2">
          <span>Price</span>
          <span>Size</span>
        </div>
        
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {orderbook.bids.length > 0 ? (
            orderbook.bids.slice(0, 10).map((bid, index) => {
              const sizeNum = parseFloat(bid.size);
              const widthPercent = (sizeNum / maxSize) * 100;
              
              return (
                <div key={index} className="relative">
                  <div 
                    className="absolute inset-0 bg-green-100 dark:bg-green-950/30"
                    style={{ width: `${widthPercent}%` }}
                  />
                  <div className="relative flex justify-between px-2 py-1 text-sm">
                    <span className="text-green-600 dark:text-green-400 font-mono">
                      ${parseFloat(bid.price).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {sizeNum.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No buy orders
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderbookDisplay;
