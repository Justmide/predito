import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Download, Upload, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

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
            {isAuthenticated && (
              <>
                <Button asChild variant="ghost" size="sm" className="gap-2 hidden sm:flex">
                  <Link to="/deposit">
                    <Download className="w-4 h-4" />
                    Deposit
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="gap-2 hidden sm:flex">
                  <Link to="/withdraw">
                    <Upload className="w-4 h-4" />
                    Withdraw
                  </Link>
                </Button>
                <div className="h-6 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium hidden sm:inline">{user?.username}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
            
            {!isAuthenticated && (
              <>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/signin">
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Link>
                </Button>
                <Button asChild size="sm" className="gap-2">
                  <Link to="/signup">
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
