// import {
//   Sidebar,
//   SidebarHeader,
//   SidebarContent,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarMenu,
//   SidebarMenuItem,
//   SidebarFooter,
//   SidebarTrigger,
// } from '@/frontend/components/ui/sidebar';
// import { Button, buttonVariants } from './ui/button';
// import { deleteThread, getThreads } from '@/frontend/dexie/queries';
// import { useLiveQuery } from 'dexie-react-hooks';
// import { Link, useNavigate, useParams } from 'react-router';
// import { Trash2 } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import { memo } from 'react';
// import UserProfile from './UserProfile';
// import { useDexieSync } from '@/frontend/hooks/useDexieSync';

// export default function ChatSidebar() {
//   useDexieSync();
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const threads = useLiveQuery(() => getThreads(), []);
  

//   return (
//     <Sidebar>
//       <div className="flex flex-col h-full p-2 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 z-40">
//         <Header />
//         <SidebarContent className="no-scrollbar">
//           <SidebarGroup>
//             <SidebarGroupContent>
//               <SidebarMenu>
//                 {threads?.map((thread) => {
//                   return (
//                     <SidebarMenuItem key={thread.id}>
//                       <div
//                         className={cn(
//                           'cursor-pointer group/thread h-9 flex items-center px-2 py-1 rounded-[8px] overflow-hidden w-full hover:bg-white/50 dark:hover:bg-gray-800/50',
//                           id === thread.id && 'bg-white/50 dark:bg-gray-800/50'
//                         )}
//                         onClick={() => {
//                           if (id === thread.id) {
//                             return;
//                           }
//                           navigate(`/chat/${thread.id}`);
//                         }}
//                       >
//                         <span className="truncate block text-gray-800 dark:text-gray-100">{thread.title}</span>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="hidden group-hover/thread:flex hover:text-red-600 ml-auto h-7 w-7"
//                           onClick={async (event) => {
//                             event.preventDefault();
//                             event.stopPropagation();
//                             await deleteThread(thread.id);
//                             navigate(`/chat`);
//                           }}
//                         > 
//                            <Trash2 size={16} />
//                         </Button>
//                       </div>
//                     </SidebarMenuItem>
//                   );
//                 })}
//               </SidebarMenu>
//             </SidebarGroupContent>
//           </SidebarGroup>
//         </SidebarContent>
//         <Footer />
//       </div>
//     </Sidebar>
//   );
// }

// function PureHeader() {
//   return (
//     <SidebarHeader className="flex justify-between items-center gap-4 relative">
//       <SidebarTrigger className="absolute right-1 top-2.5" />
//       <h1 className="text-2xl font-bold">
//         GodGPT
//       </h1>
//       <Link
//         to="/chat"
//         className={buttonVariants({
//           variant: 'default',
//           className: 'w-full',
//         })}
//       >
//         New Chat
//       </Link>
//     </SidebarHeader>
//   );
// }

// const Header = memo(PureHeader);




// // Replace the Footer component
// const PureFooter = () => {
//   return (
//     <SidebarFooter className="space-y-2">
//       <UserProfile />
//     </SidebarFooter>
//   );
// };

// const Footer = memo(PureFooter);
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
import { deleteThread, getGroupedThreads, deleteQueueGroup } from '@/frontend/dexie/queries';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router';
import { Trash2, ChevronDown, ChevronRight, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo, useState } from 'react';
import UserProfile from './UserProfile';
import { useDexieSync } from '@/frontend/hooks/useDexieSync';
import { Badge } from './ui/badge';
import { isImageModel, isVisionModel, supportsTools } from '@/lib/models';
import { db } from '@/frontend/dexie/db';

interface ThreadGroupProps {
  groupId: string;
  threads: Array<{
    id: string;
    title: string;
    model?: string;
    createdAt: Date;
    lastMessageAt: Date;
  }>;
  currentThreadId?: string;
  onNavigate: (threadId: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

const ThreadGroup = memo(({ 
  groupId, 
  threads, 
  currentThreadId, 
  onNavigate, 
  onDeleteGroup 
}: ThreadGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Get queue status for this group
  const queueItems = useLiveQuery(
    () => db.queueItems.where('groupId').equals(groupId).toArray(),
    [groupId]
  );

  const getModelIcon = (model: string) => {
    if (isImageModel('Chat GPT 4o Mini')) return '🎨';
    if (isVisionModel('Claude Sonnet 4')) return '👁️';
    if (supportsTools('Deepseek R1 0528')) return '🔧';
    return '🤖';
  };

  const getQueueStatus = (model: string) => {
    const item = queueItems?.find(q => q.model === model);
    if (!item) return null;
    
    switch (item.status) {
      case 'pending': return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'processing': return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'failed': return <XCircle className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  const mainThread = threads[0];
  const groupTitle = threads.length > 1 
    ? `${mainThread.title} (${threads.length} models)`
    : mainThread.title;

  return (
    <div className="space-y-1">
      {/* Group Header */}
      <div className="flex items-center justify-between group/group">
        <div 
          className="flex items-center gap-2 flex-1 cursor-pointer p-2 rounded-md hover:bg-white/50 dark:hover:bg-gray-800/50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {threads.length > 1 ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : null}
          <span className="truncate text-sm font-medium">{groupTitle}</span>
          <Badge variant="secondary" className="text-xs">
            {threads.length}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="hidden group-hover/group:flex hover:text-red-600 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteGroup(groupId);
          }}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Group Threads */}
      {isExpanded && (
        <div className="ml-4 space-y-1">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={cn(
                'cursor-pointer group/thread flex items-center justify-between px-3 py-2 rounded-md text-sm',
                'hover:bg-white/50 dark:hover:bg-gray-800/50',
                currentThreadId === thread.id && 'bg-white/50 dark:bg-gray-800/50'
              )}
              onClick={() => onNavigate(thread.id)}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs">{getModelIcon(thread.model || '')}</span>
                <span className="truncate">{thread.model}</span>
                {getQueueStatus(thread.model || '')}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="hidden group-hover/thread:flex hover:text-red-600 h-5 w-5"
                onClick={async (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  await deleteThread(thread.id);
                }}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default function ChatSidebar() {
  useDexieSync();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { grouped, ungrouped } = useLiveQuery(() => getGroupedThreads(), []) || { 
    grouped: [], 
    ungrouped: [] 
  };

  const handleNavigate = (threadId: string) => {
    if (id === threadId) return;
    navigate(`/chat/${threadId}`);
  };

  const handleDeleteGroup = async (groupId: string) => {
    await deleteQueueGroup(groupId);
    navigate('/chat');
  };

  return (
    <Sidebar>
      <div className="flex flex-col h-full p-2 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 z-40">
        <Header />
        <SidebarContent className="no-scrollbar">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Grouped Threads */}
                {grouped.map(([groupId, threads]) => (
                  <SidebarMenuItem key={groupId}>
                    <ThreadGroup
                      groupId={groupId}
                      threads={threads}
                      currentThreadId={id}
                      onNavigate={handleNavigate}
                      onDeleteGroup={handleDeleteGroup}
                    />
                  </SidebarMenuItem>
                ))}

                {/* Ungrouped Threads */}
                {ungrouped.map((thread) => (
                  <SidebarMenuItem key={thread.id}>
                    <div
                      className={cn(
                        'cursor-pointer group/thread h-9 flex items-center px-2 py-1 rounded-[8px] overflow-hidden w-full hover:bg-white/50 dark:hover:bg-gray-800/50',
                        id === thread.id && 'bg-white/50 dark:bg-gray-800/50'
                      )}
                      onClick={() => handleNavigate(thread.id)}
                    >
                      <span className="truncate block text-gray-800 dark:text-gray-100">
                        {thread.title}
                      </span>
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <Footer />
      </div>
    </Sidebar>
  );
}

// ... Header and Footer components remain the same ...
function PureHeader() {
  return (
    <SidebarHeader className="flex justify-between items-center gap-4 relative">
      <SidebarTrigger className="absolute right-1 top-2.5" />
      <h1 className="text-2xl font-bold">GodGPT</h1>
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

const PureFooter = () => {
  return (
    <SidebarFooter className="space-y-2">
      <UserProfile />
    </SidebarFooter>
  );
};

const Footer = memo(PureFooter);