'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Lightbulb, ThumbsUp, Search, Filter, Edit3, Trash2, MessageSquare, Clock, CheckCircle2, XCircle, Loader2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFeatureRequests, updateFeatureRequest, deleteFeatureRequest } from '@/lib/api/featureRequests';

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

export default function AdminFeatureRequestsPage() {
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    status: 'pending' | 'in-progress' | 'completed' | 'rejected';
    adminResponse: string;
  }>({
    status: 'pending',
    adminResponse: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatureRequests();
  }, []);

  const fetchFeatureRequests = async () => {
    setLoading(true);
    try {
      const result = await getFeatureRequests();
      if (result.success) {
        setFeatureRequests(result.data);
      }
    } catch (error) {
      console.error('Error fetching feature requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request: FeatureRequest) => {
    setEditingId(request._id);
    setEditForm({
      status: request.status,
      adminResponse: request.adminResponse || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ status: 'pending', adminResponse: '' });
  };

  const handleUpdate = async (id: string) => {
    setIsUpdating(true);
    try {
      const result = await updateFeatureRequest(id, editForm);
      if (result.success) {
        setFeatureRequests((prev) =>
          prev.map((req) =>
            req._id === id ? { ...req, status: editForm.status, adminResponse: editForm.adminResponse, updatedAt: new Date().toISOString() } : req
          )
        );
        setEditingId(null);
        setEditForm({ status: 'pending', adminResponse: '' });
      }
    } catch (error) {
      console.error('Error updating feature request:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteFeatureRequest(id);
      if (result.success) {
        setFeatureRequests((prev) => prev.filter((req) => req._id !== id));
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('Error deleting feature request:', error);
    }
  };

  const filteredRequests = featureRequests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.userName.toLowerCase().includes(searchQuery.toLowerCase());
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
        icon: <Loader2 className="w-3 h-3" />,
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
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Feature Requests Management</h1>
              <p className="text-sm md:text-base text-gray-400">Manage and respond to user feature requests</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex flex-col md:flex-row lg:flex-row gap-3 md:gap-4">
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-3 md:p-4">
            <div className="text-gray-400 text-xs md:text-sm mb-1">Total Requests</div>
            <div className="text-xl md:text-2xl font-bold text-white">{featureRequests.length}</div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-3 md:p-4">
            <div className="text-gray-400 text-xs md:text-sm mb-1">Pending</div>
            <div className="text-xl md:text-2xl font-bold text-yellow-400">
              {featureRequests.filter((r) => r.status === 'pending').length}
            </div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-3 md:p-4">
            <div className="text-gray-400 text-xs md:text-sm mb-1">In Progress</div>
            <div className="text-xl md:text-2xl font-bold text-blue-400">
              {featureRequests.filter((r) => r.status === 'in-progress').length}
            </div>
          </div>
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-3 md:p-4">
            <div className="text-gray-400 text-xs md:text-sm mb-1">Completed</div>
            <div className="text-xl md:text-2xl font-bold text-green-400">
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
            <p className="text-gray-400">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No feature requests have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const isEditing = editingId === request._id;

              return (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#111111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
                >
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{request.title}</h3>
                        <p className="text-gray-400 text-sm mb-4">{request.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Status
                          </label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Admin Response
                        </label>
                        <textarea
                          value={editForm.adminResponse}
                          onChange={(e) => setEditForm({ ...editForm, adminResponse: e.target.value })}
                          placeholder="Provide feedback to the user..."
                          rows={4}
                          className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdate(request._id)}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex gap-4">
                      {/* Vote Count */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500">
                          <ThumbsUp className="w-5 h-5 text-purple-400" />
                        </div>
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

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>By {request.userName}</span>
                            <span>•</span>
                            <span>{request.userEmail}</span>
                            <span>•</span>
                            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(request)}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(request._id)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmId && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setDeleteConfirmId(null)}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-[#111111] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold text-white mb-2">Delete Feature Request</h3>
                  <p className="text-gray-400 mb-6">
                    Are you sure you want to delete this feature request? This action cannot be undone.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(deleteConfirmId)}
                      className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
