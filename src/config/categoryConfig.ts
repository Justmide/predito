// Category and subcategory configuration for market filtering
// Each category maps to keywords that match against market.question, market.description, market.category, and market.tags

export interface CategoryConfig {
  name: string;
  keywords: string[];
  subcategories: SubcategoryConfig[];
}

export interface SubcategoryConfig {
  name: string;
  keywords: string[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    name: "Trending",
    keywords: [], // Trending shows top markets by volume, no keyword filtering
    subcategories: [],
  },
  {
    name: "Crypto",
    keywords: ["bitcoin", "btc", "ethereum", "eth", "crypto", "xrp", "solana", "sol", "altcoin", "defi", "nft", "coin", "token", "blockchain", "up or down", "updown", "chainlink", "doge", "dogecoin", "shiba", "pepe", "bonk", "meme coin"],
    subcategories: [
      { name: "Bitcoin", keywords: ["bitcoin", "btc"] },
      { name: "Ethereum", keywords: ["ethereum", "eth"] },
      { name: "Solana", keywords: ["solana", "sol"] },
      { name: "XRP", keywords: ["xrp", "ripple"] },
      { name: "Altcoins", keywords: ["cardano", "ada", "polkadot", "dot", "avalanche", "avax", "matic", "polygon", "litecoin", "ltc"] },
      { name: "DeFi", keywords: ["defi", "decentralized finance", "yield", "liquidity", "lending", "aave", "uniswap", "compound"] },
      { name: "NFTs", keywords: ["nft", "non-fungible", "bored ape", "opensea", "art"] },
      { name: "Meme Coins", keywords: ["meme", "doge", "dogecoin", "shiba", "pepe", "bonk", "floki"] },
    ],
  },
  {
    name: "Sports",
    keywords: ["sport", "football", "soccer", "basketball", "nba", "nfl", "tennis", "baseball", "cricket", "formula 1", "f1", "boxing", "ufc", "mma", "golf", "premier league", "champions league", "world cup", "olympics", "athletics", "racing"],
    subcategories: [
      { name: "Football", keywords: ["football", "soccer", "premier league", "champions league", "la liga", "serie a", "bundesliga", "world cup", "epl"] },
      { name: "Basketball", keywords: ["basketball", "nba", "wnba", "ncaa basketball", "euroleague"] },
      { name: "American Football", keywords: ["nfl", "super bowl", "college football", "american football"] },
      { name: "Tennis", keywords: ["tennis", "wimbledon", "us open", "french open", "australian open", "atp", "wta"] },
      { name: "Formula 1", keywords: ["formula 1", "f1", "grand prix", "racing", "verstappen", "hamilton"] },
      { name: "UFC/MMA", keywords: ["ufc", "mma", "boxing", "fight", "heavyweight", "bellator"] },
      { name: "Cricket", keywords: ["cricket", "ipl", "test match", "odi", "t20"] },
      { name: "Golf", keywords: ["golf", "pga", "masters", "ryder cup", "lpga"] },
    ],
  },
  {
    name: "Politics",
    keywords: ["election", "president", "government", "congress", "senate", "vote", "policy", "political", "democrat", "republican", "prime minister", "parliament", "trump", "biden", "governor", "mayor", "legislation", "bill", "referendum"],
    subcategories: [],
  },
  {
    name: "World Events",
    keywords: ["war", "conflict", "climate", "disaster", "pandemic", "global", "international", "crisis", "earthquake", "hurricane", "space", "nasa", "spacex", "mars", "moon"],
    subcategories: [
      { name: "Climate", keywords: ["climate", "global warming", "carbon", "emissions", "temperature", "weather", "hurricane", "flood"] },
      { name: "Conflicts", keywords: ["war", "conflict", "military", "invasion", "troops", "russia", "ukraine", "israel", "gaza", "middle east"] },
      { name: "Natural Disasters", keywords: ["disaster", "earthquake", "hurricane", "flood", "tsunami", "wildfire", "tornado"] },
      { name: "Space", keywords: ["space", "nasa", "spacex", "mars", "moon", "rocket", "astronaut", "starship", "satellite", "artemis"] },
      { name: "Health", keywords: ["pandemic", "covid", "virus", "vaccine", "outbreak", "disease", "who", "health crisis"] },
    ],
  },
  {
    name: "Tech",
    keywords: ["tech", "technology", "ai", "artificial intelligence", "crypto", "blockchain", "software", "hardware", "startup", "innovation", "app", "mobile", "web", "cloud", "data", "cybersecurity", "silicon valley", "apple", "google", "microsoft", "amazon", "meta", "tesla", "nvidia"],
    subcategories: [
      { name: "AI & Machine Learning", keywords: ["ai", "artificial intelligence", "machine learning", "deep learning", "gpt", "chatgpt", "openai", "neural network", "algorithm"] },
      { name: "Crypto & Blockchain", keywords: ["crypto", "cryptocurrency", "blockchain", "bitcoin", "ethereum", "defi", "nft", "token", "web3", "metaverse"] },
      { name: "Big Tech Companies", keywords: ["apple", "google", "microsoft", "amazon", "meta", "tesla", "nvidia", "oracle", "ibm", "adobe"] },
      { name: "Startups & Innovation", keywords: ["startup", "unicorn", "venture", "vc", "funding", "ipo", "innovation", "disrupt"] },
      { name: "Software & Apps", keywords: ["software", "app", "saas", "mobile app", "web app", "programming", "developer", "code"] },
    ],
  },
  {
    name: "Business",
    keywords: ["stock", "market", "trade", "economy", "gdp", "inflation", "company", "tech", "startup", "real estate", "commodity", "oil", "gold", "s&p", "nasdaq", "dow", "earnings", "ipo", "merger"],
    subcategories: [
      { name: "Stock Market", keywords: ["stock", "s&p", "dow", "nasdaq", "index", "share price", "bull", "bear", "rally"] },
      { name: "Tech Companies", keywords: ["apple", "google", "microsoft", "amazon", "meta", "tesla", "nvidia", "ai", "artificial intelligence"] },
      { name: "Economy", keywords: ["gdp", "inflation", "recession", "interest rate", "fed", "federal reserve", "unemployment", "jobs"] },
      { name: "Commodities", keywords: ["gold", "oil", "commodity", "crude", "silver", "copper", "natural gas"] },
      { name: "Real Estate", keywords: ["real estate", "housing", "property", "mortgage", "rent", "home prices"] },
    ],
  },
];

// Get category names for tabs
export const getCategoryNames = (): string[] => {
  return CATEGORIES.map(cat => cat.name);
};

// Get subcategories for a category
export const getSubcategories = (categoryName: string): string[] => {
  const category = CATEGORIES.find(cat => cat.name === categoryName);
  if (!category || category.subcategories.length === 0) return [];
  return category.subcategories.map(sub => sub.name);
};

// Get category config by name
export const getCategoryConfig = (categoryName: string): CategoryConfig | undefined => {
  return CATEGORIES.find(cat => cat.name === categoryName);
};

// Get subcategory config
export const getSubcategoryConfig = (categoryName: string, subcategoryName: string): SubcategoryConfig | undefined => {
  const category = getCategoryConfig(categoryName);
  if (!category) return undefined;
  return category.subcategories.find(sub => sub.name === subcategoryName);
};
