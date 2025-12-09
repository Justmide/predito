import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import MarketCard from "@/components/MarketCard";
import { marketService, Market } from "@/services/marketService";
import { ArrowLeft, DollarSign, Clock, TrendingUp, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const CategoryMarkets = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'volume' | 'time'>('volume');

  useEffect(() => {
    const fetchCategoryMarkets = async () => {
      if (!categoryName) return;

      try {
        setLoading(true);
        // Rely on backend to filter by category.
        // E.g., "Crypto" -> "crypto", "Sports" -> "sports"
        const categoryParam = categoryName.toLowerCase();
        console.log(`🔍 Fetching markets for category: ${categoryParam}`);
        const fetchedMarkets = await marketService.getMarkets(undefined, false, categoryParam) as Market[];
        setMarkets(fetchedMarkets || []);
      } catch (error) {
        console.error("Failed to fetch category markets:", error);
        setMarkets([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryMarkets();
  }, [categoryName]);

  const sortedMarkets = useMemo(() => {
    const marketsToSort = [...markets];
    if (sortBy === 'volume') {
      return marketsToSort.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));
    }
    // sortBy === 'time'
    return marketsToSort.sort((a, b) => {
      const endA = new Date(a.endDateIso || a.end_date_iso || 0).getTime();
      const endB = new Date(b.endDateIso || b.end_date_iso || 0).getTime();
      return endA - endB;
    });
  }, [markets, sortBy]);

  const formatMarketQuestion = (market: Market): string => {
    let question = market.question;
    if (question.includes('___')) {
      if (market.threshold) {
        return question.replace('___', market.threshold);
      }
    }
    return question;
  };

  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const totalVolume = useMemo(() => markets.reduce((sum, market) => 
    sum + parseFloat(market.volume || "0"), 0
  ), [markets]);

  const activeMarkets = useMemo(() => markets.filter(m => {
    const endDate = m.endDateIso || m.end_date_iso;
    return endDate ? new Date(endDate) > new Date() : true;
  }).length, [markets]);

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[180px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link 
          to="/markets" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markets
        </Link>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 capitalize">
                {categoryName} Markets
              </h1>
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading..." : `${sortedMarkets.length} prediction markets`}
              </p>
            </div>
            
            {/* Sort Options */}
            <div className="flex gap-2">
              <Badge
                variant={sortBy === 'volume' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSortBy('volume')}
              >
                <BarChart3 className="w-3 h-3 mr-1" />
                Volume
              </Badge>
              <Badge
                variant={sortBy === 'time' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSortBy('time')}
              >
                <Clock className="w-3 h-3 mr-1" />
                Time
              </Badge>
            </div>
          </div>
          
          {/* Category Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-bold">{formatVolume(totalVolume.toString())}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Markets</p>
                  <p className="text-2xl font-bold">{sortedMarkets.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Markets</p>
                  <p className="text-2xl font-bold">{activeMarkets}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Markets Grid */}
        {loading ? (
          renderSkeletons()
        ) : sortedMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedMarkets.map((market) => (
              <MarketCard 
                key={market.id} 
                market={{...market, question: formatMarketQuestion(market)}} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No markets found in this category
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoryMarkets;