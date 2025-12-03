import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, LogOut, User, Menu, X, Home, BarChart3, Wallet, ArrowDownToLine, ArrowUpFromLine, TrendingUp, History, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/signin');
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const authNavLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/markets", label: "Markets", icon: BarChart3 },
    { to: "/wallet", label: "Wallet", icon: Wallet },
    { to: "/deposit", label: "Deposit", icon: ArrowDownToLine },
    { to: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { to: "/positions", label: "Positions", icon: TrendingUp },
    { to: "/trades", label: "Trades", icon: History },
    { to: "/pnl", label: "P&L", icon: DollarSign },
  ];

  const publicNavLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/markets", label: "Markets", icon: BarChart3 },
  ];

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
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/markets">Markets</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/wallet">Wallet</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/positions">Positions</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="hidden lg:flex">
                  <Link to="/trades">Trades</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="hidden lg:flex">
                  <Link to="/pnl">P&L</Link>
                </Button>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user?.username}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            )}
            
            {!isAuthenticated && (
              <>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/signin">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="sm" className="gap-2">
                  <Link to="/signup">
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-xl font-bold text-foreground">Menu</span>
                  </div>

                  {/* User Info for authenticated users */}
                  {isAuthenticated && user && (
                    <div className="flex items-center gap-3 px-2 py-3 mb-4 bg-muted rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">{user.username}</span>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-1 flex-1">
                    {(isAuthenticated ? authNavLinks : publicNavLinks).map((link) => (
                      <SheetClose asChild key={link.to}>
                        <Link
                          to={link.to}
                          onClick={handleNavClick}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition-colors text-foreground"
                        >
                          <link.icon className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>

                  {/* Auth Buttons */}
                  <div className="border-t border-border pt-4 mt-4">
                    {isAuthenticated ? (
                      <Button 
                        variant="outline" 
                        className="w-full gap-2"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <SheetClose asChild>
                          <Button asChild className="w-full gap-2">
                            <Link to="/signin" onClick={handleNavClick}>
                              <LogIn className="w-4 h-4" />
                              Sign In
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="w-full gap-2">
                            <Link to="/signup" onClick={handleNavClick}>
                              <UserPlus className="w-4 h-4" />
                              Sign Up
                            </Link>
                          </Button>
                        </SheetClose>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;