import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import TradingInterface from "@/components/TradingInterface";
import { Badge } from "@/components/ui/badge";
import { marketService, Market, PlaceOrderParams } from "@/services/marketService";
import { ArrowLeft, Clock, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MarketDetails = () => {
  const { marketId } = useParams<{ marketId: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<string>("");
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [profitPreview, setProfitPreview] = useState<any>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  // --- HELPER FUNCTIONS ---
  const normalizeOutcomes = (outcomes: any): Array<{ name: string; price: number }> => {
    if (typeof outcomes === 'string') {
      try {
        const parsed = JSON.parse(outcomes);
        return parsed.map((name: string) => ({ name, price: 0.5 }));
      } catch { return []; }
    }
    return Array.isArray(outcomes)
      ? outcomes.map(o => ({ 
          name: o.name, 
          price: Number(o.price) || 0.5 
        }))
      : [];
  };

  const formatVolume = (volume: string | number) => {
    const num = Number(volume);
    if (isNaN(num)) return "$0";
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getTimeRemaining = (endDate?: string) => {
    if (!endDate) return "No end date";
    const diff = new Date(endDate).getTime() - new Date().getTime();
    if (diff < 0) return "Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const safeToString = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      const potential = value.name || value.label || '';
      return typeof potential === 'string' ? potential : '';
    }
    return String(value);
  };

  // --- HANDLERS ---
  const handleYesNoClick = (type: 'yes' | 'no') => {
    if (!isAuthenticated) {
      toast.info("Please sign in to trade");
      navigate("/signin");
      return;
    }
    const target = type === 'yes' ? 'yes' : 'no';
    const found = normalizedOutcomes.find(o => o.name.toLowerCase().includes(target));
    if (found) {
      setSelectedOutcome(found.name);
      setOrderType('buy'); // Default to buy when clicking Yes/No buttons
    }
  };

  // FIXED: Proper handlePlaceOrder function
  const handlePlaceOrder = useCallback(async (orderData: any) => {
    if (!market || !isAuthenticated) {
      toast.error("Market data not loaded or user not authenticated");
      return { success: false };
    }

    try {
      setPlacingOrder(true);
      
      // 1. FIRST CHECK USER BALANCE BEFORE ANYTHING
      if (user && user.availableBalance !== undefined) {
        // Calculate cost manually first (frontend validation)
        const cost = orderData.type === 'buy' 
          ? orderData.amount * orderData.price
          : orderData.amount * (1 - orderData.price);
        
        if (user.availableBalance < cost) {
          toast.error(`Insufficient balance. Required: $${cost.toFixed(2)}, Available: $${user.availableBalance.toFixed(2)}`);
          return { success: false, error: 'Insufficient balance' };
        }
      }

      // 2. Preview profit (optional, but helpful)
      let profitPreviewData = null;
      try {
        if (marketService.previewBetProfit) {
          const previewResult = await marketService.previewBetProfit({
            marketSlug: market.slug || market.id,
            outcome: orderData.outcome,
            side: orderData.type.toUpperCase(),
            price: orderData.price,
            size: orderData.amount
          });
          
          profitPreviewData = previewResult?.data;
          setProfitPreview(profitPreviewData);
          console.log("Profit preview:", profitPreviewData);
        }
      } catch (previewError) {
        console.warn("Profit preview failed:", previewError);
        // Don't fail the order if preview fails
      }

      // 3. Prepare order with ALL required fields
      const params: PlaceOrderParams = {
        marketId: market.id,
        marketSlug: market.slug, // CRITICAL
        outcome: orderData.outcome,
        side: orderData.type,
        amount: orderData.amount,
        price: orderData.price,
        size: orderData.amount // Alternative field
      };

      console.log("📤 Placing order:", params);

      // 4. Place the order
      const result = await marketService.placeOrder(params);
      
      if (result && result.success) {
        const profitMsg = profitPreviewData 
          ? `Potential profit: $${profitPreviewData.profit.potentialProfit} (${profitPreviewData.profit.roi}% ROI)`
          : '';
        
        toast.success(
          <div>
            <p className="font-bold">Order placed successfully!</p>
            {profitMsg && <p className="text-sm mt-1">{profitMsg}</p>}
          </div>
        );
        
        // 5. Update user balance immediately (optimistic update)
        if (user && profitPreviewData?.profit?.cost) {
          console.log("Deducting from balance:", profitPreviewData.profit.cost);
          // Note: In a real app, you would update your auth context here
        }
        
        return result;
      } else {
        const errorMsg = result?.message || result?.error || "Order placement failed";
        toast.error(`Order failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      console.error("Order placement error:", error);
      
      // User-friendly error messages
      let errorMessage = "Order placement failed";
      if (error.message.includes("Insufficient balance")) {
        errorMessage = "Insufficient balance to place this order";
      } else if (error.message.includes("Market not found")) {
        errorMessage = "Market not found. Please try refreshing the page.";
      } else if (error.message.includes("Session expired")) {
        errorMessage = "Your session has expired. Please sign in again.";
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }
      
      toast.error(errorMessage);
      return { success: false, error: error.message };
    } finally {
      setPlacingOrder(false);
    }
  }, [market, isAuthenticated, user, marketId, navigate]);

  // Load market data
  useEffect(() => {
    if (!marketId) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await marketService.getMarket(marketId);
        setMarket(data);
        
        // Initialize with Yes outcome
        const normalized = normalizeOutcomes(data.outcomes);
        if (normalized.length > 0) {
          const yes = normalized.find(o => o.name.toLowerCase().includes('yes'));
          setSelectedOutcome(yes ? yes.name : normalized[0].name);
        }
      } catch (err) {
        console.error("Failed to load market:", err);
        toast.error("Market not found");
        navigate("/markets");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [marketId, navigate]);

  // Calculate prices from outcomes
  const normalizedOutcomes = useMemo(() => normalizeOutcomes(market?.outcomes), [market]);
  const yesPrice = normalizedOutcomes.find(o => o.name.toLowerCase().includes('yes'))?.price ?? 0.5;
  const noPrice = normalizedOutcomes.find(o => o.name.toLowerCase().includes('no'))?.price ?? 0.5;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-center items-center py-40">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading Market...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Market Not Found</h2>
            <p className="text-muted-foreground mt-2">The market you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/markets")} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <Button 
          onClick={() => navigate("/markets")} 
          variant="ghost" 
          size="sm"
          className="hover:bg-accent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Market Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="px-3 py-1">
                  {safeToString(market.category)}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 
                  {getTimeRemaining(market.endDateIso)}
                </span>
                {market.volume && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {formatVolume(market.volume)} volume
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold leading-tight">{market.question}</h1>
              
              {market.description && (
                <p className="text-muted-foreground">{market.description}</p>
              )}

              {/* Yes/No Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button
                  variant="outline"
                  className={`h-24 flex-col gap-2 border-2 transition-all ${
                    selectedOutcome.toLowerCase().includes('yes') 
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                      : 'hover:border-green-300'
                  }`}
                  onClick={() => handleYesNoClick('yes')}
                  disabled={!isAuthenticated}
                >
                  <span className="text-green-600 dark:text-green-400 font-bold text-lg">YES</span>
                  <span className="text-2xl font-mono font-bold">${yesPrice.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">Buy Yes shares</span>
                </Button>
                <Button
                  variant="outline"
                  className={`h-24 flex-col gap-2 border-2 transition-all ${
                    selectedOutcome.toLowerCase().includes('no') 
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20' 
                      : 'hover:border-red-300'
                  }`}
                  onClick={() => handleYesNoClick('no')}
                  disabled={!isAuthenticated}
                >
                  <span className="text-red-600 dark:text-red-400 font-bold text-lg">NO</span>
                  <span className="text-2xl font-mono font-bold">${noPrice.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">Buy No shares</span>
                </Button>
              </div>

              {/* Market Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">Volume</div>
                  <div className="text-xl font-bold">{formatVolume(market.volume)}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">Yes Price</div>
                  <div className="text-xl font-bold text-green-600">${yesPrice.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">No Price</div>
                  <div className="text-xl font-bold text-red-600">${noPrice.toFixed(2)}</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="text-sm text-muted-foreground">Spread</div>
                  <div className="text-xl font-bold">${Math.abs(yesPrice - noPrice).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Trading Interface */}
          <div className="space-y-6">
            <div className="sticky top-6">
             <TradingInterface
  marketId={market.id}
  marketSlug={market.slug} // Make sure this exists
  selectedOutcome={selectedOutcome}
  outcomes={normalizedOutcomes}
  onOutcomeChange={setSelectedOutcome}
  orderType={orderType}
  onOrderTypeChange={setOrderType}
  onPlaceOrder={handlePlaceOrder}
  isLoading={placingOrder}
/>

              {/* Profit Preview Card */}
              {profitPreview && (
                <div className="mt-4 p-4 rounded-xl border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800 dark:text-green-300">Profit Preview</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Cost:</span>
                      <span className="font-mono font-bold">${profitPreview.profit.cost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Potential Profit:</span>
                      <span className="font-mono font-bold text-green-600">
                        ${profitPreview.profit.potentialProfit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">ROI:</span>
                      <span className="font-mono font-bold text-green-600">
                        {profitPreview.profit.roi}%
                      </span>
                    </div>
                    {profitPreview.userBalance && (
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-sm">Remaining Balance:</span>
                        <span className="font-mono">
                          ${profitPreview.userBalance.remainingAfterBet}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Authentication Warning */}
              {!isAuthenticated && (
                <div className="mt-4 p-4 rounded-xl border bg-yellow-50 dark:bg-yellow-950/20">
                  <div className="text-sm text-yellow-800 dark:text-yellow-300">
                    <p className="font-medium mb-2">Sign in to trade</p>
                    <p className="text-xs">You need to be signed in to place orders and track your profits.</p>
                    <Button 
                      onClick={() => navigate("/signin")} 
                      size="sm" 
                      className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDetails;