// components/TradingInterface.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface TradingInterfaceProps {
  marketId: string;
  selectedOutcome: string;
  outcomes: Array<{ name: string; price: string }>;
  onOutcomeChange: (outcome: string) => void;
  orderType: 'yes' | 'no';
  onOrderTypeChange: (type: 'yes' | 'no') => void;
}

const TradingInterface = ({ 
  marketId, 
  selectedOutcome, 
  outcomes,
  onOutcomeChange 
}: TradingInterfaceProps) => {
  const [amount, setAmount] = useState("");
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [orderPrice, setOrderPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOutcomeData = outcomes.find(o => o.name === selectedOutcome);
  const currentPrice = selectedOutcomeData ? parseFloat(selectedOutcomeData.price) : 0;

  const handleSubmit = async () => {
    if (!amount || !orderPrice) {
      alert("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Implement your trading logic here
      console.log({
        marketId,
        outcome: selectedOutcome,
        type: orderType,
        amount,
        price: orderPrice
      });
      
      // Reset form
      setAmount("");
      setOrderPrice("");
    } catch (error) {
      console.error("Trade failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPercentage = (price: number) => {
    return `${(price * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Outcome Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {outcomes.map((outcome) => {
          const price = parseFloat(outcome.price);
          const isSelected = selectedOutcome === outcome.name;
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
      <Tabs defaultValue="buy" onValueChange={(v) => setOrderType(v as 'buy' | 'sell')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            <TrendingDown className="w-4 h-4 mr-2" />
            Sell
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="buy" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Current Price Display */}
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(currentPrice)}
                </p>
                <p className="text-sm text-muted-foreground">
                  ${currentPrice.toFixed(2)} per share
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
                    placeholder={formatPercentage(currentPrice)}
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="text-right"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {formatPercentage(currentPrice)}
                  </p>
                </div>

                {/* Estimated Info */}
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Shares:</span>
                    <span className="font-medium">
                      {amount && orderPrice 
                        ? `${(parseFloat(amount) / parseFloat(orderPrice)).toFixed(2)}` 
                        : "0.00"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Cost:</span>
                    <span className="font-medium">${amount || "0.00"}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !amount || !orderPrice}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isSubmitting ? "Placing Order..." : "Place Buy Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Current Price Display */}
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatPercentage(1 - currentPrice)}
                </p>
                <p className="text-sm text-muted-foreground">
                  ${(1 - currentPrice).toFixed(2)} per share
                </p>
              </div>

              {/* Order Form (same as buy but with sell styling) */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Shares to Sell
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Limit Price (%)
                  </label>
                  <Input
                    type="number"
                    placeholder={formatPercentage(1 - currentPrice)}
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    className="text-right"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {formatPercentage(1 - currentPrice)}
                  </p>
                </div>

                {/* Estimated Info */}
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Payout:</span>
                    <span className="font-medium">
                      {amount && orderPrice 
                        ? `$${(parseFloat(amount) * parseFloat(orderPrice)).toFixed(2)}` 
                        : "$0.00"
                      }
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !amount || !orderPrice}
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  {isSubmitting ? "Placing Order..." : "Place Sell Order"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
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