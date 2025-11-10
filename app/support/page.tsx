"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "react-toastify";
import {
  HelpCircle,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  AlertCircle,
  Mail,
  FileText,
  Paperclip,
  X,
} from "lucide-react";

interface SupportTicket {
  _id: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  adminResponse?: string;
  conversationHistory?: {
    message: string;
    sender: "user" | "admin";
    senderName: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // New ticket form
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    category: "general",
    priority: "medium",
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const url = `/api/support${filterStatus !== "all" ? `?status=${filterStatus}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setTickets(data.data);
      } else {
        toast.error(data.message || "Failed to fetch tickets");
      }
    } catch (error) {
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "support-tickets");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setAttachments([...attachments, data.data.url]);
        toast.success("File uploaded successfully!");
      } else {
        toast.error(data.message || "Failed to upload file");
      }
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachment = (url: string) => {
    setAttachments(attachments.filter((a) => a !== url));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachments,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Support ticket submitted successfully!");
        setShowNewTicketModal(false);
        setFormData({
          subject: "",
          message: "",
          category: "general",
          priority: "medium",
        });
        setAttachments([]);
        fetchTickets();
      } else {
        toast.error(data.message || "Failed to submit ticket");
      }
    } catch (error) {
      toast.error("Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; text: string; color: string }> = {
      open: {
        icon: <Clock className="w-3 h-3" />,
        text: "Open",
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      },
      "in-progress": {
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        text: "In Progress",
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      },
      "waiting-response": {
        icon: <AlertCircle className="w-3 h-3" />,
        text: "Waiting Response",
        color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      },
      resolved: {
        icon: <CheckCircle className="w-3 h-3" />,
        text: "Resolved",
        color: "bg-green-500/20 text-green-400 border-green-500/30",
      },
      closed: {
        icon: <XCircle className="w-3 h-3" />,
        text: "Closed",
        color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      },
    };

    const badge = badges[status] || badges.open;
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Support</h1>
                <p className="text-sm md:text-base text-gray-400">
                  Get help and submit support tickets
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Ticket
            </button>
          </div>
        </div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#111111] rounded-lg border border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-white">Email Support</h3>
            </div>
            <p className="text-sm text-gray-400 mb-2">Contact us directly via email</p>
            <a href="mailto:support@farisly.ai" className="text-sm text-green-400 hover:text-green-300">
              support@farisly.ai
            </a>
          </div>
          <div className="bg-[#111111] rounded-lg border border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Documentation</h3>
            </div>
            <p className="text-sm text-gray-400 mb-2">Browse our help articles</p>
            <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
              View Docs →
            </a>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
          >
            <option value="all">All Tickets</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="waiting-response">Waiting Response</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-[#111111] rounded-lg border border-gray-800 p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Support Tickets</h3>
            <p className="text-gray-400 mb-4">
              You haven't submitted any support tickets yet.
            </p>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all"
            >
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className="bg-[#111111] rounded-lg border border-gray-800 p-4 hover:border-green-500/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{ticket.subject}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{ticket.message}</p>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="capitalize">{ticket.category.replace("-", " ")}</span>
                  <span>•</span>
                  <span className="capitalize">Priority: {ticket.priority}</span>
                  <span>•</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                {ticket.adminResponse && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-xs text-green-400 mb-1">✓ Admin Response</p>
                    <p className="text-sm text-gray-300 line-clamp-2">{ticket.adminResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* New Ticket Modal */}
        {showNewTicketModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-4">New Support Ticket</h2>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    maxLength={200}
                    className="w-full px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="bug-report">Bug Report</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-green-500 transition-colors"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your issue in detail..."
                    rows={6}
                    maxLength={5000}
                    className="w-full px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.message.length}/5000 characters</p>
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Attachments (Optional)
                  </label>
                  <div className="space-y-2">
                    {/* File Upload Button */}
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#111111] border border-gray-800 rounded-lg text-gray-300 hover:border-green-500/50 transition-colors">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm">
                        {uploadingFile ? "Uploading..." : "Attach File"}
                      </span>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadingFile || attachments.length >= 3}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      Max 3 files, 10MB each. Supported: Images, PDF, Word, Excel, Text
                    </p>

                    {/* Attached Files List */}
                    {attachments.length > 0 && (
                      <div className="space-y-2 mt-3">
                        {attachments.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/30 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-green-400" />
                              <span className="text-sm text-gray-300">
                                {url.split("/").pop()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(url)}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Ticket
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="capitalize">{selectedTicket.category.replace("-", " ")}</span>
                    <span>•</span>
                    <span>Priority: {selectedTicket.priority}</span>
                    <span>•</span>
                    <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedTicket.status)}
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Conversation History */}
              <div className="space-y-4">
                {selectedTicket.conversationHistory && selectedTicket.conversationHistory.length > 0 ? (
                  selectedTicket.conversationHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        msg.sender === "admin"
                          ? "bg-green-500/10 border border-green-500/30"
                          : "bg-[#111111] border border-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{msg.senderName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-[#111111] rounded-lg border border-gray-800">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-full px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
