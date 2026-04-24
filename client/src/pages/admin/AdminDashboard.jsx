import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { Users, MessageSquare, AlertTriangle, Eye } from 'lucide-react';

const AdminDashboard = () => {
  const { get } = useApi();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        get('/admin/stats'),
        get('/admin/users?limit=5'),
        get('/admin/reports?limit=5')
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (usersRes?.success) setRecentUsers(usersRes.data || []);
      if (reportsRes?.success) setRecentReports(reportsRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Total Users"
          value={stats?.totalUsers || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={<MessageSquare className="w-6 h-6" />}
          title="Total Threads"
          value={stats?.totalThreads || 0}
          color="bg-green-500"
        />
        <StatCard
          icon={<MessageSquare className="w-6 h-6" />}
          title="Total Posts"
          value={stats?.totalPosts || 0}
          color="bg-purple-500"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6" />}
          title="Pending Reports"
          value={stats?.pendingReports || 0}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recent Users
          </h2>
          <div className="space-y-3">
            {recentUsers.length > 0 ? (
              recentUsers.map(user => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-secondary rounded">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                    user.role === 'moderator' ? 'bg-blue-500/20 text-blue-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No users found</p>
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Reports
          </h2>
          <div className="space-y-3">
            {recentReports.length > 0 ? (
              recentReports.map(report => (
                <div key={report._id} className="p-3 bg-secondary rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      report.type === 'user' ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {report.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{report.reason}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No pending reports</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-card rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-sm mb-1">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
      <div className={`${color} p-3 rounded-full text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
