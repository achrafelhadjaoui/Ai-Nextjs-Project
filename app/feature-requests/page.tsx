'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Lightbulb, ThumbsUp, Plus, Filter, Search, MessageSquare, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';

interface FeatureRequest {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  votes: number;
  votedBy: string[];
  userName: string;
  userEmail: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FeatureRequestsPage() {
  const { user } = useAuth();
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [votingInProgress, setVotingInProgress] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFeatureRequests();
  }, []);

  const fetchFeatureRequests = async () => {
    try {
      const res = await fetch('/api/feature-requests');
      const data = await res.json();

      if (data.success) {
        setFeatureRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching feature requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (id: string) => {
    if (!user) return;

    setVotingInProgress(id);
    try {
      const res = await fetch(`/api/feature-requests/${id}/vote`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        // Update the local state
        setFeatureRequests((prev) =>
          prev.map((req) =>
            req._id === id
              ? {
                  ...req,
                  votes: data.data.votes,
                  votedBy: data.data.hasVoted
                    ? [...req.votedBy, user.id]
                    : req.votedBy.filter((userId) => userId !== user.id),
                }
              : req
          )
        );
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVotingInProgress(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title || !formData.description) {
      setFormError('Please fill in all fields');
      return;
    }

    if (formData.title.length < 5) {
      setFormError('Title must be at least 5 characters');
      return;
    }

    if (formData.description.length < 10) {
      setFormError('Description must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setFeatureRequests([data.data, ...featureRequests]);
        setFormData({ title: '', description: '' });
        setIsModalOpen(false);
      } else {
        setFormError(data.message || 'Failed to create feature request');
      }
    } catch (error) {
      setFormError('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and search
  const filteredRequests = featureRequests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        icon: <Clock className="w-3 h-3" />,
        text: 'Pending',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      },
      'in-progress': {
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        text: 'In Progress',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      },
      completed: {
        icon: <CheckCircle2 className="w-3 h-3" />,
        text: 'Completed',
        color: 'bg-green-500/20 text-green-400 border-green-500/30'
      },
      rejected: {
        icon: <XCircle className="w-3 h-3" />,
        text: 'Rejected',
        color: 'bg-red-500/20 text-red-400 border-red-500/30'
      }
    };

    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Feature Requests</h1>
              <p className="text-gray-400">Suggest new features or vote on existing ones</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search feature requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-10 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none cursor-pointer min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Add Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Request Feature
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Requests</div>
            <div className="text-2xl font-bold text-white">{featureRequests.length}</div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">
              {featureRequests.filter((r) => r.status === 'pending').length}
            </div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">In Progress</div>
            <div className="text-2xl font-bold text-blue-400">
              {featureRequests.filter((r) => r.status === 'in-progress').length}
            </div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-400">
              {featureRequests.filter((r) => r.status === 'completed').length}
            </div>
          </div>
        </div>

        {/* Feature Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-12 text-center">
            <Lightbulb className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No feature requests found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to suggest a new feature!'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
              >
                Request Feature
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const hasVoted = user && request.votedBy.includes(user.id);
              const isVoting = votingInProgress === request._id;

              return (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Vote Button */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleVote(request._id)}
                        disabled={!user || isVoting}
                        className={`p-2 rounded-lg border transition-all ${
                          hasVoted
                            ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                            : 'bg-[#0a0a0a] border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isVoting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ThumbsUp className={`w-5 h-5 ${hasVoted ? 'fill-current' : ''}`} />
                        )}
                      </button>
                      <span className="text-sm font-bold text-white">{request.votes}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-lg font-semibold text-white">{request.title}</h3>
                        {getStatusBadge(request.status)}
                      </div>

                      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                        {request.description}
                      </p>

                      {request.adminResponse && (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400 text-sm font-medium">Admin Response</span>
                          </div>
                          <p className="text-gray-300 text-sm">{request.adminResponse}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>By {request.userName}</span>
                        <span>•</span>
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add Feature Request Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setIsModalOpen(false)}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="border-b border-gray-800 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Request a New Feature</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Share your ideas to help us improve Farisly AI
                    </p>
                  </div>

                  {/* Modal Body */}
                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {formError && (
                      <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {formError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                        Feature Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Add dark mode support"
                        maxLength={200}
                        className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your feature request in detail..."
                        rows={6}
                        maxLength={2000}
                        className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">{formData.description.length}/2000 characters</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
