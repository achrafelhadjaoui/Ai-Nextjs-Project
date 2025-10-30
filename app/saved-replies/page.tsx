'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default function SavedRepliesPage() {
  const savedReplies = [
    { id: 1, title: 'Welcome Message', content: 'Thank you for contacting us! How can I help you today?', category: 'General' },
    { id: 2, title: 'Order Status', content: 'Let me check on your order status for you...', category: 'Support' },
    { id: 3, title: 'Refund Request', content: 'I understand you would like to request a refund...', category: 'Support' },
    { id: 4, title: 'Product Information', content: 'Here is the information about our product...', category: 'Sales' },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Saved Replies</h1>
            <p className="text-gray-400">Manage your quick reply templates</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
            <Plus className="w-4 h-4" />
            New Reply
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search saved replies..."
              className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-700"
            />
          </div>
        </div>

        {/* Replies List */}
        <div className="space-y-4">
          {savedReplies.map((reply) => (
            <div
              key={reply.id}
              className="bg-[#111111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{reply.title}</h3>
                    <span className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded">
                      {reply.category}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{reply.content}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
