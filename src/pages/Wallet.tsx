import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { walletService, Balance, DepositAddress, Transaction } from "@/services/walletService";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Wallet = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
      return;
    }

    fetchWalletData();
  }, [isAuthenticated, navigate]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      
      // Check authentication first
      const authTest = await walletService.testAuth();
      if (!authTest.valid) {
        toast.error("Session expired. Please sign in again.");
        logout();
        navigate("/signin");
        return;
      }

      const [balanceData, addressesData, transactionsData] = await Promise.all([
        walletService.getBalance(),
        walletService.getDepositAddresses(),
        walletService.getTransactions(),
      ]);
      
      setBalance(balanceData);
      setDepositAddresses(addressesData);
      setTransactions(transactionsData);
      
      toast.success("Wallet data loaded successfully");
    } catch (error: any) {
      console.error('Wallet fetch error:', error);
      
      if (error.message?.includes('Session expired') || 
          error.message?.includes('Token expired') || 
          error.message?.includes('401')) {
        toast.error("Session expired. Please sign in again.");
        logout();
        navigate("/signin");
      } else if (error.message?.includes('Authentication required')) {
        toast.error("Please sign in to view wallet");
        navigate("/signin");
      } else {
        toast.error(error.message || "Failed to load wallet data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '↘️';
      case 'withdrawal':
        return '↖️';
      case 'trade':
        return '🔄';
      default:
        return '💳';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Wallet</h1>
            <p className="text-muted-foreground mt-2">
              Manage your funds and track transactions
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate("/deposit")}>Deposit</Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/withdraw")}
              disabled={!balance || parseFloat(balance.total) === 0}
            >
              Withdraw
            </Button>
          </div>
        </div>

        {/* Balance Section */}
        <Card className="mb-8 border-primary/20 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Balance Overview</CardTitle>
            <CardDescription>Your current wallet balance across all assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">USDC Balance</p>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">USD Coin</Badge>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  ${balance?.usdc || "0.00"}
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">USDT Balance</p>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300">Tether</Badge>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  ${balance?.usdt || "0.00"}
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300">Combined</Badge>
                </div>
                <p className="text-3xl font-bold text-primary">
                  ${balance?.total || "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="addresses" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-2">
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
                {depositAddresses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <span className="text-2xl">📍</span>
                    </div>
                    <p className="text-muted-foreground mb-4">No deposit addresses available</p>
                    <Button onClick={handleRefresh}>Try Again</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {depositAddresses.map((addr) => (
                      <div 
                        key={`${addr.currency}-${addr.network}`} 
                        className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                          <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-bold text-primary">
                                {addr.currency === 'USDC' ? '$' : '₮'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{addr.currency}</h3>
                              <p className="text-sm text-muted-foreground">Receive {addr.currency} on {addr.network}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="w-fit">
                            {addr.network}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all border">
                            {addr.address}
                          </code>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(addr.address)}
                            className="shrink-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Only send {addr.currency} on the {addr.network} network to this address
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Your recent wallet transactions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate("/deposits")}
                    >
                      View Deposits
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate("/withdrawals")}
                    >
                      View Withdrawals
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <span className="text-2xl">💳</span>
                    </div>
                    <p className="text-muted-foreground mb-4">No transactions yet</p>
                    <Button onClick={() => navigate("/deposit")}>Make your first deposit</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 10).map((tx) => (
                      <div 
                        key={tx.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 mb-3 sm:mb-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="text-xl">
                              {getTransactionIcon(tx.type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground capitalize">{tx.type}</span>
                                <Badge 
                                  variant="outline" 
                                  className={getTransactionStatusColor(tx.status)}
                                >
                                  {tx.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(tx.timestamp).toLocaleDateString()} • {new Date(tx.timestamp).toLocaleTimeString()}
                              </p>
                              {tx.txHash && (
                                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px] sm:max-w-[300px]">
                                  TX: {tx.txHash.slice(0, 16)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            tx.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount} {tx.currency}
                          </p>
                          {tx.txHash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-8 text-primary hover:text-primary/80"
                              onClick={() => window.open(`https://polygonscan.com/tx/${tx.txHash}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View on Explorer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {transactions.length > 10 && (
                      <div className="text-center pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => navigate("/transactions")}
                        >
                          View All Transactions ({transactions.length})
                        </Button>
                      </div>
                    )}
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