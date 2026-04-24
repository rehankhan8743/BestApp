import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  AlertTriangle, CheckCircle, Clock, Activity, MessageSquare,
  Ban, UserCheck, Shield, Eye, TrendingUp, Zap
} from 'lucide-react';

const ModeratorDashboard = () => {
  const { get, put, del, post } = useApi();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [threads, setThreads] = useState([]);
  const [users, setUsers] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      if (activeTab === 'reports') {
        const res = await get('/admin/reports?status=pending&limit=50');
        if (res?.success) setReports(res.data || []);
      } else if (activeTab === 'threads') {
        const res = await get('/admin/threads?limit=50');
        if (res?.success) setThreads(res.data || []);
      } else if (activeTab === 'users') {
        const res = await get('/admin/users?limit=50&role=user');
        if (res?.success) setUsers(res.data || []);
      } else if (activeTab === 'activity') {
        const res = await get('/admin/activity?limit=30');
        if (res?.success) setActivityLog(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, action) => {
    if (!confirm(`${action} this report?`)) return;
    try {
      const res = await put(`/admin/reports/${reportId}`, { status: action === 'approve' ? 'resolved' : 'rejected' });
      if (res?.success) {
        setReports(reports.filter(r => r._id !== reportId));
        alert(`Report ${action === 'approve' ? 'resolved' : 'rejected'}`);
      }
    } catch (error) {
      alert('Failed to process report');
    }
  };

  const handleBanUser = async (userId, username) => {
    if (!confirm(`Ban user ${username}?`)) return;
    try {
      const res = await put(`/admin/users/${userId}/ban`, { reason: 'Moderator action' });
      if (res?.success) {
        setUsers(users.map(u => u._id === userId ? {...u, isBanned: true} : u));
        alert('User banned');
      }
    } catch (error) {
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId, username) => {
    if (!confirm(`Unban user ${username}?`)) return;
    try {
      const res = await put(`/admin/users/${userId}/unban`);
      if (res?.success) {
        setUsers(users.map(u => u._id === userId ? {...u, isBanned: false} : u));
        alert('User unbanned');
      }
    } catch (error) {
      alert('Failed to unban user');
    }
  };

  const handlePinThread = async (threadId) => {
    try {
      const res = await put(`/admin/threads/${threadId}/pin`);
      if (res?.success) {
        setThreads(threads.map(t => t._id === threadId ? {...t, pinned: !t.pinned} : t));
        alert(res.message);
      }
    } catch (error) {
      alert('Failed to pin thread');
    }
  };

  const handleLockThread = async (threadId) => {
    try {
      const res = await put(`/admin/threads/${threadId}/lock`);
      if (res?.success) {
        setThreads(threads.map(t => t._id === threadId ? {...t, locked: !t.locked} : t));
        alert(res.message);
      }
    } catch (error) {
      alert('Failed to lock thread');
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!confirm('Delete this thread and all its posts?')) return;
    try {
      const res = await del(`/admin/threads/${threadId}`);
      if (res?.success) {
        setThreads(threads.filter(t => t._id !== threadId));
        alert('Thread deleted');
      }
    } catch (error) {
      alert('Failed to delete thread');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await del(`/admin/posts/${postId}`);
      if (res?.success) {
        alert('Post deleted');
        loadDashboard();
      }
    } catch (error) {
      alert('Failed to delete post');
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getReportTypeIcon = (type) => {
    switch(type) {
      case 'spam': return '🗑️';
      case 'harassment': return '⚠️';
      case 'inappropriate': return '🚫';
      case 'copyright': return '©️';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Shield className="w-8 h-8" />
                Moderator Dashboard
              </h1>
              <p className="text-blue-100 mt-1">Manage reports, threads, and community</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{user?.username}</p>
              <p className="text-blue-200 text-sm">Moderator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              Reports ({reports.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('threads')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'threads'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Threads
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <UserCheck className="w-5 h-5" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-3 font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Activity className="w-5 h-5" />
              Activity
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Pending Reports</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">All Clear!</h3>
                <p className="text-gray-500">No pending reports to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getReportTypeIcon(report.type)}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(report.priority)}`}>
                            {report.priority}
                          </span>
                          <span className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{report.reason}</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p><strong>Reported by:</strong> {report.reportedBy?.username || 'Unknown'}</p>
                          <p><strong>Content:</strong> {report.content?.title || report.content?.content || 'N/A'}</p>
                          <p><strong>Type:</strong> {report.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleResolveReport(report._id, 'approve')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve
                        </button>
                        <button
                          onClick={() => handleResolveReport(report._id, 'reject')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Threads Tab */}
        {activeTab === 'threads' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Manage Threads</h2>
              <input
                type="text"
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thread</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {threads.map((thread) => (
                    <tr key={thread._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{thread.title}</p>
                          <p className="text-sm text-gray-500">{new Date(thread.createdAt).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{thread.author?.username || 'Deleted'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {thread.pinned && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">📌 Pinned</span>
                          )}
                          {thread.locked && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">🔒 Locked</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePinThread(thread._id)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              thread.pinned
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {thread.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            onClick={() => handleLockThread(thread._id)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                              thread.locked
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            }`}
                          >
                            {thread.locked ? 'Unlock' : 'Lock'}
                          </button>
                          <button
                            onClick={() => handleDeleteThread(thread._id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                          >
                            Delete
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

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reputation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{user.username}</p>
                            <p className="text-sm text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700">{user.reputation || 0} pts</span>
                      </td>
                      <td className="px-6 py-4">
                        {user.isBanned ? (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                            <Ban className="w-3 h-3" /> Banned
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {user.isBanned ? (
                            <button
                              onClick={() => handleUnbanUser(user._id, user.username)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(user._id, user.username)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                            >
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activity</h2>
            <div className="bg-white rounded-xl shadow-sm">
              <div className="divide-y divide-gray-200">
                {activityLog.map((activity) => (
                  <div key={activity._id} className="p-4 hover:bg-gray-50 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800">
                        <strong>{activity.user?.username || 'System'}</strong> {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">{activity.details}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(activity.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorDashboard;
