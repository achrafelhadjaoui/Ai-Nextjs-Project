'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Database,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '@/providers/i18n-provider';
import { logoutUser } from '@/lib/api/logout';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  // Admin-specific navigation items
  const adminNavItems: NavItem[] = [
    { 
      name: 'Admin Dashboard', 
      href: '/dashboard/admin', 
      icon: LayoutDashboard,
      badge: 'Overview'
    },
    { 
      name: t('sidebar.userManagement'), 
      href: '/dashboard/admin/users', 
      icon: Users,
      badge: 'Manage'
    },
    { 
      name: t('sidebar.analytics'), 
      href: '/dashboard/admin/analytics', 
      icon: BarChart,
      badge: 'Stats'
    },
    { 
      name: 'System Health', 
      href: '/dashboard/admin/health', 
      icon: Activity,
      badge: 'Monitor'
    },
    { 
      name: 'Database', 
      href: '/dashboard/admin/database', 
      icon: Database,
      badge: 'Data'
    },
    { 
      name: 'Security', 
      href: '/dashboard/admin/security', 
      icon: Shield,
      badge: 'Protect'
    },
    { 
      name: 'Audit Log', 
      href: '/dashboard/admin/audit', 
      icon: AlertTriangle,
      badge: 'Logs'
    },
    { 
      name: 'System Settings', 
      href: '/dashboard/admin/settings', 
      icon: Settings,
      badge: 'Config'
    },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-gradient-to-b from-[#1a0f0f] to-[#0a0a0a] border-r border-red-500/30 transition-all duration-300 ease-in-out flex flex-col z-40',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-red-500/30 px-4 bg-[#1a0f0f]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="text-xl font-semibold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Farisly AI
            </div>
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30 font-bold">
              ADMIN
            </span>
          </div>
        ) : (
          <div className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            A
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10'
                  : 'text-gray-400 hover:bg-red-500/10 hover:text-red-300 hover:border hover:border-red-500/20',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? `${item.name} - ${item.badge}` : undefined}
            >
              <Icon className={clsx(
                "w-5 h-5 flex-shrink-0 transition-transform",
                isActive && "scale-110"
              )} />
              
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded border border-red-500/30">
                    {item.badge}
                  </span>
                </div>
              )}
              
              {/* Admin indicator for collapsed state */}
              {isCollapsed && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Profile & Logout */}
      <div className="border-t border-red-500/30 px-3 py-4 space-y-2 bg-[#1a0f0f]">
        {/* Admin Quick Stats */}
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-red-500/20 mb-2">
            <div className="font-medium text-red-400">Administrator</div>
            <div className="text-gray-400">Full System Access</div>
          </div>
        )}

        <Link
          href="/dashboard/admin/profile"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-400 hover:bg-red-500/10 hover:text-red-300 hover:border hover:border-red-500/20',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Admin Profile' : undefined}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Admin Profile</span>}
        </Link>
        
        <button
          onClick={async () => {
            if (window.confirm('Are you sure you want to logout?')) {
              setIsLoggingOut(true);
              await logoutUser();
            }
          }}
          disabled={isLoggingOut}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            isLoggingOut
              ? 'text-gray-600 cursor-not-allowed opacity-50'
              : 'text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border hover:border-red-500/20',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? (isLoggingOut ? 'Logging out...' : 'Logout') : undefined}
        >
          <LogOut className={clsx('w-5 h-5 flex-shrink-0', isLoggingOut && 'animate-pulse')} />
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          )}
        </button>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 w-6 h-6 bg-[#1a0f0f] border border-red-500/30 rounded-full flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        aria-label={isCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}