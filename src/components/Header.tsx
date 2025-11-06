import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Download, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">P</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Predito</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
              <Download className="w-4 h-4" />
              Deposit
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 hidden sm:flex">
              <Upload className="w-4 h-4" />
              Withdraw
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <Link to="/signin">
              <Button variant="ghost" size="sm" className="gap-2">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Up</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
