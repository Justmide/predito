import { useMemo } from "react";
import { Market } from "@/services/marketService";
import { getCategoryConfig, getSubcategoryConfig } from "@/config/categoryConfig";

interface UseMarketFilteringProps {
  markets: Market[];
  category: string;
  subcategory: string;
  searchQuery?: string;
}

// Crypto-specific keywords - if a market matches these, it's a CRYPTO market
const CRYPTO_IDENTIFIERS = [
  "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "xrp", "ripple",
  "crypto", "chainlink", "doge", "dogecoin", "altcoin", "defi", "nft",
  "up or down", "updown", "coin", "token", "blockchain"
];

// Check if market is crypto-related
const isCryptoMarket = (market: Market): boolean => {
  const question = (market.question || "").toLowerCase();
  const description = (market.description || "").toLowerCase();
  const slug = (market.id || "").toLowerCase();
  const searchText = `${question} ${description} ${slug}`;
  
  return CRYPTO_IDENTIFIERS.some(keyword => searchText.includes(keyword));
};

// Check if market matches any of the given keywords
const matchesKeywords = (market: Market, keywords: string[]): boolean => {
  if (keywords.length === 0) return true;
  
  const question = (market.question || "").toLowerCase();
  const description = (market.description || "").toLowerCase();
  const category = (market.category || "").toLowerCase();
  const tags = (market.tags || []).map(t => String(t).toLowerCase()).join(" ");
  
  const searchText = `${question} ${description} ${category} ${tags}`;
  
  return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
};

// Check if market is "live" (ends within 7 days)
const isLiveMarket = (market: Market): boolean => {
  const endDate = new Date(market.endDateIso || market.end_date_iso || "");
  const now = new Date();
  const daysUntilEnd = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilEnd > 0 && daysUntilEnd <= 7;
};

// Sort markets by volume (highest first)
const sortByVolume = (markets: Market[]): Market[] => {
  return [...markets].sort((a, b) => {
    const volA = parseFloat(a.volume || "0");
    const volB = parseFloat(b.volume || "0");
    return volB - volA;
  });
};

export const useMarketFiltering = ({
  markets,
  category,
  subcategory,
  searchQuery = "",
}: UseMarketFilteringProps): Market[] => {
  return useMemo(() => {
    if (!Array.isArray(markets) || markets.length === 0) {
      return [];
    }

    let filtered = [...markets];
    console.log(`🔍 useMarketFiltering: start with ${filtered.length} markets, category=${category}, subcategory=${subcategory}`);

    // Step 1: Apply search query filter first (if present)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(market => {
        const question = (market.question || "").toLowerCase();
        const description = (market.description || "").toLowerCase();
        return question.includes(query) || description.includes(query);
      });
      console.log(`🔍 After search filter: ${filtered.length} markets`);
    }

    // Step 2: Apply category filter
    if (category === "Trending") {
      // Trending shows top markets by volume, no category filtering
      return sortByVolume(filtered).slice(0, 20);
    }

    // NOTE: When a specific category is passed to the backend (via getMarkets()),
    // the backend already filters by category. We should NOT apply additional
    // keyword filtering here, as it may exclude valid markets that the backend
    // already categorized correctly.
    // Only apply keyword filtering if we're not using the backend category parameter
    // (e.g., when showing local filtered results without backend category filtering)

    // STRICT FILTERING: Only exclude crypto markets from specific non-crypto categories
    // Don't exclude from Politics, World Events, Tech, or Business since they legitimately discuss crypto
    const excludeCryptoFrom = ["Sports"];
    if (excludeCryptoFrom.includes(category)) {
      const beforeCryptoFilter = filtered.length;
      filtered = filtered.filter(market => !isCryptoMarket(market));
      console.log(`🔍 After crypto filter: ${beforeCryptoFilter} -> ${filtered.length} markets (removed ${beforeCryptoFilter - filtered.length})`);
    }

    // Step 3: Apply subcategory filter (only if category has subcategories)
    const categoryConfig = getCategoryConfig(category);
    if (categoryConfig && categoryConfig.subcategories.length > 0) {
      if (subcategory && subcategory !== "All") {
        const subcategoryConfig = getSubcategoryConfig(category, subcategory);
        if (subcategoryConfig && subcategoryConfig.keywords.length > 0) {
          filtered = filtered.filter(market => matchesKeywords(market, subcategoryConfig.keywords));
          console.log(`🔍 After subcategory filter: ${filtered.length} markets`);
        }
      }
    }

    // Step 4: Sort by volume and return
    const result = sortByVolume(filtered);
    console.log(`🔍 useMarketFiltering: returning ${result.length} markets`);
    return result;
  }, [markets, category, subcategory, searchQuery]);
};

// Separate hook for getting live markets within a category
export const useLiveMarkets = (markets: Market[], category: string): Market[] => {
  return useMemo(() => {
    if (!Array.isArray(markets) || markets.length === 0) {
      return [];
    }

    const categoryConfig = getCategoryConfig(category);
    
    let filtered = markets.filter(isLiveMarket);
    
    // If we have a specific category (not Trending), filter by category keywords
    if (categoryConfig && categoryConfig.keywords.length > 0) {
      filtered = filtered.filter(market => matchesKeywords(market, categoryConfig.keywords));
    }

    return sortByVolume(filtered);
  }, [markets, category]);
};
