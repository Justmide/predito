// pages/MarketDetails.tsx
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import OrderbookDisplay from "@/components/OrderbookDisplay";
import TradingInterface from "@/components/TradingInterface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { marketService, Market } from "@/services/marketService";
import { ArrowLeft, Clock, DollarSign, AlertCircle, BarChart3, Share2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

const MarketDetails = () => {
  const { marketId } = useParams<{ marketId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<string>("");
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');

  const normalizeOutcomes = (outcomes: string | Array<{ name: string; price: string | number }>): Array<{ name: string; price: number }> => {
    if (typeof outcomes === 'string') {
      try {
        const parsed = JSON.parse(outcomes);
        return parsed.map((name: string) => ({ name, price: 0.5 }));
      } catch {
        return [];
      }
    }
    return Array.isArray(outcomes)
      ? outcomes.map(o => ({ name: o.name, price: Number(o.price) || 0.5 }))
      : [];
  };

  const formatVolume = (volume: string | number) => {
    const num = Number(volume);
    if (isNaN(num)) return "$0";
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (price: number) => `${(price * 100).toFixed(1)}%`;

  const getTimeRemaining = (endDate?: string) => {
    if (!endDate) return "No end date";
    const diff = new Date(endDate).getTime() - new Date().getTime();
    if (diff < 0) return "Ended";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  };

  const safeToString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') return value.label || value.name || value.slug || value.title || value.text || '';
    return String(value);
  };

  const handleYesNoClick = (type: 'yes' | 'no') => {
    if (!isAuthenticated) {
      navigate("/signin");
      toast.info("Please sign in to trade");
      return;
    }
    setOrderType('buy'); // default buy
    const outcome = normalizedOutcomes.find(o => o.name.toLowerCase() === type);
    if (outcome) setSelectedOutcome(outcome.name);
  };

  useEffect(() => {
    if (!marketId) {
      navigate("/markets");
      return;
    }

    const fetchMarketDetails = async () => {
      try {
        setLoading(true);
        const data = await marketService.getMarket(marketId);
        setMarket(data);

        const normalized = normalizeOutcomes(data.outcomes);
        if (normalized.length > 0) {
          const yesOutcome = normalized.find(o => o.name.toLowerCase().includes('yes'));
          setSelectedOutcome(yesOutcome ? yesOutcome.name : normalized[0].name);
        }
      } catch (error: any) {
        console.error("Market details error:", error);
        toast.error("Failed to load market details");
        navigate("/markets");
      } finally {
        setLoading(false);
      }
    };

    fetchMarketDetails();
  }, [marketId, navigate]);

  const normalizedOutcomes = useMemo(() => normalizeOutcomes(market?.outcomes || []), [market]);
  const yesOutcome = useMemo(() => normalizedOutcomes.find(o => o.name.toLowerCase().includes('yes')), [normalizedOutcomes]);
  const noOutcome = useMemo(() => normalizedOutcomes.find(o => o.name.toLowerCase().includes('no')), [normalizedOutcomes]);

  const yesPrice = yesOutcome?.price ?? 0.5;
  const noPrice = noOutcome?.price ?? 0.5;
  const endDate = market?.endDateIso || market?.end_date_iso || "";

  // ------------------ PLACE ORDER ------------------
  const handlePlaceOrder = async (order: { marketId: string; outcome: string; type: 'buy' | 'sell'; amount: string; price: string }) => {
    const token = localStorage.getItem("token") || "";
    const res = await fetch("/api/trading/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error("Order failed");
    return res.json();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-12">
          <p className="text-center text-muted-foreground">Market not found</p>
          <Button onClick={() => navigate("/markets")} className="mt-4 mx-auto block" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <Button onClick={() => navigate("/markets")} variant="ghost" size="sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Markets
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.info("Share feature coming soon")}>
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-8 py-3 sm:py-6 space-y-4">
        <div className="bg-card rounded-xl border p-3 sm:p-4 space-y-4">
          {/* Market Header */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {market.category && <Badge variant="secondary">{safeToString(market.category)}</Badge>}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> {getTimeRemaining(endDate)} left
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <DollarSign className="w-3 h-3" /> {formatVolume(market.volume)}
            </div>
          </div>

          <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground leading-tight mb-4">
            {market.question}
          </h1>

          {/* Quick YES/NO buttons */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
            <div onClick={() => handleYesNoClick('yes')} className={`rounded-lg border-2 p-3 cursor-pointer ${selectedOutcome.toLowerCase() === 'yes' ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-green-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm sm:text-base font-bold text-green-600">YES</span>
                <div className={`w-2 h-2 rounded-full ${selectedOutcome.toLowerCase() === 'yes' ? 'bg-green-500' : 'bg-transparent border border-green-300'}`} />
              </div>
              <p className="text-xs">${yesPrice.toFixed(2)}</p>
            </div>

            <div onClick={() => handleYesNoClick('no')} className={`rounded-lg border-2 p-3 cursor-pointer ${selectedOutcome.toLowerCase() === 'no' ? 'border-red-500 bg-red-500/5' : 'border-border hover:border-red-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm sm:text-base font-bold text-red-600">NO</span>
                <div className={`w-2 h-2 rounded-full ${selectedOutcome.toLowerCase() === 'no' ? 'bg-red-500' : 'bg-transparent border border-red-300'}`} />
              </div>
              <p className="text-xs">${noPrice.toFixed(2)}</p>
            </div>
          </div>

          {/* Trading Interface */}
          <TradingInterface
            marketId={market.id}
            selectedOutcome={selectedOutcome}
            outcomes={normalizedOutcomes}
            onOutcomeChange={setSelectedOutcome}
            orderType={orderType}
            onOrderTypeChange={setOrderType}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>
      </main>
    </div>
  );
};

export default MarketDetails;
