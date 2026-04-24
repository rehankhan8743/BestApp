import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import {
  Users, MessageSquare, AlertTriangle, Eye, Settings, Folder, Ban, CheckCircle,
  Trash2, Edit, Search, Filter, Download, Upload, Activity, Shield, Mail,
  BarChart3, TrendingUp, Clock, Calendar, Bell, Lock, Unlock, UserCheck,
  FileText, Image, Video, Link as LinkIcon, Hash, Zap
} from 'lucide-react';

const AdminDashboard = () => {
  const { get, put, del, post } = useApi();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'BestApp Forum',
    siteDescription: 'Best community for apps, games, and more',
    maxFileSize: 100,
    avatarMaxSize: 5,
    screenshotMaxSize: 10,
    postsPerPage: 20,
    threadsPerPage: 20,
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: false,
    allowFileUploads: true,
    maxDailyPosts: 50,
    minReputationToPost: 0
  });
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'normal' });
  const [editingThread, setEditingThread] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      if (activeTab === 'dashboard') {
        const [statsRes, usersRes, reportsRes, threadsRes, activityRes] = await Promise.all([
          get('/admin/stats'),
          get('/admin/users?limit=10'),
          get('/admin/reports?limit=10'),
          get('/admin/threads?limit=5'),
          get('/admin/activity?limit=10')
        ]);
        if (statsRes?.success) setStats(statsRes.data);
        if (usersRes?.success) setUsers(usersRes.data || []);
        if (reportsRes?.success) setReports(reportsRes.data || []);
        if (threadsRes?.success) setThreads(threadsRes.data || []);
        if (activityRes?.success) setActivityLog(activityRes.data || []);
      } else if (activeTab === 'users') {
        const res = await get('/admin/users?limit=100');
        if (res?.success) setUsers(res.data || []);
      } else if (activeTab === 'reports') {
        const res = await get('/admin/reports?limit=50');
        if (res?.success) setReports(res.data || []);
      } else if (activeTab === 'categories') {
        const res = await get('/categories');
        if (res?.success) setCategories(res.data || []);
      } else if (activeTab === 'threads') {
        const res = await get('/admin/threads?limit=50');
        if (res?.success) setThreads(res.data || []);
      } else if (activeTab === 'posts') {
        const res = await get('/admin/posts?limit=50');
        if (res?.success) setPosts(res.data || []);
      } else if (activeTab === 'settings') {
        const res = await get('/admin/settings');
        if (res?.success) setSettings(res.data || settings);
      } else if (activeTab === 'announcements') {
        const res = await get('/admin/announcements');
        if (res?.success) setAnnouncements(res.data || []);
      } else if (activeTab === 'activity') {
        const res = await get('/admin/activity?limit=50');
        if (res?.success) setActivityLog(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleBulkBan = async () => {
    if (!confirm(`Ban ${selectedUsers.length} users?`)) return;
    try {
      const res = await post('/admin/users/bulk-ban', { userIds: selectedUsers });
      if (res?.success) {
        alert(`${selectedUsers.length} users banned`);
        setSelectedUsers([]);
        loadDashboard();
      }
    } catch (error) {
      alert('Failed to ban users');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedUsers.length} users permanently?`)) return;
    try {
      const res = await post('/admin/users/bulk-delete', { userIds: selectedUsers });
      if (res?.success) {
        alert(`${selectedUsers.length} users deleted`);
        setSelectedUsers([]);
        loadDashboard();
      }
    } catch (error) {
      alert('Failed to delete users');
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const res = await post('/admin/announcements', newAnnouncement);
      if (res?.success) {
        alert('Announcement created');
        setNewAnnouncement({ title: '', content: '', priority: 'normal' });
        loadDashboard();
      }
    } catch (error) {
      alert('Failed to create announcement');
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
        setPosts(posts.filter(p => p._id !== postId));
        alert('Post deleted');
      }
    } catch (error) {
      alert('Failed to delete post');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const res = await put(`/admin/users/${userId}/role`, { role: newRole });
      if (res?.success) {
        setUsers(users.map(u => u._id === userId ? {...u, role: newRole} : u));
        alert(`User role updated to ${newRole}`);
      }
    } catch (error) {
      alert('Failed to update user role');
    }
  };

  const handleRejectReport = async (reportId) => {
    try {
      const res = await put(`/admin/reports/${reportId}/reject`);
      if (res?.success) {
        setReports(reports.filter(r => r._id !== reportId));
        alert('Report rejected');
      }
    } catch (error) {
      alert('Failed to reject report');
    }
  };

  const handleSearchUsers = async () => {
    try {
      const res = await get(`/admin/users?search=${searchQuery}&role=${roleFilter}`);
      if (res?.success) setUsers(res.data || []);
    } catch (error) {
      alert('Search failed');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'admin' || user?.role === 'moderator';
    }
  };

  const handleBanUser = async (userId) => {
    if (!confirm('Ban this user?')) return;
    try {
      const res = await put(`/admin/users/${userId}/ban`);
      if (res?.success) {
        setUsers(users.map(u => u._id === userId ? {...u, isBanned: true} : u));
        alert('User banned');
      }
    } catch (error) {
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
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

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user permanently? This cannot be undone.')) return;
    try {
      const res = await del(`/admin/users/${userId}`);
      if (res?.success) {
        setUsers(users.filter(u => u._id !== userId));
        alert('User deleted');
      }
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      const res = await put(`/admin/reports/${reportId}/resolve`);
      if (res?.success) {
        setReports(reports.filter(r => r._id !== reportId));
        alert('Report resolved');
      }
    } catch (error) {
      alert('Failed to resolve report');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await put('/admin/settings', settings);
      if (res?.success) {
        alert('Settings saved');
      }
    } catch (error) {
      alert('Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
        <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
          <Eye className="w-4 h-4 mr-2" /> Dashboard
        </TabButton>
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
          <Users className="w-4 h-4 mr-2" /> Users
        </TabButton>
        <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>
          <AlertTriangle className="w-4 h-4 mr-2" /> Reports
        </TabButton>
        <TabButton active={activeTab === 'threads'} onClick={() => setActiveTab('threads')}>
          <MessageSquare className="w-4 h-4 mr-2" /> Threads
        </TabButton>
        <TabButton active={activeTab === 'posts'} onClick={() => setActiveTab('posts')}>
          <FileText className="w-4 h-4 mr-2" /> Posts
        </TabButton>
        <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')}>
          <Folder className="w-4 h-4 mr-2" /> Categories
        </TabButton>
        {isAdmin && (
          <>
            <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')}>
              <Bell className="w-4 h-4 mr-2" /> Announcements
            </TabButton>
            <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
              <Settings className="w-4 h-4 mr-2" /> Settings
            </TabButton>
          </>
        )}
        <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
          <Activity className="w-4 h-4 mr-2" /> Activity
        </TabButton>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Users className="w-6 h-6" />} title="Total Users" value={stats?.totalUsers || 0} color="bg-blue-500" trend="+12%" />
            <StatCard icon={<MessageSquare className="w-6 h-6" />} title="Total Threads" value={stats?.totalThreads || 0} color="bg-green-500" trend="+8%" />
            <StatCard icon={<MessageSquare className="w-6 h-6" />} title="Total Posts" value={stats?.totalPosts || 0} color="bg-purple-500" trend="+15%" />
            <StatCard icon={<AlertTriangle className="w-6 h-6" />} title="Pending Reports" value={stats?.pendingReports || 0} color="bg-red-500" />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard icon={<Activity className="w-6 h-6" />} title="Active Now" value={stats?.activeUsers || 0} color="bg-teal-500" />
            <StatCard icon={<TrendingUp className="w-6 h-6" />} title="Today's Posts" value={stats?.todayPosts || 0} color="bg-orange-500" />
            <StatCard icon={<Eye className="w-6 h-6" />} title="Total Views" value={stats?.totalViews || 0} color="bg-pink-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Users */}
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" /> Recent Users
                </h2>
                <button onClick={() => setActiveTab('users')} className="text-sm text-primary hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {users.length > 0 ? users.slice(0, 5).map(user => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-secondary rounded">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar || '/default-avatar.png'} alt={user.username} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                      user.role === 'moderator' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-green-500/20 text-green-500'
                    }`}>{user.role}</span>
                  </div>
                )) : <p className="text-muted-foreground">No users found</p>}
              </div>
            </div>

            {/* Recent Reports */}
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Recent Reports
                </h2>
                <button onClick={() => setActiveTab('reports')} className="text-sm text-primary hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {reports.length > 0 ? reports.slice(0, 5).map(report => (
                  <div key={report._id} className="p-3 bg-secondary rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        report.type === 'user' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                      }`}>{report.type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm">{report.reason}</p>
                  </div>
                )) : <p className="text-muted-foreground">No pending reports</p>}
              </div>
            </div>

            {/* Recent Threads */}
            <div className="bg-card rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Recent Threads
                </h2>
                <button onClick={() => setActiveTab('threads')} className="text-sm text-primary hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {threads.length > 0 ? threads.slice(0, 5).map(thread => (
                  <div key={thread._id} className="p-3 bg-secondary rounded">
                    <p className="font-medium text-sm line-clamp-1">{thread.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>by {thread.author?.username}</span>
                      <span>•</span>
                      <span>{thread.views} views</span>
                    </div>
                  </div>
                )) : <p className="text-muted-foreground">No threads found</p>}
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-card rounded-lg shadow p-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5" /> Recent Activity
              </h2>
              <button onClick={() => setActiveTab('activity')} className="text-sm text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {activityLog.length > 0 ? activityLog.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-secondary rounded text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{activity.action}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{new Date(activity.timestamp).toLocaleString()}</span>
                </div>
              )) : <p className="text-muted-foreground">No recent activity</p>}
            </div>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Threads</th>
                  <th className="text-left p-3">Posts</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-b border-border hover:bg-secondary/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar || '/default-avatar.png'} alt={user.username} className="w-10 h-10 rounded-full" />
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                        user.role === 'moderator' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>{user.role}</span>
                    </td>
                    <td className="p-3">
                      {user.isBanned ? (
                        <span className="text-red-500 text-sm">Banned</span>
                      ) : (
                        <span className="text-green-500 text-sm">Active</span>
                      )}
                    </td>
                    <td className="p-3">{user.threadsCount || 0}</td>
                    <td className="p-3">{user.postsCount || 0}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {user.isBanned ? (
                          <button onClick={() => handleUnbanUser(user._id)} className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 rounded text-green-500" title="Unban">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleBanUser(user._id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500" title="Ban">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDeleteUser(user._id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500" title="Delete">
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

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Report Management</h2>
          <div className="space-y-3">
            {reports.length > 0 ? reports.map(report => (
              <div key={report._id} className="p-4 bg-secondary rounded flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      report.type === 'user' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>{report.type}</span>
                    <span className="text-sm text-muted-foreground">{new Date(report.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="font-medium">{report.reason}</p>
                  <p className="text-sm text-muted-foreground">Reported by: {report.reportedBy?.username}</p>
                  {report.description && <p className="text-sm mt-1">{report.description}</p>}
                </div>
                <button onClick={() => handleResolveReport(report._id)} className="px-4 py-2 bg-green-500 text-white rounded hover:opacity-90">
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            )) : <p className="text-muted-foreground text-center py-8">No pending reports</p>}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Category Management</h2>
          <div className="space-y-4">
            {categories.map(cat => (
              <div key={cat._id} className="p-4 bg-secondary rounded flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded`} style={{ backgroundColor: cat.color }}></div>
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-sm text-muted-foreground">{cat.threadsCount} threads • {cat.postsCount} posts</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-primary hover:text-white rounded">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-card rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-xl font-semibold mb-4">Site Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Site Name</label>
              <input type="text" value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea value={settings.siteDescription} onChange={(e) => setSettings({...settings, siteDescription: e.target.value})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" rows="3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Max File Size (MB)</label>
                <input type="number" value={settings.maxFileSize} onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Posts Per Page</label>
                <input type="number" value={settings.postsPerPage} onChange={(e) => setSettings({...settings, postsPerPage: parseInt(e.target.value)})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Avatar Max Size (MB)</label>
                <input type="number" value={settings.avatarMaxSize} onChange={(e) => setSettings({...settings, avatarMaxSize: parseInt(e.target.value)})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Screenshot Max Size (MB)</label>
                <input type="number" value={settings.screenshotMaxSize} onChange={(e) => setSettings({...settings, screenshotMaxSize: parseInt(e.target.value)})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Threads Per Page</label>
                <input type="number" value={settings.threadsPerPage} onChange={(e) => setSettings({...settings, threadsPerPage: parseInt(e.target.value)})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Daily Posts</label>
                <input type="number" value={settings.maxDailyPosts} onChange={(e) => setSettings({...settings, maxDailyPosts: parseInt(e.target.value)})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="maintenance" checked={settings.maintenanceMode} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="maintenance" className="text-sm font-medium">Maintenance Mode</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="registration" checked={settings.registrationEnabled} onChange={(e) => setSettings({...settings, registrationEnabled: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="registration" className="text-sm font-medium">Allow Registration</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="emailVerify" checked={settings.emailVerificationRequired} onChange={(e) => setSettings({...settings, emailVerificationRequired: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="emailVerify" className="text-sm font-medium">Email Verification Required</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="uploads" checked={settings.allowFileUploads} onChange={(e) => setSettings({...settings, allowFileUploads: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="uploads" className="text-sm font-medium">Allow File Uploads</label>
            </div>
            <button onClick={handleSaveSettings} className="w-full py-3 bg-primary text-white rounded hover:opacity-90 font-medium">Save Settings</button>
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Create Announcement</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input type="text" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary" rows="4" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select value={newAnnouncement.priority} onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <button onClick={handleCreateAnnouncement} className="w-full py-3 bg-primary text-white rounded hover:opacity-90 font-medium">Post Announcement</button>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Active Announcements</h2>
            <div className="space-y-3">
              {announcements.length > 0 ? announcements.map(ann => (
                <div key={ann._id} className={`p-4 rounded border-l-4 ${
                  ann.priority === 'urgent' ? 'border-red-500 bg-red-500/10' :
                  ann.priority === 'high' ? 'border-orange-500 bg-orange-500/10' :
                  'border-blue-500 bg-blue-500/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{ann.title}</h3>
                    <span className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm">{ann.content}</p>
                </div>
              )) : <p className="text-muted-foreground">No announcements</p>}
            </div>
          </div>
        </div>
      )}

      {/* Threads Tab */}
      {activeTab === 'threads' && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Thread Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3">Thread</th>
                  <th className="text-left p-3">Author</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Stats</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {threads.map(thread => (
                  <tr key={thread._id} className="border-b border-border hover:bg-secondary/50">
                    <td className="p-3 max-w-xs">
                      <p className="font-medium truncate">{thread.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(thread.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={thread.author?.avatar || '/default-avatar.png'} alt={thread.author?.username} className="w-6 h-6 rounded-full" />
                        <span className="text-sm">{thread.author?.username}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: thread.category?.color + '33', color: thread.category?.color }}>{thread.category?.name}</span>
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex gap-3">
                        <span>👁 {thread.views}</span>
                        <span>💬 {thread.replies}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {thread.pinned && <Pin className="w-4 h-4 text-blue-500" />}
                        {thread.locked && <Lock className="w-4 h-4 text-red-500" />}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => handlePinThread(thread._id)} className={`p-2 rounded ${thread.pinned ? 'bg-blue-100 text-blue-500' : 'hover:bg-primary hover:text-white'}`} title={thread.pinned ? 'Unpin' : 'Pin'}>
                          <Pin className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleLockThread(thread._id)} className={`p-2 rounded ${thread.locked ? 'bg-red-100 text-red-500' : 'hover:bg-primary hover:text-white'}`} title={thread.locked ? 'Unlock' : 'Lock'}>
                          <Lock className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteThread(thread._id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500" title="Delete">
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

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Post Management</h2>
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post._id} className="p-4 bg-secondary rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <img src={post.author?.avatar || '/default-avatar.png'} alt={post.author?.username} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-medium text-sm">{post.author?.username}</p>
                      <p className="text-xs text-muted-foreground">In: {post.thread?.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm line-clamp-2 mb-3">{post.content}</p>
                <button onClick={() => handleDeletePost(post._id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:opacity-90">Delete Post</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
          <div className="space-y-2">
            {activityLog.length > 0 ? activityLog.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-secondary rounded">
                {activity.type === 'user' && <Users className="w-4 h-4 text-blue-500" />}
                {activity.type === 'thread' && <MessageSquare className="w-4 h-4 text-green-500" />}
                {activity.type === 'post' && <FileText className="w-4 h-4 text-purple-500" />}
                {activity.type === 'report' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                <span className="text-sm">{activity.action}</span>
                <span className="text-xs text-muted-foreground ml-auto">{new Date(activity.timestamp).toLocaleString()}</span>
              </div>
            )) : <p className="text-muted-foreground text-center py-8">No activity found</p>}
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, children, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
    active ? 'bg-card text-primary border-t-2 border-primary' : 'text-muted-foreground hover:text-foreground'
  }`}>{children}</button>
);

const StatCard = ({ icon, title, value, color, trend }) => (
  <div className="bg-card rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        {trend && <p className="text-xs text-green-500 mt-1">{trend} from last week</p>}
      </div>
      <div className={`${color} p-3 rounded-full text-white`}>{icon}</div>
    </div>
  </div>
);

export default AdminDashboard;
