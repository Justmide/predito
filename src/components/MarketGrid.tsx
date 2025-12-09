// components/MarketGrid.tsx
import { useQuery } from "@tanstack/react-query";
import MarketCard from "./MarketCard";
import { Loader2 } from "lucide-react";
import { marketService, Market } from "@/services/marketService";
import { useMarketFiltering } from "@/hooks/useMarketFiltering";

interface MarketGridProps {
  category: string;
  subcategory: string;
  searchQuery?: string;
}

const MarketGrid = ({ category, subcategory, searchQuery = "" }: MarketGridProps) => {

  const { data: markets, isLoading, error } = useQuery<Market[]>({
    queryKey: ["markets", category],
    queryFn: () => {
      if (category === "Trending" || category === "All") {
        // Trending: fetch all markets without category filter
        return marketService.getMarkets(undefined, false) as Promise<Market[]>;
      }
      // For specific categories: send lowercase category name to backend
      // E.g., "Crypto" -> "crypto", "Sports" -> "sports", "Politics" -> "politics"
      const categoryParam = category.toLowerCase();
      console.log(`📡 Requesting markets for category: ${categoryParam}`);
      return marketService.getMarkets(undefined, false, categoryParam) as Promise<Market[]>;
    },
    staleTime: 30000,
  });

  console.log('📡 MarketGrid raw query data count:', markets?.length || 0);
  if (markets && markets.length > 0) {
    console.log('📡 First market from backend:', markets[0]);
  }
  const filteredMarkets = useMarketFiltering({
    markets: markets || [],
    category,
    subcategory,
    searchQuery,
  });
  console.log('📦 MarketGrid filteredMarkets count:', filteredMarkets.length);
  if (filteredMarkets.length > 0) {
    console.log('📦 First filtered market:', filteredMarkets[0]);
  }

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

  if (filteredMarkets.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">
          {searchQuery
            ? `No markets found for "${searchQuery}" in ${category}.`
            : `No markets found in ${category}.`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
      {filteredMarkets.map((market, index) => (
        <MarketCard key={market.id || index} market={market} />
      ))}
    </div>
  );
};

export default MarketGrid;