'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Search, Edit, Trash2, X, Tag } from 'lucide-react';
import { toast } from 'react-toastify';

interface SavedReply {
  _id: string;
  title: string;
  content: string;
  category: string;
  keywords?: string[];
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function SavedRepliesPage() {
  const [savedReplies, setSavedReplies] = useState<SavedReply[]>([]);
  const [filteredReplies, setFilteredReplies] = useState<SavedReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingReply, setEditingReply] = useState<SavedReply | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    keywords: [] as string[]
  });
  const [keywordInput, setKeywordInput] = useState('');

  // Fetch saved replies
  useEffect(() => {
    fetchSavedReplies();
  }, []);

  // Filter replies based on search and category
  useEffect(() => {
    let filtered = savedReplies;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(reply => reply.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reply =>
        reply.title.toLowerCase().includes(query) ||
        reply.content.toLowerCase().includes(query) ||
        reply.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    setFilteredReplies(filtered);
  }, [savedReplies, searchQuery, selectedCategory]);

  const fetchSavedReplies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-replies');
      const data = await response.json();

      if (data.success) {
        setSavedReplies(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch saved replies');
      }
    } catch (error) {
      console.error('Error fetching saved replies:', error);
      toast.error('Failed to fetch saved replies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (reply?: SavedReply) => {
    if (reply) {
      setEditingReply(reply);
      setFormData({
        title: reply.title,
        content: reply.content,
        category: reply.category,
        keywords: reply.keywords || []
      });
    } else {
      setEditingReply(null);
      setFormData({
        title: '',
        content: '',
        category: 'General',
        keywords: []
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReply(null);
    setFormData({ title: '', content: '', category: 'General', keywords: [] });
    setKeywordInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const url = editingReply ? '/api/saved-replies' : '/api/saved-replies';
      const method = editingReply ? 'PATCH' : 'POST';
      const body = editingReply
        ? { id: editingReply._id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || `Saved reply ${editingReply ? 'updated' : 'created'} successfully`);
        handleCloseModal();
        fetchSavedReplies();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving reply:', error);
      toast.error('Failed to save reply');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reply?')) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-replies?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Saved reply deleted successfully');
        fetchSavedReplies();
      } else {
        toast.error(data.message || 'Failed to delete reply');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('Failed to delete reply');
    }
  };

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim().toLowerCase();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const categories = ['All', ...Array.from(new Set(savedReplies.map(r => r.category)))];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-white">Loading saved replies...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Saved Replies</h1>
            <p className="text-gray-400">Manage your quick reply templates</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Reply
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search saved replies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-700"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-white text-black'
                    : 'bg-[#111111] text-gray-400 border border-gray-800 hover:border-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Replies List */}
        {filteredReplies.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No saved replies found</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Reply
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReplies.map((reply) => (
              <div
                key={reply._id}
                className="bg-[#111111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">{reply.title}</h3>
                      <span className="px-2 py-1 bg-white/5 text-gray-400 text-xs rounded">
                        {reply.category}
                      </span>
                      {reply.usageCount > 0 && (
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded">
                          Used {reply.usageCount}x
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{reply.content}</p>
                    {reply.keywords && reply.keywords.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {reply.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 text-gray-500 text-xs rounded"
                          >
                            <Tag className="w-3 h-3" />
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleOpenModal(reply)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(reply._id)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingReply ? 'Edit Reply' : 'New Reply'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Welcome Message"
                    maxLength={100}
                    required
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Content *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your reply message..."
                    maxLength={5000}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.content.length}/5000</p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-gray-700"
                  >
                    <option value="General">General</option>
                    <option value="Support">Support</option>
                    <option value="Sales">Sales</option>
                    <option value="Technical">Technical</option>
                    <option value="Greeting">Greeting</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Keywords (Optional)
                  </label>
                  <div className="min-h-[60px] p-3 bg-[#0a0a0a] border border-gray-800 rounded-lg">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 border border-gray-600 rounded-full text-white text-sm"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      onBlur={() => {
                        if (keywordInput.trim()) {
                          handleAddKeyword();
                        }
                      }}
                      placeholder="Type keyword and press Enter..."
                      className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:outline-none text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Keywords help you find this reply faster</p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    {editingReply ? 'Update Reply' : 'Create Reply'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 bg-white/5 border border-gray-700 text-white rounded-lg font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
