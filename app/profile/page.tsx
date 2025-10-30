'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { User, Mail, Calendar, Edit } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider'; // Add this import

export default function ProfilePage() {
  const { t } = useI18n(); // Add this hook call

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('profile.headerTitle')}</h1>
          <p className="text-gray-400">{t('profile.headerSubtitle')}</p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{t('profile.userName')}</h2>
                  <p className="text-gray-400 text-sm">{t('profile.memberStatus')}</p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-gray-700 text-white rounded-lg text-sm hover:bg-white/10 transition-colors">
                  <Edit className="w-4 h-4" />
                  {t('profile.editProfile')}
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">{t('profile.userEmail')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">{t('profile.memberSince')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-6">{t('profile.accountDetails')}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('profile.firstName')}</label>
                <input
                  type="text"
                  defaultValue={t('profile.firstNameValue')}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">{t('profile.lastName')}</label>
                <input
                  type="text"
                  defaultValue={t('profile.lastNameValue')}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('profile.emailAddress')}</label>
              <input
                type="email"
                defaultValue={t('profile.userEmail')}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">{t('profile.bio')}</label>
              <textarea
                rows={4}
                placeholder={t('profile.bioPlaceholder')}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-700 resize-none"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="px-6 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
              {t('profile.saveChanges')}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-[#111111] border border-red-900/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4">{t('profile.dangerZone')}</h3>
          <p className="text-gray-400 text-sm mb-4">
            {t('profile.dangerZoneWarning')}
          </p>
          <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
            {t('profile.deleteAccount')}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}