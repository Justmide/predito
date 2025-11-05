import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryNav from "@/components/CategoryNav";
import MarketGrid from "@/components/MarketGrid";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Trending");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <CategoryNav 
        activeCategory={activeCategory} 
        onCategoryChange={setActiveCategory}
      />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 text-foreground">
          {activeCategory} Markets
        </h2>
        <MarketGrid category={activeCategory} />
      </main>
    </div>
  );
};

export default Index;
