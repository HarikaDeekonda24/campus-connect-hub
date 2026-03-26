import {
  LayoutDashboard, Calendar, PlusCircle, MapPin, MessageSquare, ClipboardCheck, Users, BarChart3, Shield, FileText, UserCircle, LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/lib/auth-context';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const studentNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: Calendar },
  { title: 'Submit Event', url: '/submit-event', icon: PlusCircle },
  { title: 'Attendance', url: '/attendance', icon: ClipboardCheck },
  { title: 'Campus Map', url: '/campus-map', icon: MapPin },
  { title: 'Concerns', url: '/concerns', icon: MessageSquare },
  { title: 'Profile', url: '/profile', icon: UserCircle },
];

const facultyNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: Calendar },
  { title: 'Attendance', url: '/attendance', icon: ClipboardCheck },
  { title: 'Concerns', url: '/concerns', icon: MessageSquare },
  { title: 'Profile', url: '/profile', icon: UserCircle },
];

const hodNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Approve Events', url: '/approve-events', icon: FileText },
  { title: 'Events', url: '/events', icon: Calendar },
  { title: 'Attendance', url: '/attendance', icon: ClipboardCheck },
  { title: 'Concerns', url: '/concerns', icon: MessageSquare },
  { title: 'Profile', url: '/profile', icon: UserCircle },
];

const adminNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Events', url: '/events', icon: Calendar },
  { title: 'Approve Events', url: '/approve-events', icon: FileText },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Concerns', url: '/concerns', icon: MessageSquare },
  { title: 'Campus Map', url: '/campus-map', icon: MapPin },
  { title: 'Profile', url: '/profile', icon: UserCircle },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const getNav = () => {
    switch (user?.role) {
      case 'admin': return adminNav;
      case 'hod': return hodNav;
      case 'faculty': return facultyNav;
      default: return studentNav;
    }
  };

  const navItems = getNav();
  const roleLabel = user?.role === 'hod' ? 'HOD' : user?.role;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="campus-gradient p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg campus-gradient-gold flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-accent-foreground" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold text-primary-foreground font-display tracking-wide">Campus Connect</h1>
            <p className="text-xs text-primary-foreground/60 capitalize">{roleLabel} Portal</p>
          </div>
        )}
      </div>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-sidebar p-3">
        <button onClick={logout} className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground text-sm transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-sidebar-accent">
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
