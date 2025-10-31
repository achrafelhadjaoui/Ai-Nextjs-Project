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
  Lightbulb,
} from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '@/providers/i18n-provider';
import { logoutUser } from '@/lib/api/logout';
import { useSidebar } from '@/contexts/SidebarContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  color?: string;
}

export default function AdminSidebar() {
  const { isCollapsed, toggleSidebar, isMobileMenuOpen, setIsMobileMenuOpen, isMobile } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();

  // Admin-specific navigation items with matching colors from dashboard
  const adminNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      color: 'blue'
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      color: 'blue'
    },
    {
      name: 'Feature Requests',
      href: '/admin/feature-requests',
      icon: Lightbulb,
      color: 'purple'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart,
      color: 'green'
    },
    {
      name: 'System Health',
      href: '/admin/health',
      icon: Activity,
      color: 'yellow'
    },
    {
      name: 'Database',
      href: '/admin/database',
      icon: Database,
      color: 'indigo'
    },
    {
      name: 'Security',
      href: '/admin/security',
      icon: Shield,
      color: 'red'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      color: 'purple'
    },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive
        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        : 'hover:bg-blue-500/10 hover:text-blue-300',
      green: isActive
        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
        : 'hover:bg-green-500/10 hover:text-green-300',
      purple: isActive
        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
        : 'hover:bg-purple-500/10 hover:text-purple-300',
      red: isActive
        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
        : 'hover:bg-red-500/10 hover:text-red-300',
      yellow: isActive
        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        : 'hover:bg-yellow-500/10 hover:text-yellow-300',
      indigo: isActive
        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
        : 'hover:bg-indigo-500/10 hover:text-indigo-300',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen bg-[#0a0a0a] border-r border-gray-800 transition-all duration-300 ease-in-out flex flex-col z-40',
          {
            // Desktop behavior
            'md:w-20': isCollapsed && !isMobile,
            'md:w-64': !isCollapsed && !isMobile,
            // Mobile behavior
            'w-64': isMobile,
            '-translate-x-full': isMobile && !isMobileMenuOpen,
            'translate-x-0': isMobile && isMobileMenuOpen,
          }
        )}
      >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-gray-800 px-4 bg-[#111111]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-white">
              Farisly AI
            </div>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30 font-semibold">
              ADMIN
            </span>
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? getColorClasses(item.color || 'blue', true)
                  : `text-gray-400 ${getColorClasses(item.color || 'blue', false)} hover:border hover:border-gray-700`,
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={clsx(
                "w-5 h-5 flex-shrink-0 transition-transform",
                isActive && "scale-110"
              )} />

              {!isCollapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}

              {/* Active indicator for collapsed state */}
              {isCollapsed && isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Profile & Logout */}
      <div className="border-t border-gray-800 px-3 py-4 space-y-2 bg-[#111111]">
        {/* Admin Badge */}
        {!isCollapsed && (
          <div className="px-3 py-2 mb-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="text-xs text-gray-300 font-medium">Administrator</div>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Full system access</div>
          </div>
        )}

        <Link
          href="/admin/profile"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-400 hover:bg-gray-800 hover:text-white',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Profile' : undefined}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Profile</span>}
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

      {/* Collapse Toggle Button - Hidden on Mobile */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 bg-[#111111] border border-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shadow-lg"
          aria-label={isCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}
    </aside>
    </>
  );
}
