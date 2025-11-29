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

    // Category keyword mapping for filtering since API doesn't have tags
    const categoryKeywords: Record<string, string[]> = {
      "Crypto": ["bitcoin", "btc", "ethereum", "eth", "crypto", "xrp", "solana", "sol", "altcoin", "defi", "nft", "coin", "token", "blockchain"],
      "Sports": ["sport", "football", "soccer", "basketball", "nba", "nfl", "tennis", "baseball", "cricket", "formula 1", "f1", "boxing", "ufc", "golf", "premier league", "champions league"],
      "Politics": ["election", "president", "government", "congress", "senate", "vote", "policy", "political", "democrat", "republican", "prime minister", "parliament"],
      "World Events": ["war", "conflict", "climate", "disaster", "pandemic", "global", "international", "world", "crisis"],
      "Entertainment": ["movie", "film", "music", "celebrity", "award", "oscar", "grammy", "show", "series", "netflix", "streaming", "actor", "actress"],
      "Business & Finance": ["stock", "market", "trade", "economy", "gdp", "inflation", "company", "tech", "startup", "real estate", "commodity"]
    };

    // Subcategory keyword mapping
    const subcategoryKeywords: Record<string, string[]> = {
      // Sports subcategories
      "Premier League": ["premier league", "epl", "manchester", "liverpool", "chelsea", "arsenal", "tottenham"],
      "Champions League": ["champions league", "ucl", "uefa"],
      "La Liga": ["la liga", "barcelona", "real madrid", "atletico"],
      "NBA": ["nba", "basketball", "lakers", "warriors", "celtics", "lebron", "curry"],
      "NFL": ["nfl", "football", "super bowl", "patriots", "cowboys", "chiefs"],
      "Tennis": ["tennis", "wimbledon", "us open", "french open", "australian open", "federer", "nadal", "djokovic"],
      "Formula 1": ["formula 1", "f1", "grand prix", "verstappen", "hamilton", "racing"],
      "Boxing": ["boxing", "fight", "heavyweight", "ufc", "mma"],
      "Cricket": ["cricket", "ipl", "test", "odi", "world cup"],
      "Golf": ["golf", "pga", "masters", "tiger woods"],
      
      // Politics subcategories
      "US Presidential Election": ["us election", "presidential", "biden", "trump", "white house"],
      "UK Politics": ["uk", "britain", "british", "boris", "sunak", "labour", "conservative", "parliament"],
      "Global Politics": ["global", "international", "summit", "g7", "g20", "un", "nato"],
      "State Elections": ["state", "governor", "senate race", "house race"],
      "Policy Decisions": ["policy", "bill", "legislation", "law", "regulation"],
      "Approval Ratings": ["approval", "rating", "poll"],
      
      // Crypto subcategories
      "Bitcoin": ["bitcoin", "btc"],
      "Ethereum": ["ethereum", "eth", "vitalik"],
      "Altcoins": ["altcoin", "xrp", "cardano", "ada", "solana", "sol", "polkadot", "dot"],
      "DeFi": ["defi", "decentralized finance", "yield", "liquidity", "lending"],
      "NFTs": ["nft", "non-fungible", "bored ape", "opensea"],
      "Meme Coins": ["meme", "doge", "shiba", "pepe"],
      "Market Trends": ["bull", "bear", "crash", "pump", "rally", "correction"],
      
      // World Events subcategories
      "Climate Change": ["climate", "global warming", "carbon", "emissions", "temperature"],
      "Conflicts & Wars": ["war", "conflict", "military", "invasion", "troops"],
      "Natural Disasters": ["disaster", "earthquake", "hurricane", "flood", "tsunami", "wildfire"],
      "Space Exploration": ["space", "nasa", "spacex", "mars", "moon", "rocket", "astronaut"],
      "Health Pandemics": ["pandemic", "covid", "virus", "vaccine", "outbreak", "disease"],
      
      // Entertainment subcategories
      "Movies": ["movie", "film", "box office", "oscar", "academy award"],
      "Music Awards": ["grammy", "music award", "billboard", "album"],
      "Celebrity News": ["celebrity", "star", "actor", "actress", "scandal"],
      "TV Shows": ["tv", "series", "netflix", "hbo", "streaming", "season"],
      "Gaming": ["game", "gaming", "esports", "playstation", "xbox", "nintendo"],
      
      // Business & Finance subcategories
      "Stock Market": ["stock", "s&p", "dow", "nasdaq", "index", "share price"],
      "Tech Companies": ["apple", "google", "microsoft", "amazon", "meta", "tesla", "nvidia"],
      "Startups": ["startup", "ipo", "funding", "venture capital", "unicorn"],
      "Commodities": ["gold", "oil", "commodity", "crude", "silver"],
      "Real Estate": ["real estate", "housing", "property", "mortgage"]
    };

    // Get keywords for current category
    const categoryKeys = categoryKeywords[category] || [];

    // Handle "Live" subcategory
    if (subcategory === "Live") {
      return markets
        .filter((market) => {
          const question = market.question.toLowerCase();
          const hasKeyword = categoryKeys.some(keyword => question.includes(keyword));
          
          // Check if market ends within 7 days (consider it "live")
          const endDate = new Date(market.endDateIso || market.end_date_iso || "");
          const now = new Date();
          const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return hasKeyword && daysUntilEnd > 0 && daysUntilEnd <= 7;
        })
        .sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"))
        .slice(0, 20);
    }

    // Handle specific subcategory selection
    if (subcategory) {
      const subcatKeys = subcategoryKeywords[subcategory] || [];
      
      if (subcatKeys.length > 0) {
        const filtered = markets.filter((market) => {
          const question = market.question.toLowerCase();
          // Must match both category AND subcategory keywords
          const matchesCategory = categoryKeys.some(keyword => question.includes(keyword));
          const matchesSubcategory = subcatKeys.some(keyword => question.includes(keyword));
          return matchesCategory && matchesSubcategory;
        });
        
        return filtered.sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"));
      }
      
      return [];
    }

    // Filter by category keywords only (no subcategory selected)
    if (categoryKeys.length > 0) {
      const filtered = markets.filter((market) => {
        const question = market.question.toLowerCase();
        return categoryKeys.some(keyword => question.includes(keyword));
      });
      
      // If filtered results exist, return them sorted by volume
      if (filtered.length > 0) {
        return filtered.sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"));
      }
    }

    // If no keywords match or no keywords defined, show all markets
    return markets
      .sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"))
      .slice(0, 20);
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
        <p className="text-muted-foreground text-lg">
          {subcategory 
            ? `No markets found for ${subcategory} in ${category}.` 
            : `No markets found in ${category}.`
          }
        </p>
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

export default MarketGrid;
