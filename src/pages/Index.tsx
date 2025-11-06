import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryNav from "@/components/CategoryNav";
import MarketGrid from "@/components/MarketGrid";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleCategoryChange = (category: string) => {
    setIsTransitioning(true);
    setActiveCategory(category);
    setActiveSubcategory("");
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setIsTransitioning(true);
    setActiveSubcategory(subcategory);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <CategoryNav 
        activeCategory={activeCategory}
        activeSubcategory={activeSubcategory}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
      />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 text-foreground">
          {activeSubcategory || activeCategory} Markets
        </h2>
        {isTransitioning ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <MarketGrid category={activeCategory} subcategory={activeSubcategory} />
        )}
      </main>
    </div>
  );
};

export default Index;
