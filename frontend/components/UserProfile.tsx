import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';

import { Link } from 'react-router';
import { useParams } from 'react-router';
import { useAuth } from '../hooks/useAuth';

export default function UserProfile() {
  const { session, logout } = useAuth();
  const { id: chatId } = useParams();

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-2 h-auto">
          <div className="flex items-center gap-2 w-full">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-medium truncate">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link
            to={{
              pathname: "/settings",
              search: chatId ? `?from=${encodeURIComponent(chatId)}` : "",
            }}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2 text-red-600"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}