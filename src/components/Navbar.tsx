import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { LayoutDashboard, Grid3X3, PlusCircle, Share2, Download, LogOut, User } from "lucide-react";
import { useCollection } from "@/context/CollectionContext";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/roster", label: "Roster", icon: Grid3X3 },
  { to: "/add-item", label: "Add Item", icon: PlusCircle },
  { to: "/share", label: "Share", icon: Share2 },
  { to: "/export", label: "Export", icon: Download },
  { to: "/profile", label: "Profile", icon: User },
];

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useCollection();

  if (!user) return null;

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Link to="/" className="flex flex-col">
          <img src={logo} alt="Relic Roster" className="h-8" />
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" onClick={signOut} className="ml-2 text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      {/* Mobile top header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Link to="/" className="flex flex-col">
          <img src={logo} alt="Relic Roster" className="h-7" />
        </Link>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm flex justify-around py-2 px-1">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
