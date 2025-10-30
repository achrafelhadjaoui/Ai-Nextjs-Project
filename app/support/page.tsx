'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { Mail, MessageCircle, FileText, ExternalLink } from 'lucide-react';
import { useI18n } from '@/providers/i18n-provider'; // Add this import

export default function SupportPage() {
  const { t } = useI18n(); // Add this hook call

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('support.headerTitle')}</h1>
          <p className="text-gray-400">{t('support.headerSubtitle')}</p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('support.emailSupport.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('support.emailSupport.description')}
            </p>
            <button className="inline-flex items-center gap-2 text-sm text-white hover:text-gray-300 transition-colors">
              {t('support.emailSupport.button')}
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors cursor-pointer">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t('support.liveChat.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('support.liveChat.description')}
            </p>
            <button className="inline-flex items-center gap-2 text-sm text-white hover:text-gray-300 transition-colors">
              {t('support.liveChat.button')}
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-white" />
            <h3 className="text-lg font-semibold text-white">{t('support.documentation.title')}</h3>
          </div>
          <div className="space-y-4">
            {[
              t('support.documentation.items.gettingStarted'),
              t('support.documentation.items.creatingReplies'),
              t('support.documentation.items.installingExtension'),
              t('support.documentation.items.managingAccount'),
              t('support.documentation.items.apiDocs'),
            ].map((item, index) => (
              <a
                key={index}
                href="#"
                className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm">{item}</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}