import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryNav from "@/components/CategoryNav";
import MarketGrid from "@/components/MarketGrid";
import { getSubcategories } from "@/config/categoryConfig";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [activeSubcategory, setActiveSubcategory] = useState("");

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    // Set subcategory to the first available subcategory, or empty string if none
    const subs = getSubcategories(category);
    setActiveSubcategory(subs.length > 0 ? subs[0] : "");
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setActiveSubcategory(subcategory);
  };

  // Build display title
  const getDisplayTitle = () => {
    if (activeCategory === "Trending") return "Trending Markets";
    if (activeSubcategory) {
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

