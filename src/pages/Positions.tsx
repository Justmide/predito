import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { tradingService, Position } from "@/services/tradingService";
import { toast } from "sonner";

const Positions = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    const fetchPositions = async () => {
      try {
        setLoading(true);
        const data = await tradingService.getPositions(token!);
        setPositions(data);
      } catch (error) {
        toast.error("Failed to load positions");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 text-foreground">My Positions</h1>

        {positions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                You don't have any open positions yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {positions.map((position, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Market ID: {position.marketId}</CardTitle>
                  <CardDescription>Outcome: {position.outcome}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Size</p>
                      <p className="text-xl font-semibold text-foreground">{position.size}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Avg Price</p>
                      <p className="text-xl font-semibold text-foreground">
                        ${parseFloat(position.avgPrice).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                      <p className="text-xl font-semibold text-foreground">
                        ${parseFloat(position.currentValue).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">P&L</p>
                      <p className={`text-xl font-semibold ${
                        parseFloat(position.pnl) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(position.pnl) >= 0 ? '+' : ''}
                        ${parseFloat(position.pnl).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Positions;
