import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogOut, Settings, User, User2 } from 'lucide-react';

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
        <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-purple-50 dark:hover:bg-white/10">
          <div className="flex items-center gap-2 w-full">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-8 h-8 rounded-full border-2 border-purple-500 dark:border-purple-400"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center border-2 border-purple-500 dark:border-purple-400">
                <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-100">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DropdownMenuItem asChild>
          <Link
            to={{
              pathname: "/user",
              //currently i am commenting out this line because we are not fetching user accpunt's data from database and it's in buldiing phase
              // search: chatId ? `?from=${encodeURIComponent(chatId)}` : "",
            }}
            className="flex items-center gap-2 text-gray-800 cursor-pointer dark:text-gray-100 hover:bg-purple-50 dark:hover:bg-white/10"
          >
           <User2 size={18} className=""/>
            My Account
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-gray-200 cursor-pointer dark:bg-gray-700" />
        
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut size={18} className="text-red-600"/>
          <span className='w-full h-full text-red-600 cursor-pointer'>
            Sign out
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}