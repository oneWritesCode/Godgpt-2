import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from '@/frontend/components/ui/sidebar';
import { Button, buttonVariants } from './ui/button';
import { deleteThread, getThreads } from '@/frontend/dexie/queries';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import UserProfile from './UserProfile';

export default function ChatSidebar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const threads = useLiveQuery(() => getThreads(), []);
  

  return (
    <Sidebar>
      <div className="flex flex-col h-full p-2 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <Header />
        <SidebarContent className="no-scrollbar">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {threads?.map((thread) => {
                  return (
                    <SidebarMenuItem key={thread.id}>
                      <div
                        className={cn(
                          'cursor-pointer group/thread h-9 flex items-center px-2 py-1 rounded-[8px] overflow-hidden w-full hover:bg-white/50 dark:hover:bg-gray-800/50',
                          id === thread.id && 'bg-white/50 dark:bg-gray-800/50'
                        )}
                        onClick={() => {
                          if (id === thread.id) {
                            return;
                          }
                          navigate(`/chat/${thread.id}`);
                        }}
                      >
                        <span className="truncate block text-gray-800 dark:text-gray-100">{thread.title}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hidden group-hover/thread:flex hover:text-red-600 ml-auto h-7 w-7"
                          onClick={async (event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            await deleteThread(thread.id);
                            navigate(`/chat`);
                          }}
                        > 
                           <Trash2 size={16} />
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <Footer />
      </div>
    </Sidebar>
  );
}

function PureHeader() {
  return (
    <SidebarHeader className="flex justify-between items-center gap-4 relative">
      <SidebarTrigger className="absolute right-1 top-2.5" />
      <h1 className="text-2xl font-bold">
        GodGPT
      </h1>
      <Link
        to="/chat"
        className={buttonVariants({
          variant: 'default',
          className: 'w-full',
        })}
      >
        New Chat
      </Link>
    </SidebarHeader>
  );
}

const Header = memo(PureHeader);




// Replace the Footer component
const PureFooter = () => {
  return (
    <SidebarFooter className="space-y-2">
      <UserProfile />
    </SidebarFooter>
  );
};

const Footer = memo(PureFooter);
