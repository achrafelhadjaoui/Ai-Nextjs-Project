"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { toast } from "react-toastify";
import {
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  MessageSquare,
  Filter,
  Search,
  Send,
  Trash2,
  Eye,
  AlertTriangle,
} from "lucide-react";

interface SupportTicket {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  adminResponse?: string;
  adminNotes?: string;
  respondedBy?: string;
  conversationHistory?: {
    message: string;
    sender: "user" | "admin";
    senderName: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  waitingResponse: number;
  resolved: number;
  closed: number;
  urgent: number;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Response form
  const [responseData, setResponseData] = useState({
    message: "",
    status: "",
    priority: "",
    adminNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterPriority, filterCategory]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterPriority !== "all") params.append("priority", filterPriority);
      if (filterCategory !== "all") params.append("category", filterCategory);

      const url = `/api/admin/support${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setTickets(data.data);
        setStats(data.stats);
      } else {
        toast.error(data.message || "Failed to fetch tickets");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTicket) return;

    if (!responseData.message.trim() && !responseData.status && !responseData.priority) {
      toast.error("Please provide a message or update status/priority");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/support/${selectedTicket._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: responseData.message.trim() || undefined,
          status: responseData.status || undefined,
          priority: responseData.priority || undefined,
          adminNotes: responseData.adminNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Ticket updated successfully!");
        setResponseData({
          message: "",
          status: "",
          priority: "",
          adminNotes: "",
        });
        fetchTickets();
        setSelectedTicket(data.data);
      } else {
        toast.error(data.message || "Failed to update ticket");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this support ticket?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Ticket deleted successfully!");
        fetchTickets();
        setSelectedTicket(null);
      } else {
        toast.error(data.message || "Failed to delete ticket");
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Failed to delete ticket");
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

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { color: string }> = {
      low: { color: "bg-gray-500/20 text-gray-400" },
      medium: { color: "bg-blue-500/20 text-blue-400" },
      high: { color: "bg-orange-500/20 text-orange-400" },
      urgent: { color: "bg-red-500/20 text-red-400" },
    };

    const badge = badges[priority] || badges.medium;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Support Tickets</h1>
              <p className="text-sm md:text-base text-gray-400">
                Manage and respond to user support requests
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-[#111111] rounded-lg border border-gray-800 p-4">
              <p className="text-gray-400 text-xs mb-1">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-[#111111] rounded-lg border border-blue-800/30 p-4">
              <p className="text-gray-400 text-xs mb-1">Open</p>
              <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
            </div>
            <div className="bg-[#111111] rounded-lg border border-yellow-800/30 p-4">
              <p className="text-gray-400 text-xs mb-1">In Progress</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
            </div>
            <div className="bg-[#111111] rounded-lg border border-orange-800/30 p-4">
              <p className="text-gray-400 text-xs mb-1">Waiting</p>
              <p className="text-2xl font-bold text-orange-400">{stats.waitingResponse}</p>
            </div>
            <div className="bg-[#111111] rounded-lg border border-green-800/30 p-4">
              <p className="text-gray-400 text-xs mb-1">Resolved</p>
              <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
            </div>
            <div className="bg-[#111111] rounded-lg border border-gray-800 p-4">
              <p className="text-gray-400 text-xs mb-1">Closed</p>
              <p className="text-2xl font-bold text-gray-400">{stats.closed}</p>
            </div>
            <div className="bg-[#111111] rounded-lg border border-red-800/30 p-4">
              <p className="text-gray-400 text-xs mb-1">Urgent</p>
              <p className="text-2xl font-bold text-red-400">{stats.urgent}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="waiting-response">Waiting Response</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="feature-request">Feature Request</option>
            <option value="bug-report">Bug Report</option>
            <option value="general">General</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-[#111111] rounded-lg border border-gray-800 p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Support Tickets</h3>
            <p className="text-gray-400">No tickets match your current filters.</p>
          </div>
        ) : (
          <div className="bg-[#111111] rounded-lg border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#1a1a1a] border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{ticket.userName}</p>
                          <p className="text-sm text-gray-400">{ticket.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-white line-clamp-1">{ticket.subject}</p>
                        <p className="text-sm text-gray-400 line-clamp-1">{ticket.message}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-300 capitalize">
                          {ticket.category.replace("-", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
                      <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-400">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(ticket.createdAt).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setResponseData({
                                message: "",
                                status: ticket.status,
                                priority: ticket.priority,
                                adminNotes: ticket.adminNotes || "",
                              });
                            }}
                            className="p-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors"
                            title="View & Respond"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket._id)}
                            className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ticket Detail & Response Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedTicket.subject}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                    <span>{selectedTicket.userName}</span>
                    <span>•</span>
                    <span>{selectedTicket.userEmail}</span>
                    <span>•</span>
                    <span className="capitalize">{selectedTicket.category.replace("-", " ")}</span>
                    <span>•</span>
                    <span>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                    {selectedTicket.priority === "urgent" && (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <AlertTriangle className="w-3 h-3" />
                        Requires immediate attention
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Conversation History */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Conversation</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {selectedTicket.conversationHistory && selectedTicket.conversationHistory.length > 0 ? (
                    selectedTicket.conversationHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          msg.sender === "admin"
                            ? "bg-purple-500/10 border border-purple-500/30"
                            : "bg-[#111111] border border-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white flex items-center gap-2">
                            {msg.senderName}
                            {msg.sender === "admin" && (
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                Admin
                              </span>
                            )}
                          </span>
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
              </div>

              {/* Admin Notes (if any) */}
              {selectedTicket.adminNotes && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-400 mb-1">Internal Notes (Not visible to user)</p>
                  <p className="text-sm text-gray-300">{selectedTicket.adminNotes}</p>
                </div>
              )}

              {/* Response Form */}
              <form onSubmit={handleRespondToTicket} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Update Status
                    </label>
                    <select
                      value={responseData.status}
                      onChange={(e) => setResponseData({ ...responseData, status: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">Keep current</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="waiting-response">Waiting Response</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Update Priority
                    </label>
                    <select
                      value={responseData.priority}
                      onChange={(e) => setResponseData({ ...responseData, priority: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="">Keep current</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Response to User
                  </label>
                  <textarea
                    value={responseData.message}
                    onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                    placeholder="Type your response to the user..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Internal Notes (Not visible to user)
                  </label>
                  <textarea
                    value={responseData.adminNotes}
                    onChange={(e) => setResponseData({ ...responseData, adminNotes: e.target.value })}
                    placeholder="Add internal notes for other admins..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-[#111111] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Update Ticket
                      </>
                    )}
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
