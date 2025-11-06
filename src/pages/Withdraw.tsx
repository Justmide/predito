import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Withdraw = () => {
  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw.",
        variant: "destructive",
      });
      return;
    }

    if (!destinationAddress) {
      toast({
        title: "Missing Wallet Address",
        description: "Please enter a destination wallet address.",
        variant: "destructive",
      });
      return;
    }

    // Dummy function placeholder
    toast({
      title: "Withdrawal Successful!",
      description: `Successfully withdrew ${amount} USDC to ${destinationAddress.substring(0, 10)}...`,
    });

    // Reset form
    setAmount("");
    setDestinationAddress("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Withdraw Funds</CardTitle>
            <CardDescription>
              Transfer USDC from your account to an external wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal Amount (USDC)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination Wallet Address</Label>
                <Input
                  id="destination"
                  type="text"
                  placeholder="0x..."
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Ensure this address is correct. Transactions cannot be reversed.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Withdraw
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Withdraw;
