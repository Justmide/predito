// pages/Markets.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import MarketGrid from "@/components/MarketGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, TrendingUp, Clock, Zap, Star, Globe, Trophy, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Markets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("Trending");
  const [subcategory, setSubcategory] = useState("All");

  const categories = [
    { id: "trending", name: "Trending", icon: TrendingUp, color: "text-orange-500" },
    { id: "politics", name: "Politics", icon: Globe, color: "text-blue-500" },
    { id: "crypto", name: "Crypto", icon: TrendingDown, color: "text-purple-500" },
    { id: "sports", name: "Sports", icon: Trophy, color: "text-green-500" },
    { id: "entertainment", name: "Entertainment", icon: Star, color: "text-pink-500" },
  ];

  const subcategories = ["All", "Live", "High Volume", "New"];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search logic here
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Predict. Trade. Win.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bet on world events with real money. Trade shares in outcomes across politics, crypto, sports, and more.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search markets (e.g., 'Bitcoin $100K', 'Election winner')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-xl border-2"
              />
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="text-center p-4 bg-card rounded-xl border">
              <div className="text-2xl font-bold">$42M+</div>
              <div className="text-sm text-muted-foreground">Total Volume</div>
            </div>
            <div className="text-center p-4 bg-card rounded-xl border">
              <div className="text-2xl font-bold">1.2K+</div>
              <div className="text-sm text-muted-foreground">Markets</div>
            </div>
            <div className="text-center p-4 bg-card rounded-xl border">
              <div className="text-2xl font-bold">85K+</div>
              <div className="text-sm text-muted-foreground">Traders</div>
            </div>
            <div className="text-center p-4 bg-card rounded-xl border">
              <div className="text-2xl font-bold">99.8%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Browse Markets</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={category === cat.name ? "default" : "outline"}
                  className="whitespace-nowrap"
                  onClick={() => setCategory(cat.name)}
                >
                  <Icon className={`w-4 h-4 mr-2 ${cat.color}`} />
                  {cat.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Subcategory Filter */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {subcategories.map((sub) => (
              <Badge
                key={sub}
                variant={subcategory === sub ? "default" : "secondary"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSubcategory(sub)}
              >
                {sub === "Live" && <Zap className="w-3 h-3 mr-1" />}
                {sub === "High Volume" && <TrendingUp className="w-3 h-3 mr-1" />}
                {sub === "New" && <Clock className="w-3 h-3 mr-1" />}
                {sub}
              </Badge>
            ))}
          </div>
        </div>

        {/* Market Grid */}
        <div className="mb-8">
          <MarketGrid 
            category={category}
            subcategory={subcategory}
            searchQuery={searchQuery}
          />
        </div>

        {/* Featured Markets Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Featured Markets</h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Featured market cards would go here */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border rounded-xl bg-card">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary">Featured</Badge>
                  <span className="text-xs text-muted-foreground">7d left</span>
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2">
                  Featured Market Title {i}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">65%</span>
                  <span className="text-sm text-muted-foreground">YES</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold text-center mb-8">How Prediction Markets Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Choose a Market</h3>
              <p className="text-muted-foreground">
                Browse markets on events you want to predict. Each market has YES and NO shares.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Buy Shares</h3>
              <p className="text-muted-foreground">
                Buy YES shares if you think it will happen, NO shares if you think it won't.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Get Paid</h3>
              <p className="text-muted-foreground">
                If you're right, each share pays $1. Sell anytime before resolution to lock in profits.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Markets;