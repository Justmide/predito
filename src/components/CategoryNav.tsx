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
    <div className="border-b border-border bg-background sticky top-[73px] z-40 w-full">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Category Tabs - Horizontal Scroll */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-nowrap px-4 sm:px-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={cn(
                "px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative flex-shrink-0",
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
        
        {/* Subcategory Selection - Styled Dropdown */}
        {subcategories.length > 0 && (
          <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center gap-3">
            <label htmlFor="subcategory-select" className="text-xs font-semibold text-muted-foreground whitespace-nowrap uppercase tracking-wider">
              Subcategory:
            </label>
            <div className="relative w-full max-w-[250px]">
              <select
                id="subcategory-select"
                value={activeSubcategory}
                onChange={(e) => onSubcategoryChange(e.target.value)}
                className={cn(
                  "w-full appearance-none bg-background border border-border rounded-md px-3 py-1.5 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                  "cursor-pointer"
                )}
              >
                {subcategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory}
                  </option>
                ))}
              </select>
              {/* Custom Dropdown Arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryNav;