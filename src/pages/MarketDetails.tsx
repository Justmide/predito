// pages/MarketDetails.tsx
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
  const [orderType, setOrderType] = useState<'yes' | 'no'>('yes');

  const normalizeOutcomes = (outcomes: string | Array<{ name: string; price: string }>): Array<{ name: string; price: string }> => {
    if (typeof outcomes === 'string') {
      try {
        const parsed = JSON.parse(outcomes);
        return parsed.map((name: string) => ({ name, price: "0.5" }));
      } catch {
        return [];
      }
    }
    return Array.isArray(outcomes) ? outcomes : [];
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
        
        const normalizedOutcomes = Array.isArray(data.outcomes) ? data.outcomes : [];
        if (normalizedOutcomes.length > 0) {
          const yesOutcome = normalizedOutcomes.find(o => 
            typeof o.name === 'string' && o.name.toLowerCase().includes('yes')
          );
          setSelectedOutcome(yesOutcome ? yesOutcome.name : normalizedOutcomes[0].name);
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

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (isNaN(num)) return "$0";
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (price: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return "0%";
    return `${(num * 100).toFixed(1)}%`;
  };

  const getTimeRemaining = (endDate: string) => {
    if (!endDate) return "No end date";
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  };

  const handleYesNoClick = (type: 'yes' | 'no') => {
    if (!isAuthenticated) {
      navigate("/signin");
      toast.info("Please sign in to trade");
      return;
    }
    
    setOrderType(type);
    const normalizedOutcomes = normalizeOutcomes(market?.outcomes || []);
    if (type === 'yes') {
      const yesOutcome = normalizedOutcomes.find(o => 
        typeof o.name === 'string' && o.name.toLowerCase().includes('yes')
      );
      if (yesOutcome) setSelectedOutcome(yesOutcome.name);
    } else {
      const noOutcome = normalizedOutcomes.find(o => 
        typeof o.name === 'string' && o.name.toLowerCase().includes('no')
      );
      if (noOutcome) setSelectedOutcome(noOutcome.name);
    }
  };

  const safeToString = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object') {
      return value.label || value.name || value.slug || value.title || value.text || '';
    }
    return String(value);
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
          <Button 
            onClick={() => navigate("/markets")} 
            className="mt-4 mx-auto block"
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Markets
          </Button>
        </div>
      </div>
    );
  }

  const normalizedOutcomes = normalizeOutcomes(market.outcomes);
  const endDate = market.endDateIso || market.end_date_iso || "";
  
  const yesOutcome = normalizedOutcomes.find(o => 
    typeof o.name === 'string' && o.name.toLowerCase().includes('yes')
  );
  const noOutcome = normalizedOutcomes.find(o => 
    typeof o.name === 'string' && o.name.toLowerCase().includes('no')
  );
  
  const yesPrice = yesOutcome ? parseFloat(yesOutcome.price) : 0.5;
  const noPrice = noOutcome ? parseFloat(noOutcome.price) : 0.5;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Top Navigation - Minimal */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => navigate("/markets")} 
              variant="ghost" 
              size="sm"
              className="px-2 sm:px-3"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Markets</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => toast.info("Share feature coming soon")}
              >
                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-8 py-3 sm:py-6">
        {/* Mobile First Layout */}
        <div className="space-y-4 sm:space-y-6">
          {/* Market Header - Stacked on mobile */}
          <div className="bg-card rounded-xl border p-3 sm:p-4">
            {/* Category & Status */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {market.category && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">
                  {safeToString(market.category)}
                </Badge>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{getTimeRemaining(endDate)} left</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <DollarSign className="w-3 h-3" />
                <span>{formatVolume(market.volume)}</span>
              </div>
            </div>

            {/* Market Question */}
            <h1 className="text-base sm:text-xl md:text-2xl font-bold text-foreground leading-tight mb-4">
              {market.question}
            </h1>

            {/* YES/NO Quick Action Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
              {/* YES Card */}
              <div 
                className={`
                  rounded-lg border-2 p-3 cursor-pointer transition-all
                  ${orderType === 'yes' ? 'border-green-500 bg-green-500/5' : 'border-border hover:border-green-300'}
                `}
                onClick={() => handleYesNoClick('yes')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base font-bold text-green-600">YES</span>
                  <div className={`w-2 h-2 rounded-full ${orderType === 'yes' ? 'bg-green-500' : 'bg-transparent border border-green-300'}`} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                      {formatPercentage(yesOutcome?.price || "0.5")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ${yesPrice.toFixed(2)}
                    </span>
                  </div>
                  
                  <Progress 
                    value={yesPrice * 100} 
                    className="h-1.5 bg-gray-200"
                    indicatorClassName="bg-green-500"
                  />
                </div>
              </div>

              {/* NO Card */}
              <div 
                className={`
                  rounded-lg border-2 p-3 cursor-pointer transition-all
                  ${orderType === 'no' ? 'border-red-500 bg-red-500/5' : 'border-border hover:border-red-300'}
                `}
                onClick={() => handleYesNoClick('no')}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm sm:text-base font-bold text-red-600">NO</span>
                  <div className={`w-2 h-2 rounded-full ${orderType === 'no' ? 'bg-red-500' : 'bg-transparent border border-red-300'}`} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-bold text-red-600">
                      {formatPercentage(noOutcome?.price || "0.5")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ${noPrice.toFixed(2)}
                    </span>
                  </div>
                  
                  <Progress 
                    value={noPrice * 100} 
                    className="h-1.5 bg-gray-200"
                    indicatorClassName="bg-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Buy Buttons - Always visible */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base h-10 sm:h-12"
                size="lg"
                onClick={() => handleYesNoClick('yes')}
              >
                Buy YES
              </Button>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-sm sm:text-base h-10 sm:h-12"
                size="lg"
                onClick={() => handleYesNoClick('no')}
              >
                Buy NO
              </Button>
            </div>
          </div>

          {/* Description Card - Collapsible on mobile */}
          {market.description && (
            <Card>
              <CardHeader className="pb-3 px-3 sm:px-6">
                <CardTitle className="text-sm sm:text-base">About this market</CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {market.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid - Stack on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Trading & Details */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Trading Interface */}
              <Card>
                <CardHeader className="pb-3 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base">Trade</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {isAuthenticated 
                      ? `Place your order for ${orderType.toUpperCase()}` 
                      : "Sign in to start trading"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pt-0">
                  {isAuthenticated ? (
                    <TradingInterface
                      marketId={market.id}
                      selectedOutcome={selectedOutcome}
                      outcomes={normalizedOutcomes}
                      onOutcomeChange={setSelectedOutcome}
                      orderType={orderType}
                      onOrderTypeChange={setOrderType}
                    />
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Sign in to place trades
                      </p>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => navigate("/signin")}
                      >
                        Sign In
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3">
                        Or <Link to="/signup" className="text-primary hover:underline">create an account</Link>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Market Details Tabs - Simplified */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details" className="text-xs sm:text-sm px-2 sm:px-4">Details</TabsTrigger>
                  <TabsTrigger value="rules" className="text-xs sm:text-sm px-2 sm:px-4">Rules</TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs sm:text-sm px-2 sm:px-4">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-3 sm:mt-4">
                  <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6">
                      <CardTitle className="text-sm sm:text-base">Market Details</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pt-0 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Market ID</p>
                          <p className="text-xs font-mono truncate bg-muted p-2 rounded">{market.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">End Date</p>
                          <p className="text-xs">{endDate ? new Date(endDate).toLocaleDateString() : "No end date"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Category</p>
                          <p className="text-xs capitalize">{safeToString(market.category) || "Uncategorized"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Volume</p>
                          <p className="text-xs font-semibold">{formatVolume(market.volume)}</p>
                        </div>
                      </div>
                      
                      {market.tags && Array.isArray(market.tags) && market.tags.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Tag className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs font-medium">Tags</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {market.tags.slice(0, 5).map((tag, index) => {
                                const tagText = safeToString(tag);
                                if (!tagText) return null;
                                return (
                                  <Badge key={index} variant="outline" className="text-[10px] px-2 py-0">
                                    {tagText}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="rules" className="mt-3 sm:mt-4">
                  <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6">
                      <CardTitle className="text-sm sm:text-base">Market Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pt-0">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium mb-1">Resolution Criteria</p>
                            <p className="text-xs text-muted-foreground">
                              This market resolves based on credible sources. Official announcements will determine the outcome.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium mb-1">Timing</p>
                            <p className="text-xs text-muted-foreground">
                              Resolution occurs shortly after the event outcome is confirmed. All trades are final.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="activity" className="mt-3 sm:mt-4">
                  <Card>
                    <CardHeader className="pb-3 px-3 sm:px-6">
                      <CardTitle className="text-sm sm:text-base">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-6 pt-0">
                      <div className="text-center py-6">
                        <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">No activity data available</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Orderbook & Stats (Hidden on small mobile, visible from sm) */}
            <div className="space-y-4 sm:space-y-6">
              {/* Orderbook - Hide on very small screens */}
              <div className="hidden xs:block">
                <Card>
                  <CardHeader className="pb-3 px-3 sm:px-6">
                    <CardTitle className="text-sm sm:text-base">Order Book</CardTitle>
                    <CardDescription className="text-xs">
                      Live orders for {selectedOutcome || "market"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pt-0">
                    <div className="h-48 sm:h-64">
                      <OrderbookDisplay 
                        marketId={market.id}
                        outcome={selectedOutcome}
                        compact={true}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Market Stats - Always visible but compact */}
              <Card>
                <CardHeader className="pb-3 px-3 sm:px-6">
                  <CardTitle className="text-sm sm:text-base">Market Stats</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pt-0">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Liquidity</p>
                        <p className="text-sm font-medium">{formatVolume("85000")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">24h Volume</p>
                        <p className="text-sm font-medium">{formatVolume("125000")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Open Interest</p>
                        <p className="text-sm font-medium">{formatVolume("245000")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Traders</p>
                        <p className="text-sm font-medium">642</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Yes Price</span>
                        <span className="text-sm sm:text-base font-bold text-green-600">
                          {formatPercentage(yesOutcome?.price || "0.5")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">No Price</span>
                        <span className="text-sm sm:text-base font-bold text-red-600">
                          {formatPercentage(noOutcome?.price || "0.5")}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Markets - Hidden on very small screens */}
              <div className="hidden sm:block">
                <Card>
                  <CardHeader className="pb-3 px-3 sm:px-6">
                    <CardTitle className="text-sm sm:text-base">Related Markets</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pt-0">
                    <div className="space-y-2">
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="p-2 border rounded hover:bg-accent cursor-pointer transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">Related Market {i + 1}</span>
                            <Badge variant="secondary" className="text-[10px]">45%</Badge>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>Category</span>
                            <span>3d left</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-3 text-xs" size="sm">
                      View All Related
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Mobile Trading Quick Actions - Fixed at bottom on mobile */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-3 z-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                  onClick={() => handleYesNoClick('yes')}
                >
                  <span className="text-sm font-bold">YES {formatPercentage(yesOutcome?.price || "0.5")}</span>
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 h-12"
                  onClick={() => handleYesNoClick('no')}
                >
                  <span className="text-sm font-bold">NO {formatPercentage(noOutcome?.price || "0.5")}</span>
                </Button>
              </div>
              {!isAuthenticated && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Sign in to trade
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add padding at bottom for mobile fixed buttons */}
      <div className="h-16 lg:h-0"></div>
    </div>
  );
};

export default MarketDetails;