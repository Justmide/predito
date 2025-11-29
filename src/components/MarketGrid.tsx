import { useQuery } from "@tanstack/react-query";
import MarketCard from "./MarketCard";
import { Loader2 } from "lucide-react";
import { marketService, Market } from "@/services/marketService";

interface MarketGridProps {
  category: string;
  subcategory: string;
}

const MarketGrid = ({ category, subcategory }: MarketGridProps) => {
  const { data: markets, isLoading, error } = useQuery({
    queryKey: ["markets"],
    queryFn: () => marketService.getMarkets(100),
    staleTime: 60000, // Cache for 1 minute
  });

  const filterMarketsByCategory = (markets: Market[]) => {
    // Ensure markets is always an array
    if (!Array.isArray(markets)) {
      console.error('Markets is not an array:', markets);
      return [];
    }

    if (category === "Trending") {
      // Show top 20 markets with highest volume for trending
      return markets
        .sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"))
        .slice(0, 20);
    }

    // Handle "Live" subcategory specially
    if (subcategory === "Live") {
      const categoryLower = category.toLowerCase();
      // Filter by category and show active markets (ending soon)
      return markets
        .filter((market) => {
          if (!market.tags || market.tags.length === 0) return false;
          const hasCategory = market.tags.some(tag => 
            tag.toLowerCase().includes(categoryLower)
          );
          // Check if market ends within 7 days (consider it "live")
          const endDate = new Date(market.end_date_iso);
          const now = new Date();
          const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return hasCategory && daysUntilEnd > 0 && daysUntilEnd <= 7;
        })
        .sort((a, b) => {
          // Sort by volume (most active first)
          return parseFloat(b.volume || "0") - parseFloat(a.volume || "0");
        })
        .slice(0, 20);
    }

    // If subcategory is selected (not Live), show dummy data for now
    if (subcategory) {
      return [];
    }

    // Filter by tags/category
    const categoryLower = category.toLowerCase();
    return markets
      .filter((market) => {
        if (!market.tags || market.tags.length === 0) return false;
        return market.tags.some(tag => 
          tag.toLowerCase().includes(categoryLower)
        );
      })
      .sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive text-lg">Failed to load markets. Please try again.</p>
      </div>
    );
  }

  const filteredMarkets = filterMarketsByCategory(markets || []);

  // Show dummy data if subcategory is selected (except for "Live")
  if (subcategory && subcategory !== "Live") {
    return <SubcategoryMarkets category={category} subcategory={subcategory} />;
  }

  // Handle "Live" with no results
  if (subcategory === "Live" && filteredMarkets.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950 rounded-full mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 dark:text-red-400 font-medium">LIVE</span>
        </div>
        <p className="text-muted-foreground text-lg">No live markets currently</p>
      </div>
    );
  }

  if (filteredMarkets.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">No markets found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {filteredMarkets.map((market, index) => (
        <MarketCard key={index} market={market} isLive={subcategory === "Live"} />
      ))}
    </div>
  );
};

// TODO: Connect to API here - Placeholder component for subcategory markets
const SubcategoryMarkets = ({ category, subcategory }: { category: string; subcategory: string }) => {
  // TODO: Replace this with actual API call to fetch markets filtered by category and subcategory
  // Example: const { data: markets } = useQuery(['markets', category, subcategory], () => fetchMarketsBySubcategory(category, subcategory));
  
  const markets: any[] = []; // TODO: Connect to API endpoint

  if (markets.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">No markets available in {subcategory}.</p>
        <p className="text-muted-foreground text-sm mt-2">Connect to API to load market data.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
};

export default MarketGrid;
