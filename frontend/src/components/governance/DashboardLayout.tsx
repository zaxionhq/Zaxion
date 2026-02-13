import React from 'react';
import { LayoutDashboard, History, BarChart3, Settings, Shield, ArrowLeft, LogOut, RefreshCw, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useSession();

  const handleConnectAnother = () => {
    window.location.href = `/api/v1/auth/github?redirect_url=${encodeURIComponent(window.location.pathname)}`;
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/governance' },
    { label: 'Decisions', icon: History, path: '/governance/decisions' },
    { label: 'Analytics', icon: BarChart3, path: '/governance/analytics' },
    { label: 'Settings', icon: Settings, path: '/governance/settings' },
  ];

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card/50 backdrop-blur-xl flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight">Zaxion Governance</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          {/* User Profile Section */}
          <div className="px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-2 h-12 hover:bg-accent/50">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-bold truncate w-full">{user?.displayName || user?.username}</span>
                    <span className="text-[10px] text-muted-foreground truncate w-full">@{user?.username}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mb-2">
                <DropdownMenuLabel>Account Management</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleConnectAnother} className="cursor-pointer">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Switch Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between px-3 pt-4 border-t border-border/50 mt-4">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background/50">
        {children}
      </main>
    </div>
  );
};
