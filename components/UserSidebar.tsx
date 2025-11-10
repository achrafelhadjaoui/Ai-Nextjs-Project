'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  HelpCircle,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import clsx from 'clsx';
import { useI18n } from '@/providers/i18n-provider';
import { useSettings } from '@/providers/settings-provider';
import { useFeatures } from '@/providers/feature-provider';
import { logoutUser } from '@/lib/api/logout';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLogout } from '@/lib/hooks/useLogout';
import { showConfirm } from '@/components/ui/ToastNotification';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  featureKey?: string; // Optional feature key for feature toggle
}

export default function UserSidebar() {
  const { isCollapsed, toggleSidebar, isMobileMenuOpen, setIsMobileMenuOpen, isMobile, isTablet, isDesktop } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();
  const { get } = useSettings();
  const { logout } = useLogout();
  const { hasFeatureAccess } = useFeatures();

  // User-specific navigation items
  const userNavItems: NavItem[] = [
    {
      name: t('sidebar.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Your workspace'
    },
    {
      name: 'Feature Requests',
      href: '/feature-requests',
      icon: Lightbulb,
      description: 'Suggest features',
      featureKey: 'feature-requests'
    },
    {
      name: t('sidebar.support'),
      href: '/support',
      icon: HelpCircle,
      description: 'Get help'
    },
    {
      name: t('sidebar.panel'),
      href: '/panel',
      icon: Settings,
      description: 'Settings'
    },
  ];

  // Filter nav items based on feature access
  const visibleNavItems = userNavItems.filter((item) => {
    // If no featureKey, always show
    if (!item.featureKey) return true;
    // Check if user has access to the feature
    return hasFeatureAccess(item.featureKey);
  });

  return (
    <>
      {/* Mobile/Tablet overlay */}
      {(isMobile || isTablet) && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen bg-gradient-to-b from-[#111111] to-[#0a0a0a] border-r border-blue-500/20 transition-all duration-300 ease-in-out flex flex-col z-40',
          {
            // Desktop behavior (>= 1024px)
            'lg:w-20': isCollapsed && isDesktop,
            'lg:w-64': !isCollapsed && isDesktop,
            // Tablet behavior (768px - 1024px)
            'md:w-56 lg:w-auto': isTablet,
            'md:-translate-x-full': isTablet && !isMobileMenuOpen,
            'md:translate-x-0': isTablet && isMobileMenuOpen,
            // Mobile behavior (< 768px)
            'w-64': isMobile,
            '-translate-x-full': isMobile && !isMobileMenuOpen,
            'translate-x-0': isMobile && isMobileMenuOpen,
          }
        )}
      >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-blue-500/20 px-4 bg-[#111111]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {get('app.name', 'Farisly AI')}
            </div>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
              User
            </span>
          </div>
        ) : (
          <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {get('app.name', 'Farisly AI').charAt(0)}
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                  : 'text-gray-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border hover:border-blue-500/20',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? `${item.name} - ${item.description}` : undefined}
            >
              <Icon className={clsx(
                "w-5 h-5 flex-shrink-0 transition-transform",
                isActive && "scale-110"
              )} />
              
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.description}</span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Profile & Logout */}
      <div className="border-t border-blue-500/20 px-3 py-4 space-y-2 bg-[#111111]">
        <Link
          href="/profile"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border hover:border-blue-500/20',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Profile & Settings' : undefined}
        >
          <User className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Profile</span>}
        </Link>
        
        <button
          onClick={() => {
            showConfirm(
              'Are you sure you want to logout?',
              async () => {
                setIsLoggingOut(true);
                await logout();
              }
            );
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

      {/* Collapse Toggle Button - Hidden on Mobile/Tablet */}
      {isDesktop && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 bg-[#111111] border border-blue-500/30 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
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