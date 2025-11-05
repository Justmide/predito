import { cn } from "@/lib/utils";

const categories = [
  "Trending",
  "Sports",
  "Politics", 
  "Crypto",
  "World",
  "Science",
  "Finance",
];

interface CategoryNavProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryNav = ({ activeCategory, onCategoryChange }: CategoryNavProps) => {
  return (
    <div className="border-b border-border bg-background sticky top-[73px] z-40">
      <div className="max-w-7xl mx-auto px-6">
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
      </div>
    </div>
  );
};

export default CategoryNav;
