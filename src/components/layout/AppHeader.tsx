import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { mockNotifications } from '@/lib/mock-data';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppHeader() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search events, departments..." className="campus-input pl-9 w-64" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-card border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-3 border-b font-medium text-sm">Notifications</div>
              <div className="max-h-64 overflow-y-auto">
                {mockNotifications.map(n => (
                  <div key={n.id} className={`p-3 border-b last:border-0 text-sm ${!n.read ? 'bg-accent/30' : ''}`}>
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{n.message}</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">{n.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pl-2 border-l">
          <div className="w-8 h-8 rounded-full campus-gradient flex items-center justify-center text-primary-foreground text-sm font-medium">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
