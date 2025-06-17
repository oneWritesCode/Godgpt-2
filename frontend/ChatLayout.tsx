import { SidebarProvider } from '@/frontend/components/ui/sidebar';
import ChatSidebar from '@/frontend/components/ChatSidebar';
import AuthGuard from '@/frontend/components/AuthGuard';
import { Outlet } from 'react-router';

export default function ChatLayout() {
  return (
    <AuthGuard>
      <SidebarProvider>
        <ChatSidebar />
        <div className="flex-1 relative">
          <Outlet />
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}