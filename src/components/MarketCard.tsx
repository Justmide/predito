import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Outcome {
  price: string;
  name: string;
}

interface Market {
  question: string;
  outcomes: Outcome[];
  volume: string;
  end_date_iso: string;
  tags?: string[];
}

interface MarketCardProps {
  market: Market;
}

const MarketCard = ({ market }: MarketCardProps) => {
  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatPrice = (price: string) => {
    return `${(parseFloat(price) * 100).toFixed(1)}%`;
  };

  const getTimeRemaining = (endDate: string) => {
    try {
      return formatDistanceToNow(new Date(endDate), { addSuffix: true });
    } catch {
      return "Date unavailable";
    }
  };

  // Check if there's a price change to show trend
  const hasTrend = Math.random() > 0.5; // Placeholder since API doesn't provide this
  const isPositive = Math.random() > 0.5;

  // Ensure outcomes is an array
  const outcomesArray: Outcome[] = Array.isArray(market.outcomes) 
    ? market.outcomes 
    : Object.values(market.outcomes || {}) as Outcome[];

  return (
    <Card className="p-5 hover:shadow-card-hover transition-all duration-300 cursor-pointer group bg-card border-border">
      <div className="space-y-4">
        {/* Tags */}
        {market.tags && market.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {market.tags.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Question */}
        <h3 className="text-base font-semibold text-card-foreground line-clamp-3 group-hover:text-primary transition-colors">
          {market.question}
        </h3>

        {/* Outcomes */}
        <div className="space-y-2">
          {outcomesArray.slice(0, 2).map((outcome, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{outcome.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(outcome.price)}
                </span>
                {hasTrend && index === 0 && (
                  isPositive ? (
                    <TrendingUp className="w-4 h-4 text-success" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-destructive" />
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{getTimeRemaining(market.end_date_iso)}</span>
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Vol: {formatVolume(market.volume)}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MarketCard;
