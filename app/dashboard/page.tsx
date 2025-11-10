'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Download, ArrowRight } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider';
import { useSettings } from '@/providers/settings-provider';
import { useSessionMonitor } from '@/lib/hooks/useSessionMonitor';

interface DashboardStats {
  totalReplies: number;
  activeReplies: number;
  totalUsages: number;
}

interface RecentActivity {
  id: string;
  title: string;
  usageCount: number;
  timestamp: string;
  action: 'created' | 'used' | 'updated';
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { get } = useSettings();
  const router = useRouter();
  const [extensionInstalled, setExtensionInstalled] = useState<boolean | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Monitor session for role changes and deletions
  useSessionMonitor();

  // Redirect to onboarding if not completed
  useEffect(() => {
    const onboardingDone = localStorage.getItem('onboarding_done');
    if (!onboardingDone) {
      router.push('/onboarding');
    }
  }, [router]);

  // Fetch dashboard stats on mount
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data.stats);
            setRecentActivity(data.data.recentActivity);
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Real-time extension status via SSE - no polling!
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectStatusStream = () => {
      try {
        eventSource = new EventSource('/api/extension/status/stream');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'connected') {
            } else if (data.type === 'status') {
              setExtensionInstalled(data.data.extensionInstalled);
            }
          } catch (error) {
          }
        };

        eventSource.onerror = (error) => {
          eventSource?.close();
          // Reconnect after 5 seconds
          setTimeout(connectStatusStream, 5000);
        };
      } catch (error) {
      }
    };

    connectStatusStream();

    return () => {
      eventSource?.close();
    };
  }, []);

  return (
    <>
      <DashboardLayout>
        <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {get('content.dashboard_title', t('dashboard.headerTitle'))}
          </h1>
          <p className="text-gray-400">
            {get('content.dashboard_subtitle', t('dashboard.headerSubtitle'))}
          </p>
        </div>

        {/* Extension Install Card - Only show if extension is NOT installed */}
        {extensionInstalled === false && (
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 mb-8 transition-all duration-300 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {get('content.extension_title', t('dashboard.extensionTitle'))}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {get('content.extension_subtitle', t('dashboard.extensionSubtitle'))}
                    </p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {get('content.extension_description', t('dashboard.extensionDescription'))}
                </p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
                  {get('content.extension_button', t('dashboard.extensionButton'))}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Saved Replies</div>
            <div className="text-3xl font-bold text-white">
              {loading ? (
                <div className="animate-pulse bg-gray-700 h-9 w-16 rounded"></div>
              ) : (
                stats?.totalReplies ?? 0
              )}
            </div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Active Replies</div>
            <div className="text-3xl font-bold text-white">
              {loading ? (
                <div className="animate-pulse bg-gray-700 h-9 w-16 rounded"></div>
              ) : (
                stats?.activeReplies ?? 0
              )}
            </div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">Total Usages</div>
            <div className="text-3xl font-bold text-white">
              {loading ? (
                <div className="animate-pulse bg-gray-700 h-9 w-16 rounded"></div>
              ) : (
                stats?.totalUsages ?? 0
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {loading ? (
              // Loading skeleton
              [1, 2, 3].map((item) => (
                <div key={item} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              ))
            ) : recentActivity.length > 0 ? (
              // Real activity data
              recentActivity.map((activity) => {
                const timeAgo = getTimeAgo(new Date(activity.timestamp));
                const actionText =
                  activity.action === 'created' ? 'Reply created' :
                  activity.action === 'used' ? `Used ${activity.usageCount} times` :
                  'Reply updated';

                return (
                  <div key={activity.id} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{activity.title}</div>
                      <div className="text-xs text-gray-400">{actionText} • {timeAgo}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              // No activity yet
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs mt-1">Create your first quick reply to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
    </>
  );
}

function MessageSquare({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}