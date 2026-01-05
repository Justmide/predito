// components/TradingInterface.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

interface TradingInterfaceProps {
  marketSlug: string; // always slug, not id
  selectedOutcome?: string;
  outcomes: Array<{ name: string; price: string }>;
  onOutcomeChange: (outcome: string) => void;
  orderType: 'buy' | 'sell';
  onOrderTypeChange: (type: 'buy' | 'sell') => void;
  onPlaceOrder: (order: {
    marketSlug: string;
    outcome: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
  }) => Promise<any>;
}

const TradingInterface = ({
  marketSlug,
  selectedOutcome,
  outcomes,
  onOutcomeChange,
  orderType,
  onOrderTypeChange,
  onPlaceOrder
}: TradingInterfaceProps) => {
  const outcomeName = selectedOutcome || "Yes";
  const selectedOutcomeData = outcomes.find(o => o.name === outcomeName);
  const currentPrice = selectedOutcomeData ? parseFloat(selectedOutcomeData.price) : 0;

  const [amount, setAmount] = useState<string>(""); 
  const [orderPrice, setOrderPrice] = useState<string>(currentPrice.toString()); // prefill price
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profitPreview, setProfitPreview] = useState<{ potentialProfit: number } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const formatPercentage = (price: number) => `${(price * 100).toFixed(1)}%`;

  // ------------------- PROFIT PREVIEW -------------------
  useEffect(() => {
    const fetchPreview = async () => {
      const parsedAmount = parseFloat(amount);
      const parsedPrice = parseFloat(orderPrice);

      // Only call API if both fields are valid numbers > 0
      if (!marketSlug || !outcomeName || !orderType || isNaN(parsedAmount) || parsedAmount <= 0 || isNaN(parsedPrice) || parsedPrice <= 0) {
        setProfitPreview(null);
        setIsPreviewLoading(false);
        return;
      }

      setIsPreviewLoading(true);

      try {
        const res = await fetch(`${API_BASE_URL}/trading/bet/preview`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
          },
          body: JSON.stringify({
            marketSlug,
            outcome: outcomeName,
            side: orderType.toUpperCase(),
            price: parsedPrice,
            size: parsedAmount
          }),
        });

        const data = await res.json();

        if (data.status === "success") {
          setProfitPreview(data.data.profit);
        } else {
          setProfitPreview(null);
          console.warn("Profit preview failed:", data.message);
        }
      } catch (err) {
        console.error("Profit preview error:", err);
        setProfitPreview(null);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    const timer = setTimeout(fetchPreview, 300); // debounce 300ms
    return () => clearTimeout(timer);
  }, [amount, orderPrice, selectedOutcome, orderType, marketSlug]);

  // ------------------- HANDLE ORDER SUBMIT -------------------
  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    const parsedPrice = parseFloat(orderPrice);

    if (!parsedAmount || !parsedPrice) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!profitPreview) {
      toast.error("Cannot calculate profit. Try again");
      return;
    }

    setIsSubmitting(true);
    try {
      await onPlaceOrder({
        marketSlug,
        outcome: outcomeName,
        type: orderType,
        amount: parsedAmount,
        price: parsedPrice
      });

      toast.success(`Order placed! Estimated profit: $${profitPreview.potentialProfit.toFixed(2)}`);
      setAmount("");
      setOrderPrice(currentPrice.toString()); // reset to current price
      setProfitPreview(null);
    } catch (error) {
      console.error(error);
      toast.error("Trade failed");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-4">
      {/* Outcome Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {outcomes.map((outcome) => {
          const price = parseFloat(outcome.price);
          const isSelected = outcomeName === outcome.name;
          const isYes = outcome.name.toLowerCase().includes('yes');

          return (
            <Button
              key={outcome.name}
              variant={isSelected ? "default" : "outline"}
              className={`
                flex-1 min-w-[80px] whitespace-nowrap
                ${isYes && isSelected ? 'bg-green-600 hover:bg-green-700' : ''}
                ${!isYes && isSelected ? 'bg-red-600 hover:bg-red-700' : ''}
              `}
              onClick={() => onOutcomeChange(outcome.name)}
            >
              <span className="text-xs font-medium">{outcome.name}</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {formatPercentage(price)}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Buy/Sell Tabs */}
      <Tabs value={orderType} onValueChange={(v) => onOrderTypeChange(v as 'buy' | 'sell')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" /> Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            <TrendingDown className="w-4 h-4 mr-2" /> Sell
          </TabsTrigger>
        </TabsList>

        {['buy','sell'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Current Price Display */}
                <div className={`text-center p-3 rounded-lg ${tab==='buy'?'bg-green-50':'bg-red-50'}`}>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className={`text-2xl font-bold ${tab==='buy'?'text-green-600':'text-red-600'}`}>
                    {formatPercentage(tab==='buy'?currentPrice:1-currentPrice)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${tab==='buy'?currentPrice.toFixed(2):(1-currentPrice).toFixed(2)} per share
                  </p>
                </div>

                {/* Order Form */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Amount ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Limit Price (%)
                    </label>
                    <Input
                      type="number"
                      placeholder={formatPercentage(tab==='buy'?currentPrice:1-currentPrice)}
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      className="text-right"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {formatPercentage(tab==='buy'?currentPrice:1-currentPrice)}
                    </p>
                  </div>

                  {/* Estimated Info */}
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{tab==='buy'?'Estimated Shares':'Estimated Payout'}:</span>
                      <span className="font-medium">
                        {amount && orderPrice
                          ? tab==='buy'
                            ? (parseFloat(amount)/parseFloat(orderPrice)).toFixed(2)
                            : `$${(parseFloat(amount)*parseFloat(orderPrice)).toFixed(2)}`
                          : tab==='buy' ? "0.00" : "$0.00"
                        }
                      </span>
                    </div>
                    {tab==='buy' && (
                      <div className="flex justify-between text-sm">
                        <span>Max Cost:</span>
                        <span className="font-medium">${amount || "0.00"}</span>
                      </div>
                    )}
                  </div>

                  {/* Profit Preview */}
                  {profitPreview && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Potential Profit:</span>
                        <span className="font-medium">
                          ${profitPreview.potentialProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  {isPreviewLoading && (
                    <p className="text-xs text-muted-foreground mt-1">Calculating profit...</p>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !amount || !orderPrice}
                    className={`w-full ${tab==='buy'?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'}`}
                    size="lg"
                  >
                    {isSubmitting ? "Placing Order..." : `Place ${tab.charAt(0).toUpperCase()+tab.slice(1)} Order`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

      </Tabs>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[10, 25, 50, 100].map((value) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => setAmount(value.toString())}
            className="text-xs"
          >
            ${value}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TradingInterface;
