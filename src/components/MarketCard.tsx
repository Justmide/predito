// components/MarketCard.tsx
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, TrendingUp } from "lucide-react";
import { Market } from "@/services/marketService";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MarketCardProps {
  market: Market;
}

const MarketCard = ({ market }: MarketCardProps) => {
  // Use slug for routing
  const marketId = market.slug || market.id;
  
  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (isNaN(num)) return "$0";
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const getTimeRemaining = (endDate?: string) => {
    if (!endDate) return "N/A";
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff < 0) return "Ended";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h`;

    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m`;
  };

  const outcomes = Array.isArray(market.outcomes) ? market.outcomes : [];

  // Safely extract tag names
  const renderTags = () => {
    if (!market.tags || !Array.isArray(market.tags) || market.tags.length === 0) {
      return null;
    }
    
    // Take only first tag and ensure it's a string
    const firstTag = market.tags[0];
    let tagText = '';
    
    if (typeof firstTag === 'string') {
      tagText = firstTag;
    } else if (typeof firstTag === 'object' && firstTag !== null) {
      const potentialText = firstTag.label || firstTag.name || firstTag.slug || '';
      tagText = typeof potentialText === 'string' ? potentialText : '';
    } else {
      tagText = String(firstTag);
    }
    
    if (!tagText) return null;
    
    return (
      <Badge variant="outline" className="w-fit mb-2 text-xs capitalize">
        {tagText}
      </Badge>
    );
  };

  // Find Yes/No outcomes
  const yesOutcome = outcomes.find(o => 
    o.name && o.name.toLowerCase().includes('yes')
  );
  const noOutcome = outcomes.find(o => 
    o.name && o.name.toLowerCase().includes('no')
  );

  const formatPercentage = (price: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return "0%";
    return `${(num * 100).toFixed(0)}%`;
  };

  return (
    <Link to={`/markets/${marketId}`} className="block">
      <Card className="group relative h-full rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer overflow-hidden">
        {/* Volume badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="text-xs font-medium">
            {formatVolume(market.volume)}
          </Badge>
        </div>

        <CardHeader className="p-4 pb-3">
          {renderTags()}
          <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {market.question || 'Untitled Market'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 pt-0 pb-3">
          {outcomes.length > 0 ? (
            <>
              {yesOutcome && noOutcome ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-green-600">YES</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">
                        {formatPercentage(yesOutcome.price)}
                      </span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${Math.min(parseFloat(yesOutcome.price) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-red-600">NO</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-red-600">
                        {formatPercentage(noOutcome.price)}
                      </span>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500"
                          style={{ width: `${Math.min(parseFloat(noOutcome.price) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {outcomes.slice(0, 2).map((outcome, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground truncate mr-2">
                        {outcome.name || `Option ${idx + 1}`}
                      </span>
                      <span className="font-bold text-primary whitespace-nowrap">
                        {formatPercentage(outcome.price)}
                      </span>
                    </div>
                  ))}
                  {outcomes.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      + {outcomes.length - 2} more
                    </p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-2 text-sm text-muted-foreground">
              No outcomes available
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-3 flex justify-between items-center text-xs text-muted-foreground border-t">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span className="font-medium">{getTimeRemaining(market.endDateIso)} left</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs">Trade</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default MarketCard;