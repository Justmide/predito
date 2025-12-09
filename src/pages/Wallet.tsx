import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { walletService, Balance, DepositAddress, Transaction } from "@/services/walletService";
import { Copy, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Wallet = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDefaultData, setShowDefaultData] = useState(false);

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
      setError(null);
      setShowDefaultData(false);
      
      console.log('[Wallet] Starting data fetch...');
      
      // Check token validity first (local check without API call)
      const tokenCheck = walletService.checkTokenValidity();
      console.log('[Wallet] Token check:', tokenCheck);
      
      if (!tokenCheck.valid) {
        console.log('[Wallet] Token invalid:', tokenCheck.reason);
        toast.error("Session expired. Please sign in again.");
        logout();
        navigate("/signin");
        return;
      }

      // Test auth with error suppression
      console.log('[Wallet] Testing auth...');
      const authTest = await walletService.testAuth(true); // suppressErrors = true
      console.log('[Wallet] Auth test result:', authTest);
      
      if (!authTest.valid) {
        // Check the specific error
        if (authTest.error === 'Invalid token' || authTest.error === 'Token expired') {
          console.log('[Wallet] Invalid/expired token, logging out');
          toast.error("Session expired. Please sign in again.");
          logout();
          navigate("/signin");
          return;
        } else if (authTest.error === 'Network issue') {
          // Network error but token might still be valid
          console.log('[Wallet] Network issue detected');
          setError("Having trouble connecting to server. Showing cached or default data.");
          setShowDefaultData(true);
        } else {
          // Other errors
          console.log('[Wallet] Other auth error:', authTest.error);
          setError(authTest.error || "Authentication check failed");
        }
      }

      // Fetch data with error suppression
      console.log('[Wallet] Fetching data...');
      const [balanceData, addressesData, transactionsData] = await Promise.allSettled([
        walletService.getBalance(true), // suppressErrors = true
        walletService.getDepositAddresses(true),
        walletService.getTransactions(true),
      ]);
      
      console.log('[Wallet] Fetch results:', {
        balance: balanceData,
        addresses: addressesData,
        transactions: transactionsData
      });

      // Handle balance
      if (balanceData.status === 'fulfilled') {
        setBalance(balanceData.value);
        console.log('[Wallet] Balance set:', balanceData.value);
      } else {
        console.error('[Wallet] Balance fetch failed:', balanceData.reason);
        setBalance(walletService.getDefaultBalance());
      }

      // Handle addresses
      if (addressesData.status === 'fulfilled') {
        setDepositAddresses(addressesData.value);
      } else {
        console.error('[Wallet] Addresses fetch failed:', addressesData.reason);
        setDepositAddresses([]);
      }

      // Handle transactions
      if (transactionsData.status === 'fulfilled') {
        setTransactions(transactionsData.value);
      } else {
        console.error('[Wallet] Transactions fetch failed:', transactionsData.reason);
        setTransactions([]);
      }

      // Check if we got any real data
      const hasRealData = 
        (balanceData.status === 'fulfilled' && balanceData.value.total !== '0.00') ||
        (addressesData.status === 'fulfilled' && addressesData.value.length > 0) ||
        (transactionsData.status === 'fulfilled' && transactionsData.value.length > 0);

      if (hasRealData) {
        toast.success("Wallet data loaded");
      } else if (!error) {
        setError("No wallet data available. Make a deposit to get started.");
      }
      
    } catch (error: any) {
      console.error('[Wallet] Unexpected error in fetchWalletData:', error);
      
      // Only handle critical errors that require logout
      if (error.message === 'UNAUTHORIZED_401') {
        toast.error("Session expired. Please sign in again.");
        logout();
        navigate("/signin");
      } else {
        setError(error.message || "An unexpected error occurred");
        // Show default data as fallback
        setBalance(walletService.getDefaultBalance());
        setDepositAddresses([]);
        setTransactions([]);
        setShowDefaultData(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await fetchWalletData();
  };

  const copyToClipboard = (text: string) => {
    if (!text) {
      toast.error("No address to copy");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getTransactionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
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
        {error && (
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showDefaultData && (
          <Alert variant="info" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Showing default data. Some features may be limited until connection is restored.
            </AlertDescription>
          </Alert>
        )}

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
              disabled={!balance || parseFloat(balance.total) === 0 || showDefaultData}
            >
              Withdraw
            </Button>
          </div>
        </div>

        {/* Balance Section */}
        <Card className="mb-8 border-primary/20 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Balance Overview</CardTitle>
            <CardDescription>
              {showDefaultData 
                ? "Default balance shown (connection issue)" 
                : "Your current wallet balance across all assets"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-xl border ${showDefaultData ? 'opacity-75' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">USDC Balance</p>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">USD Coin</Badge>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  ${balance?.usdc || "0.00"}
                </p>
                {showDefaultData && (
                  <p className="text-xs text-muted-foreground mt-2">Default value</p>
                )}
              </div>
              
              <div className={`p-6 rounded-xl border ${showDefaultData ? 'opacity-75' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">USDT Balance</p>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300">Tether</Badge>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  ${balance?.usdt || "0.00"}
                </p>
                {showDefaultData && (
                  <p className="text-xs text-muted-foreground mt-2">Default value</p>
                )}
              </div>
              
              <div className={`p-6 rounded-xl border ${showDefaultData ? 'opacity-75' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300">Combined</Badge>
                </div>
                <p className="text-3xl font-bold text-primary">
                  ${balance?.total || "0.00"}
                </p>
                {showDefaultData && (
                  <p className="text-xs text-muted-foreground mt-2">Default value</p>
                )}
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
                  {showDefaultData 
                    ? "Addresses unavailable due to connection issue" 
                    : "Send funds to these addresses to deposit into your wallet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {depositAddresses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <span className="text-2xl">📍</span>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {showDefaultData 
                        ? "Cannot load deposit addresses" 
                        : "No deposit addresses available"}
                    </p>
                    <Button onClick={handleRefresh} disabled={refreshing}>
                      {refreshing ? 'Refreshing...' : 'Try Again'}
                    </Button>
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
                            {addr.address || 'Address not available'}
                          </code>
                          {addr.address && (
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(addr.address)}
                              className="shrink-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {addr.address && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Only send {addr.currency} on the {addr.network} network to this address
                          </p>
                        )}
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
                    <CardDescription>
                      {showDefaultData 
                        ? "Transaction history unavailable" 
                        : "Your recent wallet transactions"}
                    </CardDescription>
                  </div>
                  {!showDefaultData && (
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
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <span className="text-2xl">💳</span>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      {showDefaultData 
                        ? "Cannot load transaction history" 
                        : "No transactions yet"}
                    </p>
                    {!showDefaultData && (
                      <Button onClick={() => navigate("/deposit")}>Make your first deposit</Button>
                    )}
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
                            tx.type === 'withdrawal' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
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