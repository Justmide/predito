import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { walletService, Balance, DepositAddress, Transaction } from "@/services/walletService";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const Wallet = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    const fetchWalletData = async () => {
      try {
        setLoading(true);
        const [balanceData, addressesData, transactionsData] = await Promise.all([
          walletService.getBalance(token || undefined),
          walletService.getDepositAddresses(token || undefined),
          walletService.getTransactions(token || undefined),
        ]);
        
        setBalance(balanceData);
        setDepositAddresses(addressesData);
        setTransactions(transactionsData);
      } catch (error) {
        toast.error("Failed to load wallet data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [token, isAuthenticated, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
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
        <h1 className="text-4xl font-bold mb-8 text-foreground">Wallet</h1>

        {/* Balance Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>Your current wallet balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">USDC</p>
                <p className="text-3xl font-bold text-foreground">
                  ${balance?.usdc || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">USDT</p>
                <p className="text-3xl font-bold text-foreground">
                  ${balance?.usdt || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-3xl font-bold text-primary">
                  ${balance?.total || "0.00"}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-4">
              <Button onClick={() => navigate("/deposit")}>Deposit</Button>
              <Button variant="outline" onClick={() => navigate("/withdraw")}>Withdraw</Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="addresses" className="space-y-6">
          <TabsList>
            <TabsTrigger value="addresses">Deposit Addresses</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>Deposit Addresses</CardTitle>
                <CardDescription>
                  Send funds to these addresses to deposit into your wallet
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent wallet transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold text-foreground capitalize">{tx.type}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                              tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount} {tx.currency}
                          </p>
                          {tx.txHash && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-primary"
                              onClick={() => window.open(`https://etherscan.io/tx/${tx.txHash}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Wallet;
