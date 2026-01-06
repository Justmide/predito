// components/PortfolioView.tsx
import { useEffect, useState } from 'react';
import { tradingService, Position, PnLSummary } from '@/services/tradingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export const PortfolioView = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [pnlSummary, setPnlSummary] = useState<PnLSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please sign in to view your portfolio');
        return;
      }

      // Fetch positions and PnL
      const [positionsData, pnlData] = await Promise.all([
        tradingService.getPositions(token),
        tradingService.getPnL(token).catch(() => null) // Fallback if PnL endpoint doesn't exist
      ]);

      setPositions(positionsData);
      
      // Use PnL data if available, otherwise calculate from positions
      if (pnlData) {
        setPnlSummary(pnlData);
      } else {
        setPnlSummary(tradingService.calculatePnLFromPositions(positionsData));
      }
      
    } catch (error: any) {
      console.error('Portfolio fetch error:', error);
      toast.error(error.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pnlSummary?.totalValue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${(pnlSummary?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(pnlSummary?.totalPnL || 0)}
              </span>
              {(pnlSummary?.totalPnL || 0) >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <p className={`text-sm ${(pnlSummary?.totalPnLPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(pnlSummary?.totalPnLPercentage || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No positions yet. Start trading to see your portfolio here!
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {position.marketQuestion || 'Market'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant={position.outcome.toLowerCase() === 'yes' ? 'default' : 'secondary'}>
                        {position.outcome}
                      </Badge>
                      <span>•</span>
                      <span>{position.quantity} shares @ {formatCurrency(position.avgPrice)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(position.value)}
                    </div>
                    <div className={`text-sm flex items-center justify-end gap-1 ${position.pnlAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(Math.abs(position.pnlAmount))}
                      <span>({formatPercentage(position.pnlPercentage)})</span>
                    </div>
                  </div>
                </div>
              ))}
          )}
        </CardContent>
      </Card>
    </div>
  );
};