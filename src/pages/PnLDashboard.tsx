import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tradingService } from "@/services/tradingService";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import { toast } from "sonner";

interface PnLData {
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalReturn: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  lossTrades: number;
}

const PnLDashboard = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    const fetchPnL = async () => {
      try {
        setLoading(true);
        const data = await tradingService.getPnL(token!);
        setPnlData(data);
      } catch (error) {
        toast.error("Failed to load P&L data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPnL();
  }, [token, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const isProfit = pnlData ? pnlData.totalPnL >= 0 : false;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Profit & Loss</h1>
          <p className="text-muted-foreground mt-2">
            Track your trading performance and returns
          </p>
        </div>

        {!pnlData ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No P&L data available yet. Start trading to see your performance!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Main P&L Card */}
            <Card className="mb-8 overflow-hidden">
              <div className={`p-6 ${isProfit ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Total Profit & Loss
                    </p>
                    <div className="flex items-baseline gap-2">
                      <h2 className={`text-5xl font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isProfit ? '+' : ''}${pnlData.totalPnL.toFixed(2)}
                      </h2>
                      <span className={`text-xl font-semibold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        ({isProfit ? '+' : ''}{pnlData.totalReturn.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-full ${isProfit ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                    {isProfit ? (
                      <TrendingUp className="w-12 h-12 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="w-12 h-12 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Realized P&L
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${pnlData.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {pnlData.realizedPnL >= 0 ? '+' : ''}${pnlData.realizedPnL.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From closed positions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    Unrealized P&L
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${pnlData.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {pnlData.unrealizedPnL >= 0 ? '+' : ''}${pnlData.unrealizedPnL.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    From open positions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {pnlData.winRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pnlData.profitableTrades} of {pnlData.totalTrades} trades
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Trades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-foreground">
                    {pnlData.totalTrades}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time activity
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Trade Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profitable Trades</CardTitle>
                  <CardDescription>Trades that resulted in profit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                        <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {pnlData.profitableTrades}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {((pnlData.profitableTrades / pnlData.totalTrades) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loss Trades</CardTitle>
                  <CardDescription>Trades that resulted in loss</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                        <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                          {pnlData.lossTrades}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {((pnlData.lossTrades / pnlData.totalTrades) * 100).toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Box */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Activity className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-2">Understanding P&L</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li><strong>Realized P&L:</strong> Profits or losses from positions you've closed</li>
                      <li><strong>Unrealized P&L:</strong> Current gains/losses on your open positions</li>
                      <li><strong>Total P&L:</strong> Combined realized and unrealized profit/loss</li>
                      <li><strong>Win Rate:</strong> Percentage of trades that resulted in profit</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default PnLDashboard;
