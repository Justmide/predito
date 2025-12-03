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
  const { data: markets, isLoading, error } = useQuery({
    queryKey: ["markets"],
    queryFn: () => marketService.getMarkets(100),
    staleTime: 60000,
  });

  const filteredMarkets = useMarketFiltering({
    markets: markets || [],
    category,
    subcategory,
    searchQuery,
  });

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
            ? `No markets found for "${searchQuery}" in ${subcategory && subcategory !== "All" ? subcategory : category}.`
            : subcategory && subcategory !== "All"
              ? `No ${subcategory} markets found in ${category}.` 
              : `No markets found in ${category}.`
          }
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Try selecting a different category or subcategory.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {filteredMarkets.map((market, index) => (
        <MarketCard key={market.id || index} market={market} />
      ))}
    </div>
  );
};

export default MarketGrid;
