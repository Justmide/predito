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
      
      const tokenCheck = walletService.checkTokenValidity();
      if (!tokenCheck.valid) {
        toast.error("Session expired. Please sign in again.");
        logout();
        navigate("/signin");
        return;
      }

      const authTest = await walletService.testAuth(true);
      if (!authTest.valid) {
        if (authTest.error === 'Invalid token' || authTest.error === 'Token expired') {
          toast.error("Session expired. Please sign in again.");
          logout();
          navigate("/signin");
          return;
        } else if (authTest.error === 'Network issue') {
          setError("Having trouble connecting to server. Showing cached or default data.");
          setShowDefaultData(true);
        } else {
          setError(authTest.error || "Authentication check failed");
        }
      }

      const [balanceData, addressesData, transactionsData] = await Promise.allSettled([
        walletService.getBalance(true),
        walletService.getDepositAddresses(true),
        walletService.getTransactions(true),
      ]);

      if (balanceData.status === 'fulfilled') setBalance(balanceData.value);
      else setBalance(walletService.getDefaultBalance());

      if (addressesData.status === 'fulfilled') setDepositAddresses(addressesData.value);
      else setDepositAddresses([]);

      if (transactionsData.status === 'fulfilled') setTransactions(transactionsData.value);
      else setTransactions([]);

      const hasRealData = 
        (balanceData.status === 'fulfilled' && balanceData.value.total !== '0.00') ||
        (addressesData.status === 'fulfilled' && addressesData.value.length > 0) ||
        (transactionsData.status === 'fulfilled' && transactionsData.value.length > 0);

      if (hasRealData) toast.success("Wallet data loaded");
      else if (!error) setError("No wallet data available. Make a deposit to get started.");
      
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED_401') {
        toast.error("Session expired. Please sign in again.");
        logout();
        navigate("/signin");
      } else {
        setError(error.message || "An unexpected error occurred");
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

  const normalizeStatus = (status: string): string => {
    if (!status) return 'Unknown';
    const statusMap: Record<string, string> = {
      'PENDING': 'Pending',
      'CONFIRMED': 'Confirmed',
      'COMPLETED': 'Completed',
      'COMPLETE': 'Completed',
      'FAILED': 'Failed',
      'SWAP_FAILED': 'Swap Failed',
      'TRANSFER_FAILED': 'Transfer Failed',
      'FEE_TRANSFER_FAILED': 'Fee Failed',
      'CANCELLED': 'Cancelled'
    };
    return statusMap[status.toUpperCase()] || status;
  };

  const getTransactionStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const normalized = status.toUpperCase();
    if (normalized === 'COMPLETED' || normalized === 'COMPLETE' || normalized === 'SUCCESS') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
    if (normalized === 'PENDING' || normalized === 'PROCESSING' || normalized === 'CONFIRMED') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
    if (normalized.includes('FAILED') || normalized === 'REJECTED' || normalized === 'CANCELLED') {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const getTransactionIcon = (type: string) => {
    if (!type) return '💳';
    switch (type.toLowerCase()) {
      case 'deposit': return '↘️';
      case 'withdrawal': return '↖️';
      case 'trade': return '🔄';
      default: return '💳';
    }
  };

  const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return 'Invalid Date'; }
  };

  const formatTime = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
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

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Wallet</h1>
            <p className="text-muted-foreground mt-2">Manage your funds and track transactions</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
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

        <Card className="mb-8 border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Balance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border">
                <p className="text-sm text-muted-foreground mb-1">USDC Balance</p>
                <p className="text-3xl font-bold text-foreground">${balance?.usdc || "0.00"}</p>
              </div>
              <div className="p-6 rounded-xl border">
                <p className="text-sm text-muted-foreground mb-1">USDT Balance</p>
                <p className="text-3xl font-bold text-foreground">${balance?.usdt || "0.00"}</p>
              </div>
              <div className="p-6 rounded-xl border">
                <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                <p className="text-3xl font-bold text-primary">${balance?.total || "0.00"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="addresses">Deposit Addresses</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle>Deposit Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                {depositAddresses.map((addr) => (
                  <div key={addr.currency} className="p-4 border rounded-lg mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">{addr.currency} ({addr.network})</span>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(addr.address)}><Copy className="h-4 w-4" /></Button>
                    </div>
                    <code className="block p-2 bg-muted rounded text-xs break-all">{addr.address}</code>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center py-12 text-muted-foreground">No transactions found.</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 10).map((tx) => {
                      const isWithdrawal = tx.type?.toLowerCase() === 'withdrawal';
                      return (
                        <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">{getTransactionIcon(tx.type)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold capitalize">{tx.type}</span>
                                <Badge variant="outline" className={getTransactionStatusColor(tx.status)}>
                                  {normalizeStatus(tx.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(tx.timestamp)} • {formatTime(tx.timestamp)}
                              </p>
                              {/* ✅ RESTORED: Transaction Hash Display */}
                              {tx.txHash && (
                                <p className="text-xs text-muted-foreground mt-1 font-mono bg-muted/50 px-1 rounded inline-block">
                                  {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right mt-2 sm:mt-0">
                            {/* ✅ FIXED: Correct sign and color */}
                            <p className={`text-lg font-bold ${isWithdrawal ? 'text-red-600' : 'text-green-600'}`}>
                              {isWithdrawal ? '-' : '+'}{tx.amount} {tx.currency}
                            </p>
                            {tx.txHash && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-primary"
                                onClick={() => window.open(`https://polygonscan.com/tx/${tx.txHash}`, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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