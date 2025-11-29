import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import OrderbookDisplay from "@/components/OrderbookDisplay";
import TradingInterface from "@/components/TradingInterface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { marketService, Market } from "@/services/marketService";
import { ArrowLeft, TrendingUp, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

const MarketDetails = () => {
  const { marketId } = useParams<{ marketId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<string>("");

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
        
        // Set first outcome as default selection
        if (data.outcomes && data.outcomes.length > 0) {
          setSelectedOutcome(data.outcomes[0].name);
        }
      } catch (error) {
        toast.error("Failed to load market details");
        console.error(error);
        navigate("/markets");
      } finally {
        setLoading(false);
      }
    };

    fetchMarketDetails();
  }, [marketId, navigate]);

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
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
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Market not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Link 
          to="/markets" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markets
        </Link>

        {/* Market Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            {market.image && (
              <img 
                src={market.image} 
                alt={market.question}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-3">
                {market.question}
              </h1>
              
              {market.tags && market.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {market.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>Volume: {formatVolume(market.volume)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{getTimeRemaining(market.end_date_iso)}</span>
                </div>
              </div>
            </div>
          </div>

          {market.description && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">About this market</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {market.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Market Outcomes */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Outcomes</CardTitle>
              <CardDescription>Current market prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {market.outcomes.map((outcome, index) => {
                  const price = parseFloat(outcome.price);
                  const percentage = (price * 100).toFixed(1);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedOutcome(outcome.name)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedOutcome === outcome.name
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground">
                          {outcome.name}
                        </span>
                        <TrendingUp className={`w-4 h-4 ${
                          selectedOutcome === outcome.name ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {percentage}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ${price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Interface and Orderbook */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trading Interface */}
          <Card>
            <CardHeader>
              <CardTitle>Trade</CardTitle>
              <CardDescription>
                {isAuthenticated 
                  ? "Place your order below" 
                  : "Sign in to start trading"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAuthenticated ? (
                <TradingInterface
                  marketId={market.id}
                  selectedOutcome={selectedOutcome}
                  outcomes={market.outcomes}
                  onOutcomeChange={setSelectedOutcome}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Sign in to place trades
                  </p>
                  <Link 
                    to="/signin"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orderbook */}
          <Card>
            <CardHeader>
              <CardTitle>Order Book</CardTitle>
              <CardDescription>
                Live buy and sell orders for {selectedOutcome}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderbookDisplay 
                marketId={market.id}
                outcome={selectedOutcome}
              />
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Market ID</span>
                  <span className="font-mono text-sm">{market.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Total Volume</span>
                  <span className="font-semibold">{formatVolume(market.volume)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">End Date</span>
                  <span>{new Date(market.end_date_iso).toLocaleString()}</span>
                </div>
                {market.category && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Category</span>
                    <span className="capitalize">{market.category}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rules" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>This market will resolve based on credible sources and official announcements</li>
                    <li>Resolution will occur shortly after the event outcome is confirmed</li>
                    <li>In case of ambiguity, the market may be resolved by the Markets Integrity Committee</li>
                    <li>All trades are final and cannot be reversed</li>
                    <li>Market may close early if outcome becomes certain before end date</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MarketDetails;
