import { useEffect, useState } from "react";
import { marketService, Orderbook } from "@/services/marketService";

interface Props {
  marketSlug: string;        // ✅ Must be slug, not ID
  outcome?: string;          // Default: "Yes"
}

export default function OrderbookDisplay({ marketSlug, outcome = "Yes" }: Props) {
  const [orderbook, setOrderbook] = useState<Orderbook>({ bids: [], asks: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!marketSlug) return;

    const fetchOrderbook = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await marketService.getOrderbook(marketSlug, outcome);
        setOrderbook(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch orderbook");
        setOrderbook({ bids: [], asks: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderbook();
  }, [marketSlug, outcome]);

  if (loading) return <div>Loading orderbook...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="orderbook-container border p-4 rounded-md">
      <h3 className="text-lg font-bold mb-2">
        Orderbook for {marketSlug} ({outcome})
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-1">Bids</h4>
          {orderbook.bids.length === 0 ? (
            <div>No bids</div>
          ) : (
            orderbook.bids.map((bid, i) => (
              <div key={i} className="flex justify-between">
                <span>{bid.size}</span>
                <span>{bid.price}</span>
              </div>
            ))
          )}
        </div>

        <div>
          <h4 className="font-semibold mb-1">Asks</h4>
          {orderbook.asks.length === 0 ? (
            <div>No asks</div>
          ) : (
            orderbook.asks.map((ask, i) => (
              <div key={i} className="flex justify-between">
                <span>{ask.size}</span>
                <span>{ask.price}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {orderbook.spread !== undefined && (
        <div className="mt-2 font-semibold">
          Spread: {orderbook.spread.toFixed(4)}
        </div>
      )}
    </div>
  );
}
