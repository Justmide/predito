// components/TradingInterface.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface TradingInterfaceProps {
  marketId: string;
  marketSlug: string;
  selectedOutcome?: string;
  outcomes: Array<{ name: string; price: string }>;
  onOutcomeChange: (outcome: string) => void;
  orderType: 'buy' | 'sell';
  onOrderTypeChange: (type: 'buy' | 'sell') => void;
  onPlaceOrder: (order: {
    marketId: string;
    marketSlug: string;
    outcome: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
  }) => Promise<any>;
  isLoading?: boolean;
}

const TradingInterface = ({
  marketId,
  marketSlug,
  selectedOutcome,
  outcomes,
  onOutcomeChange,
  orderType,
  onOrderTypeChange,
  onPlaceOrder,
  isLoading = false
}: TradingInterfaceProps) => {
  const { user } = useAuth();
  const outcomeName = selectedOutcome || "Yes";
  const selectedOutcomeData = outcomes.find(o => o.name === outcomeName);
  const currentPrice = selectedOutcomeData ? parseFloat(selectedOutcomeData.price) : 0;

  const [amount, setAmount] = useState<string>(""); 
  const [orderPrice, setOrderPrice] = useState<string>(currentPrice.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profitPreview, setProfitPreview] = useState<{
    cost: number;
    potentialProfit: number;
    roi: number;
  } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [balanceCheck, setBalanceCheck] = useState<{
    sufficient: boolean;
    required: number;
  } | null>(null);

  const formatPercentage = (price: number) => `${(price * 100).toFixed(1)}%`;

  // Calculate estimated cost
  const calculateCost = () => {
    const parsedAmount = parseFloat(amount);
    const parsedPrice = parseFloat(orderPrice);
    
    if (isNaN(parsedAmount) || isNaN(parsedPrice) || parsedAmount <= 0) {
      return 0;
    }
    
    return orderType === 'buy' 
      ? parsedAmount * parsedPrice
      : parsedAmount * (1 - parsedPrice);
  };

  // Check balance when amount or price changes
  useEffect(() => {
    const cost = calculateCost();
    if (user && cost > 0) {
      setBalanceCheck({
        sufficient: user.availableBalance >= cost,
        required: cost
      });
    } else {
      setBalanceCheck(null);
    }
  }, [amount, orderPrice, orderType, user]);

  // Profit preview
  useEffect(() => {
    const fetchPreview = async () => {
      const parsedAmount = parseFloat(amount);
      const parsedPrice = parseFloat(orderPrice);

      // Only call API if both fields are valid
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
          console.warn("Profit preview failed:", data.message);
          // Fallback to frontend calculation
          const cost = calculateCost();
          const maxReturn = parsedAmount;
          const potentialProfit = maxReturn - cost;
          const roi = cost > 0 ? (potentialProfit / cost) * 100 : 0;
          
          setProfitPreview({
            cost,
            potentialProfit,
            roi
          });
        }
      } catch (err) {
        console.error("Profit preview error:", err);
        // Fallback to frontend calculation
        const cost = calculateCost();
        const maxReturn = parseFloat(amount) || 0;
        const potentialProfit = maxReturn - cost;
        const roi = cost > 0 ? (potentialProfit / cost) * 100 : 0;
        
        setProfitPreview({
          cost,
          potentialProfit,
          roi
        });
      } finally {
        setIsPreviewLoading(false);
      }
    };

    const timer = setTimeout(fetchPreview, 300);
    return () => clearTimeout(timer);
  }, [amount, orderPrice, selectedOutcome, orderType, marketSlug]);

  // Handle order submit
  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    const parsedPrice = parseFloat(orderPrice);

    if (!parsedAmount || parsedAmount <= 0 || !parsedPrice || parsedPrice <= 0) {
      toast.error("Please enter valid amount and price");
      return;
    }

    // Check balance locally first
    const cost = calculateCost();
    if (user && user.availableBalance < cost) {
      toast.error(`Insufficient balance. Required: $${cost.toFixed(2)}, Available: $${user.availableBalance.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onPlaceOrder({
        marketId,
        marketSlug, // Pass both
        outcome: outcomeName,
        type: orderType,
        amount: parsedAmount,
        price: parsedPrice
      });

      if (result && result.success) {
        toast.success(`Order placed successfully!`);
        setAmount("");
        setOrderPrice(currentPrice.toString());
        setProfitPreview(null);
      } else {
        toast.error(result?.error || "Order failed");
      }
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error(error.message || "Trade failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display user balance
  const displayBalance = () => {
    if (!user) return null;
    
    const balance = user.availableBalance || 0;
    const isLowBalance = balance < 10;
    
    return (
      <div className="mb-4 p-3 rounded-lg border bg-muted/50">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Available Balance:</span>
          <span className={`font-bold ${isLowBalance ? 'text-red-600' : 'text-green-600'}`}>
            ${balance.toFixed(2)}
          </span>
        </div>
        {isLowBalance && (
          <p className="text-xs text-red-500 mt-1">
            Low balance. Consider adding funds before trading.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* User Balance Display */}
      {displayBalance()}

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
                        min="0"
                        step="0.01"
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
                      min="0"
                      max="1"
                      step="0.01"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {formatPercentage(tab==='buy'?currentPrice:1-currentPrice)}
                    </p>
                  </div>

                  {/* Estimated Info */}
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Estimated Cost:</span>
                      <span className="font-medium">${calculateCost().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{tab==='buy'?'Shares to Buy':'Shares to Sell'}:</span>
                      <span className="font-medium">
                        {amount && orderPrice
                          ? (parseFloat(amount) / (tab === 'buy' ? parseFloat(orderPrice) : (1 - parseFloat(orderPrice)))).toFixed(2)
                          : "0.00"
                        }
                      </span>
                    </div>
                  </div>

                  {/* Balance Check Warning */}
                  {balanceCheck && !balanceCheck.sufficient && (
                    <div className="p-3 bg-red-50 rounded-lg text-sm">
                      <div className="flex justify-between text-red-700">
                        <span>Insufficient Balance:</span>
                        <span className="font-medium">
                          Need ${balanceCheck.required.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs mt-1">
                        Available: ${user?.availableBalance?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  )}

                  {/* Profit Preview */}
                  {profitPreview && !isPreviewLoading && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-800">Cost:</span>
                        <span className="font-medium text-blue-800">
                          ${profitPreview.cost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Potential Profit:</span>
                        <span className="font-medium text-green-700">
                          ${profitPreview.potentialProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">ROI:</span>
                        <span className="font-medium text-green-700">
                          {profitPreview.roi.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {isPreviewLoading && (
                    <div className="flex items-center justify-center p-3">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Calculating profit...</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isLoading || !amount || !orderPrice || (balanceCheck && !balanceCheck.sufficient)}
                    className={`w-full ${tab==='buy'?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'}`}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : `Place ${tab.charAt(0).toUpperCase()+tab.slice(1)} Order`}
                  </Button>
                  
                  {isLoading && (
                    <p className="text-xs text-center text-muted-foreground">
                      Processing your order...
                    </p>
                  )}
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
            disabled={user && user.availableBalance < value}
          >
            ${value}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TradingInterface;