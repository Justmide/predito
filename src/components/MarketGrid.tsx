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
    staleTime: 60000,
  });

  const filterMarketsByCategory = (markets: Market[]) => {
    if (!Array.isArray(markets)) {
      console.error('Markets is not an array:', markets);
      return [];
    }

    // Category keyword mapping
    const categoryKeywords: Record<string, string[]> = {
      "Crypto": ["bitcoin", "btc", "ethereum", "eth", "crypto", "xrp", "solana", "sol", "altcoin", "defi", "nft", "coin", "token", "blockchain", "up or down", "updown"],
      "Sports": ["sport", "football", "soccer", "basketball", "nba", "nfl", "tennis", "baseball", "cricket", "formula 1", "f1", "boxing", "ufc", "golf", "premier league", "champions league", "world cup"],
      "Politics": ["election", "president", "government", "congress", "senate", "vote", "policy", "political", "democrat", "republican", "prime minister", "parliament", "trump", "biden"],
      "World Events": ["war", "conflict", "climate", "disaster", "pandemic", "global", "international", "world", "crisis", "earthquake", "hurricane"],
      "Entertainment": ["movie", "film", "music", "celebrity", "award", "oscar", "grammy", "show", "series", "netflix", "streaming", "actor", "actress", "gaming", "game"],
      "Business & Finance": ["stock", "market", "trade", "economy", "gdp", "inflation", "company", "tech", "startup", "real estate", "commodity", "oil", "gold", "s&p", "nasdaq"]
    };

    // Subcategory keyword mapping
    const subcategoryKeywords: Record<string, string[]> = {
      // Sports
      "Premier League": ["premier league", "epl", "manchester", "liverpool", "chelsea", "arsenal", "tottenham"],
      "Champions League": ["champions league", "ucl", "uefa"],
      "La Liga": ["la liga", "barcelona", "real madrid", "atletico"],
      "NBA": ["nba", "basketball", "lakers", "warriors", "celtics", "lebron", "curry"],
      "NFL": ["nfl", "super bowl", "patriots", "cowboys", "chiefs"],
      "Tennis": ["tennis", "wimbledon", "us open", "french open", "australian open", "federer", "nadal", "djokovic"],
      "Formula 1": ["formula 1", "f1", "grand prix", "verstappen", "hamilton", "racing"],
      "Boxing": ["boxing", "fight", "heavyweight", "ufc", "mma"],
      "Cricket": ["cricket", "ipl", "test match", "odi", "world cup cricket"],
      "Golf": ["golf", "pga", "masters", "tiger woods"],
      
      // Politics
      "US Presidential Election": ["us election", "presidential", "biden", "trump", "white house", "2024 election"],
      "UK Politics": ["uk", "britain", "british", "sunak", "labour", "conservative", "parliament"],
      "Global Politics": ["global", "international", "summit", "g7", "g20", "un", "nato"],
      "State Elections": ["state election", "governor", "senate race", "house race"],
      "Policy Decisions": ["policy", "bill", "legislation", "law", "regulation"],
      "Approval Ratings": ["approval", "rating", "poll"],
      
      // Crypto - Enhanced to match the actual API data
      "Bitcoin": ["bitcoin", "btc"],
      "Ethereum": ["ethereum", "eth"],
      "Altcoins": ["xrp", "solana", "sol", "cardano", "ada", "polkadot", "dot", "avalanche", "avax", "matic", "polygon"],
      "DeFi": ["defi", "decentralized finance", "yield", "liquidity", "lending", "aave", "uniswap"],
      "NFTs": ["nft", "non-fungible", "bored ape", "opensea"],
      "Meme Coins": ["meme", "doge", "dogecoin", "shiba", "pepe", "bonk"],
      "Market Trends": ["bull", "bear", "crash", "pump", "rally", "correction", "up or down", "updown"],
      
      // World Events
      "Climate Change": ["climate", "global warming", "carbon", "emissions", "temperature"],
      "Conflicts & Wars": ["war", "conflict", "military", "invasion", "troops", "russia", "ukraine"],
      "Natural Disasters": ["disaster", "earthquake", "hurricane", "flood", "tsunami", "wildfire"],
      "Space Exploration": ["space", "nasa", "spacex", "mars", "moon", "rocket", "astronaut", "starship"],
      "Health Pandemics": ["pandemic", "covid", "virus", "vaccine", "outbreak", "disease"],
      
      // Entertainment
      "Movies": ["movie", "film", "box office", "oscar", "academy award"],
      "Music Awards": ["grammy", "music award", "billboard", "album"],
      "Celebrity News": ["celebrity", "star", "scandal"],
      "TV Shows": ["tv", "series", "netflix", "hbo", "streaming", "season"],
      "Gaming": ["game", "gaming", "esports", "playstation", "xbox", "nintendo"],
      
      // Business & Finance
      "Stock Market": ["stock", "s&p", "dow", "nasdaq", "index", "share price"],
      "Tech Companies": ["apple", "google", "microsoft", "amazon", "meta", "tesla", "nvidia"],
      "Startups": ["startup", "ipo", "funding", "venture capital", "unicorn"],
      "Commodities": ["gold", "oil", "commodity", "crude", "silver"],
      "Real Estate": ["real estate", "housing", "property", "mortgage"]
    };

    // Check if market is "live" (ends within 7 days)
    const isLiveMarket = (market: Market): boolean => {
      const endDate = new Date(market.endDateIso || market.end_date_iso || "");
      const now = new Date();
      const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilEnd > 0 && daysUntilEnd <= 7;
    };

    // Check if market matches keywords
    const matchesKeywords = (market: Market, keywords: string[]): boolean => {
      const question = market.question.toLowerCase();
      const description = (market.description || "").toLowerCase();
      return keywords.some(keyword => 
        question.includes(keyword) || description.includes(keyword)
      );
    };

    if (category === "Trending") {
      return markets
        .sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"))
        .slice(0, 20);
    }

    const categoryKeys = categoryKeywords[category] || [];

    // Handle "Live" subcategory - show live markets in the category
    if (subcategory === "Live") {
      const liveMarkets = markets.filter((market) => {
        const matchesCategory = matchesKeywords(market, categoryKeys);
        return matchesCategory && isLiveMarket(market);
      });
      
      // If no live markets in category, show all live markets as fallback
      if (liveMarkets.length === 0 && categoryKeys.length > 0) {
        return markets
          .filter(isLiveMarket)
          .sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"))
          .slice(0, 20);
      }
      
      return liveMarkets.sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"));
    }

    // Handle specific subcategory selection
    if (subcategory) {
      const subcatKeys = subcategoryKeywords[subcategory] || [];
      
      if (subcatKeys.length > 0) {
        // First try strict matching (both category and subcategory)
        let filtered = markets.filter((market) => {
          return matchesKeywords(market, categoryKeys) && matchesKeywords(market, subcatKeys);
        });
        
        // If no results, try subcategory only
        if (filtered.length === 0) {
          filtered = markets.filter((market) => matchesKeywords(market, subcatKeys));
        }
        
        return filtered.sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"));
      }
      
      return [];
    }

    // Filter by category keywords only (no subcategory selected)
    if (categoryKeys.length > 0) {
      const filtered = markets.filter((market) => matchesKeywords(market, categoryKeys));
      
      if (filtered.length > 0) {
        return filtered.sort((a, b) => parseFloat(b.volume || "0") - parseFloat(a.volume || "0"));
      }
    }

    // Fallback: show all markets
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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 font-medium">LIVE</span>
        </div>
        <p className="text-muted-foreground text-lg">No live {category.toLowerCase()} markets currently</p>
        <p className="text-muted-foreground text-sm mt-2">Check back soon for upcoming events</p>
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
        <p className="text-muted-foreground text-sm mt-2">
          The available markets are primarily crypto-focused at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {filteredMarkets.map((market, index) => (
        <MarketCard key={market.id || index} market={market} isLive={subcategory === "Live"} />
      ))}
    </div>
  );
};

export default MarketGrid;