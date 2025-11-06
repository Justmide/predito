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
  subcategory: string;
}

const fetchMarkets = async (): Promise<Market[]> => {
  const response = await fetch("https://corsproxy.io/?url=" + encodeURIComponent("https://gamma-api.polymarket.com/markets?limit=100"));
  if (!response.ok) {
    throw new Error("Failed to fetch markets");
  }
  return response.json();
};

const MarketGrid = ({ category, subcategory }: MarketGridProps) => {
  const { data: markets, isLoading, error } = useQuery({
    queryKey: ["markets"],
    queryFn: fetchMarkets,
    staleTime: 60000, // Cache for 1 minute
  });

  const filterMarketsByCategory = (markets: Market[]) => {
    if (category === "Trending") {
      // Show top 20 markets with highest volume for trending
      return markets
        .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
        .slice(0, 20);
    }

    // If subcategory is selected, show dummy data for now
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
      .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume));
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

  // Show dummy data if subcategory is selected
  if (subcategory) {
    return <SubcategoryMarkets category={category} subcategory={subcategory} />;
  }

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

// Dummy data component for subcategories
const SubcategoryMarkets = ({ category, subcategory }: { category: string; subcategory: string }) => {
  const dummyMarkets = Array.from({ length: 12 }, (_, i) => ({
    id: `${category}-${subcategory}-${i}`,
    question: `Will ${subcategory} prediction #${i + 1} come true?`,
    yesPrice: Math.floor(Math.random() * 100),
    noPrice: Math.floor(Math.random() * 100),
    category,
    subcategory,
    date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
      {dummyMarkets.map((market) => (
        <div
          key={market.id}
          className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] flex flex-col h-full"
        >
          <div className="w-full h-32 bg-muted rounded-md mb-4 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Image Placeholder</span>
          </div>
          
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
              {market.category}
            </span>
            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
              {market.subcategory}
            </span>
          </div>
          
          <h3 className="font-semibold text-foreground mb-4 line-clamp-2 flex-grow">
            {market.question}
          </h3>
          
          <div className="flex gap-2 mb-3">
            <div className="flex-1 bg-green-50 dark:bg-green-950 rounded p-2">
              <p className="text-xs text-muted-foreground mb-1">YES</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{market.yesPrice}%</p>
            </div>
            <div className="flex-1 bg-red-50 dark:bg-red-950 rounded p-2">
              <p className="text-xs text-muted-foreground mb-1">NO</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{market.noPrice}%</p>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">Ends: {market.date}</p>
        </div>
      ))}
    </div>
  );
};

export default MarketGrid;
