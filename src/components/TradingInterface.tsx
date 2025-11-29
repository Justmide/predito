import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tradingService } from "@/services/tradingService";
import { toast } from "sonner";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Outcome {
  name: string;
  price: string;
}

interface TradingInterfaceProps {
  marketId: string;
  selectedOutcome: string;
  outcomes: Outcome[];
  onOutcomeChange: (outcome: string) => void;
}

const TradingInterface = ({ 
  marketId, 
  selectedOutcome, 
  outcomes,
  onOutcomeChange 
}: TradingInterfaceProps) => {
  const { token } = useAuth();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedOutcomeData = outcomes.find(o => o.name === selectedOutcome);
  const currentPrice = selectedOutcomeData ? parseFloat(selectedOutcomeData.price) : 0;

  const calculateTotal = () => {
    const amountNum = parseFloat(amount) || 0;
    const priceNum = parseFloat(price) || currentPrice;
    return (amountNum * priceNum).toFixed(2);
  };

  const calculatePotentialReturn = () => {
    const amountNum = parseFloat(amount) || 0;
    const priceNum = parseFloat(price) || currentPrice;
    if (side === "buy") {
      // Potential return if outcome wins
      return (amountNum / priceNum).toFixed(2);
    } else {
      // Selling - return is the amount you get
      return (amountNum * priceNum).toFixed(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please sign in to trade");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!price || parseFloat(price) <= 0 || parseFloat(price) > 1) {
      toast.error("Price must be between 0 and 1");
      return;
    }

    try {
      setLoading(true);
      
      await tradingService.placeOrder(token, {
        marketId,
        outcome: selectedOutcome,
        side,
        size: amount,
        price,
      });

      toast.success(`${side === "buy" ? "Buy" : "Sell"} order placed successfully`);
      
      // Reset form
      setAmount("");
      setPrice(currentPrice.toFixed(2));
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Outcome Selector */}
      <div className="space-y-2">
        <Label htmlFor="outcome">Select Outcome</Label>
        <Select value={selectedOutcome} onValueChange={onOutcomeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose outcome" />
          </SelectTrigger>
          <SelectContent>
            {outcomes.map((outcome, index) => (
              <SelectItem key={index} value={outcome.name}>
                <div className="flex items-center justify-between w-full">
                  <span>{outcome.name}</span>
                  <span className="ml-4 text-muted-foreground">
                    ${parseFloat(outcome.price).toFixed(2)}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Buy/Sell Tabs */}
      <Tabs value={side} onValueChange={(v) => setSide(v as "buy" | "sell")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-900">
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-900">
            <TrendingDown className="w-4 h-4 mr-2" />
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4 mt-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Buying {selectedOutcome} shares. You profit if this outcome occurs.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4 mt-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Selling {selectedOutcome} shares. You profit if this outcome does NOT occur.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (shares)</Label>
        <Input
          id="amount"
          type="number"
          step="1"
          min="1"
          placeholder="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      {/* Price Input */}
      <div className="space-y-2">
        <Label htmlFor="price">Price per share</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            $
          </span>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            max="0.99"
            placeholder={currentPrice.toFixed(2)}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="pl-7"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Current market price: ${currentPrice.toFixed(2)}
        </p>
      </div>

      {/* Order Summary */}
      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Cost</span>
          <span className="font-semibold">${calculateTotal()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {side === "buy" ? "Potential Return" : "You'll Receive"}
          </span>
          <span className="font-semibold text-primary">
            ${calculatePotentialReturn()}
          </span>
        </div>
        {side === "buy" && (
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Potential Profit</span>
            <span className="font-semibold text-green-600">
              ${(parseFloat(calculatePotentialReturn()) - parseFloat(calculateTotal())).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full"
        disabled={loading}
        variant={side === "buy" ? "default" : "destructive"}
      >
        {loading ? "Processing..." : side === "buy" ? "Place Buy Order" : "Place Sell Order"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Orders are subject to market availability and may be partially filled
      </p>
    </form>
  );
};

export default TradingInterface;
