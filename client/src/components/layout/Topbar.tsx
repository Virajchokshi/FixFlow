import { useNavigate } from 'react-router-dom';
import { LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useAuthContext } from '@/context/AuthContext';
import { toast } from 'sonner';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  if (!user) return null;

  return (
    <header className="fixed left-0 md:left-60 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 backdrop-blur-sm shadow-sm px-4 sm:px-6">
      {/* Left: hamburger (mobile) + welcome text */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="hidden sm:block text-sm text-fixflow-muted">
          Welcome back, <span className="font-medium text-foreground">{user.name}</span>
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-fixflow-primary text-white text-xs uppercase">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-fixflow-muted capitalize">{user.role}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-fixflow-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
