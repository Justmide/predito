import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryNav from "@/components/CategoryNav";
import MarketGrid from "@/components/MarketGrid";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [activeSubcategory, setActiveSubcategory] = useState("All");

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setActiveSubcategory("All"); // Reset to "All" when category changes
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setActiveSubcategory(subcategory);
  };

  // Build display title
  const getDisplayTitle = () => {
    if (activeCategory === "Trending") return "Trending Markets";
    if (activeSubcategory && activeSubcategory !== "All") {
      return `${activeSubcategory} Markets`;
    }
    return `${activeCategory} Markets`;
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
          {getDisplayTitle()}
        </h2>
        <MarketGrid 
          category={activeCategory} 
          subcategory={activeSubcategory}
        />
      </main>
    </div>
  );
};

export default Index;
