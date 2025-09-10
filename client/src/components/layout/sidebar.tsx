import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Calendar, Home, Plus, List, Settings, User, LogOut, Menu, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, roles: ["faculty", "student", "admin"] },
    { name: "Calendar", href: "/calendar", icon: Calendar, roles: ["faculty", "student", "admin"] },
    { name: "Book Room", href: "/book-room", icon: Plus, roles: ["faculty"] },
    { name: "My Bookings", href: "/my-bookings", icon: List, roles: ["faculty"] },
    { name: "Manage Rooms", href: "/manage-rooms", icon: MapPin, roles: ["admin"] },
    { name: "Profile", href: "/profile", icon: User, roles: ["faculty", "student", "admin"] },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || "")
  );

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsMobileOpen(false);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobile}
          data-testid="button-mobile-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          data-testid="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <nav className={cn(
        "bg-card border-r border-border w-60 h-full fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )} data-testid="sidebar">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="text-primary-foreground text-sm" />
            </div>
            <h1 className="font-semibold text-lg" data-testid="text-app-title">Classroom Scheduler</h1>
          </div>
          
          {/* Navigation */}
          <div className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                  data-testid={`nav-${item.href}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </a>
              );
            })}
          </div>

          {/* User section */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <User className="text-muted-foreground text-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" data-testid="text-user-name">
                  {user?.name}
                </div>
                <div className="text-xs text-muted-foreground capitalize" data-testid="text-user-role">
                  {user?.role}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-testid="button-sidebar-logout"
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Signing out..." : "Logout"}
            </Button>
          </div>
        </div>
      </nav>
    </>
  );
}
