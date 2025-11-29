import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tradingService, Trade } from "@/services/tradingService";
import { TrendingUp, TrendingDown, Search, Download } from "lucide-react";
import { toast } from "sonner";

const TradeHistory = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSide, setFilterSide] = useState<string>("all");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    const fetchTrades = async () => {
      try {
        setLoading(true);
        const data = await tradingService.getTrades(token!);
        setTrades(data);
      } catch (error) {
        toast.error("Failed to load trade history");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [token, isAuthenticated, navigate]);

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch = 
      trade.marketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.outcome.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterSide === "all" || trade.side === filterSide;
    
    return matchesSearch && matchesFilter;
  });

  const exportTrades = () => {
    const csv = [
      ["Date", "Market ID", "Outcome", "Side", "Size", "Price", "Total"].join(","),
      ...filteredTrades.map(trade => [
        new Date(trade.timestamp).toLocaleString(),
        trade.marketId,
        trade.outcome,
        trade.side,
        trade.size,
        trade.price,
        (parseFloat(trade.size) * parseFloat(trade.price)).toFixed(2)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Trade history exported");
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Trade History</h1>
            <p className="text-muted-foreground mt-2">
              View all your past trades and transactions
            </p>
          </div>
          
          {trades.length > 0 && (
            <Button onClick={exportTrades} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by market ID or outcome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={filterSide} onValueChange={setFilterSide}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  <SelectItem value="buy">Buy Only</SelectItem>
                  <SelectItem value="sell">Sell Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Trade List */}
        {filteredTrades.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                {trades.length === 0 
                  ? "You haven't made any trades yet" 
                  : "No trades match your filters"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTrades.map((trade) => {
              const total = (parseFloat(trade.size) * parseFloat(trade.price)).toFixed(2);
              const isBuy = trade.side === "buy";
              
              return (
                <Card key={trade.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge 
                            variant={isBuy ? "default" : "destructive"}
                            className="gap-1"
                          >
                            {isBuy ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {trade.side.toUpperCase()}
                          </Badge>
                          <span className="font-semibold text-foreground">
                            {trade.outcome}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1">
                          Market: <span className="font-mono">{trade.marketId}</span>
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {new Date(trade.timestamp).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-8">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Size</p>
                          <p className="font-semibold">{trade.size}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Price</p>
                          <p className="font-semibold">${parseFloat(trade.price).toFixed(2)}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total</p>
                          <p className="font-bold text-primary">${total}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {trades.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
              <CardDescription>Overall trading activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
                  <p className="text-2xl font-bold text-foreground">{trades.length}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Buy Trades</p>
                  <p className="text-2xl font-bold text-green-600">
                    {trades.filter(t => t.side === "buy").length}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Sell Trades</p>
                  <p className="text-2xl font-bold text-red-600">
                    {trades.filter(t => t.side === "sell").length}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
                  <p className="text-2xl font-bold text-primary">
                    ${trades.reduce((sum, t) => 
                      sum + (parseFloat(t.size) * parseFloat(t.price)), 0
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TradeHistory;
