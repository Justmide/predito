import { Button } from "@/components/ui/button";
import { TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const { isAuthenticated } = useAuth();

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
            asChild
            size="lg" 
            variant="secondary"
            className="gap-2 text-lg px-8 py-6 bg-white hover:bg-white/90 text-primary font-semibold"
          >
            <Link to="/markets">
              <TrendingUp className="w-5 h-5" />
              Explore Markets
            </Link>
          </Button>
          <Button 
            asChild
            size="lg" 
            className="gap-2 text-lg px-8 py-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
          >
            <Link to={isAuthenticated ? "/wallet" : "/signin"}>
              <Wallet className="w-5 h-5" />
              {isAuthenticated ? "Go to Wallet" : "Connect Wallet"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;