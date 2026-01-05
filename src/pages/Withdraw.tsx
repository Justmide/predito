import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { withdrawalService } from "@/services/withdrawalService";

const Withdraw = () => {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Basic Validation
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!withdrawalAddress) {
      toast.error("Please enter a destination address");
      return;
    }

    // 2. Clean and Validate Address Format
    const cleanedAddress = withdrawalAddress.trim();
    
    // Standard EVM Address Regex (0x followed by 40 hex characters)
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethRegex.test(cleanedAddress)) {
      toast.error("Invalid wallet address format. Must be a 0x... Ethereum address.");
      return;
    }
    
    if (!token) {
      toast.error("Please sign in to withdraw");
      return;
    }

    try {
      setLoading(true);
      
      // 3. Send cleaned address to service
      await withdrawalService.initiateWithdrawal(token, {
        currency,
        amount,
        withdrawalAddress: cleanedAddress, 
      });    

      toast.success("Withdrawal initiated successfully");
      setAmount("");
      setWithdrawalAddress("");
      
      setTimeout(() => navigate("/wallet"), 2000);
    } catch (error: any) {
      // The backend error "Invalid withdrawal address" will be caught here
      toast.error(error.message || "Failed to initiate withdrawal");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/wallet" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Wallet
        </Link>
        
        <h1 className="text-4xl font-bold mb-8 text-foreground">Withdraw Funds</h1>

        <Card>
          <CardHeader>
            <CardTitle>Withdraw from your wallet</CardTitle>
            <CardDescription>
              Transfer funds from your Predito wallet to an external address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destination">Withdrawal Address</Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="0x..."
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Please double-check the address. Transactions cannot be reversed.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processing..." : "Withdraw"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Withdraw;