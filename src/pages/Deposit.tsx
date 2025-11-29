import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Copy } from "lucide-react";
import { walletService, DepositAddress } from "@/services/walletService";

const Deposit = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    const fetchAddresses = async () => {
      try {
        setLoading(true);
        const addresses = await walletService.getDepositAddresses(token || undefined);
        setDepositAddresses(addresses);
      } catch (error) {
        toast.error("Failed to load deposit addresses");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [token, isAuthenticated, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard");
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
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/wallet" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Wallet
        </Link>
        
        <h1 className="text-4xl font-bold mb-8 text-foreground">Deposit Funds</h1>

        <Card>
          <CardHeader>
            <CardTitle>Deposit Addresses</CardTitle>
            <CardDescription>
              Send funds to these addresses to deposit into your Predito wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {depositAddresses.map((addr) => (
                <div key={addr.currency} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{addr.currency}</h3>
                    <span className="text-sm text-muted-foreground">{addr.network}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                      {addr.address}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(addr.address)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Only send supported tokens to these addresses. 
                Sending other tokens may result in permanent loss of funds.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Deposit;
