import { Button } from "@/components/ui/button";
import { TrendingUp, Wallet } from "lucide-react";

const Hero = () => {
  return (
    <div className="bg-gradient-primary text-primary-foreground py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Trade on What You Believe
        </h1>
        <p className="text-xl md:text-2xl mb-10 opacity-95 max-w-2xl mx-auto">
          Bet on outcomes. Earn rewards. Shape the future with prediction markets.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            variant="secondary"
            className="gap-2 text-lg px-8 py-6 bg-white hover:bg-white/90 text-primary"
          >
            <TrendingUp className="w-5 h-5" />
            Explore Markets
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="gap-2 text-lg px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-primary"
          >
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
