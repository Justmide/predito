import { cn } from "@/lib/utils";
import { getCategoryNames, getSubcategories } from "@/config/categoryConfig";

interface CategoryNavProps {
  activeCategory: string;
  activeSubcategory: string;
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (subcategory: string) => void;
}

const CategoryNav = ({ 
  activeCategory, 
  activeSubcategory, 
  onCategoryChange, 
  onSubcategoryChange 
}: CategoryNavProps) => {
  const categories = getCategoryNames();
  const subcategories = getSubcategories(activeCategory);
  
  return (
    <div className="border-b border-border bg-background sticky top-[73px] z-40">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Category Tabs */}
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={cn(
                "px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative",
                activeCategory === category
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {category}
              {activeCategory === category && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </nav>
        
        {/* Subcategory Tabs */}
        {subcategories.length > 0 && (
          <nav className="flex gap-2 px-2 py-3 overflow-x-auto scrollbar-hide border-t border-border/50">
            {subcategories.map((subcategory) => (
              <button
                key={subcategory}
                onClick={() => onSubcategoryChange(subcategory)}
                className={cn(
                  "px-4 py-2 text-xs font-medium whitespace-nowrap rounded-full transition-all",
                  activeSubcategory === subcategory
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {subcategory}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

export default CategoryNav;
