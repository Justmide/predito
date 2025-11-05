import { useQuery } from "@tanstack/react-query";
import MarketCard from "./MarketCard";
import { Loader2 } from "lucide-react";

interface Market {
  question: string;
  outcomes: { price: string; name: string }[];
  volume: string;
  end_date_iso: string;
  tags?: string[];
}

interface MarketGridProps {
  category: string;
}

const fetchMarkets = async (): Promise<Market[]> => {
  const response = await fetch("https://corsproxy.io/?url=" + encodeURIComponent("https://gamma-api.polymarket.com/markets"));
  if (!response.ok) {
    throw new Error("Failed to fetch markets");
  }
  return response.json();
};

const MarketGrid = ({ category }: MarketGridProps) => {
  const { data: markets, isLoading, error } = useQuery({
    queryKey: ["markets"],
    queryFn: fetchMarkets,
    staleTime: 60000, // Cache for 1 minute
  });

  const filterMarketsByCategory = (markets: Market[]) => {
    if (category === "Trending") {
      // Show markets with highest volume for trending
      return markets
        .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
        .slice(0, 12);
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
      .slice(0, 12);
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

  if (filteredMarkets.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">No markets found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredMarkets.map((market, index) => (
        <MarketCard key={index} market={market} />
      ))}
    </div>
  );
};

export default MarketGrid;
