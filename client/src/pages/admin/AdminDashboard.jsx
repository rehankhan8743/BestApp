import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Users, MessageSquare, AlertTriangle, Eye, Settings, Folder, Ban, CheckCircle, Trash2, Edit } from 'lucide-react';

const AdminDashboard = () => {
  const { get, put, del } = useApi();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    maxFileSize: 100,
    postsPerPage: 20,
    maintenanceMode: false
  });

  useEffect(() => {
    loadDashboard();
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'dashboard') {
        const [statsRes, usersRes, reportsRes] = await Promise.all([
          get('/admin/stats'),
          get('/admin/users?limit=10'),
          get('/admin/reports?limit=10')
        ]);
        if (statsRes?.success) setStats(statsRes.data);
        if (usersRes?.success) setUsers(usersRes.data || []);
        if (reportsRes?.success) setReports(reportsRes.data || []);
      } else if (activeTab === 'users') {
        const res = await get('/admin/users?limit=50');
        if (res?.success) setUsers(res.data || []);
      } else if (activeTab === 'reports') {
        const res = await get('/admin/reports?limit=50');
        if (res?.success) setReports(res.data || []);
      } else if (activeTab === 'categories') {
        const res = await get('/categories');
        if (res?.success) setCategories(res.data || []);
      } else if (activeTab === 'settings') {
        const res = await get('/admin/settings');
        if (res?.success) setSettings(res.data || settings);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
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
      <div className="flex gap-2 mb-8 border-b border-border">
        <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
          <Eye className="w-4 h-4 mr-2" /> Dashboard
        </TabButton>
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
          <Users className="w-4 h-4 mr-2" /> Users
        </TabButton>
        <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>
          <AlertTriangle className="w-4 h-4 mr-2" /> Reports
        </TabButton>
        <TabButton active={activeTab === 'categories'} onClick={() => setActiveTab('categories')}>
          <Folder className="w-4 h-4 mr-2" /> Categories
        </TabButton>
        <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
          <Settings className="w-4 h-4 mr-2" /> Settings
        </TabButton>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Users className="w-6 h-6" />} title="Total Users" value={stats?.totalUsers || 0} color="bg-blue-500" />
            <StatCard icon={<MessageSquare className="w-6 h-6" />} title="Total Threads" value={stats?.totalThreads || 0} color="bg-green-500" />
            <StatCard icon={<MessageSquare className="w-6 h-6" />} title="Total Posts" value={stats?.totalPosts || 0} color="bg-purple-500" />
            <StatCard icon={<AlertTriangle className="w-6 h-6" />} title="Pending Reports" value={stats?.pendingReports || 0} color="bg-red-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Users */}
            <div className="bg-card rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Users</h2>
              <div className="space-y-3">
                {users.length > 0 ? users.slice(0, 5).map(user => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-secondary rounded">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
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
              <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
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
            <div className="flex items-center gap-2">
              <input type="checkbox" id="maintenance" checked={settings.maintenanceMode} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})} className="w-4 h-4" />
              <label htmlFor="maintenance" className="text-sm font-medium">Maintenance Mode</label>
            </div>
            <button onClick={handleSaveSettings} className="w-full py-3 bg-primary text-white rounded hover:opacity-90 font-medium">Save Settings</button>
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

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-card rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className={`${color} p-3 rounded-full text-white`}>{icon}</div>
    </div>
  </div>
);

export default AdminDashboard;
