import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
  MessageSquare, TrendingUp, Calendar, Eye, ThumbsUp, 
  Award, Clock, BarChart3, Users, FileText, Bookmark
} from 'lucide-react';
import ReputationBadge from '../components/ReputationBadge.jsx';

const UserDashboard = () => {
  const { get } = useApi();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentThreads, setRecentThreads] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    loadDashboard();
  }, [timeRange]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [statsRes, threadsRes, postsRes, followersRes, activityRes] = await Promise.all([
        get(`/users/dashboard/stats?days=${timeRange}`),
        get(`/users/dashboard/threads?limit=5`),
        get(`/users/dashboard/posts?limit=5`),
        get(`/users/dashboard/followers?limit=5`),
        get(`/users/dashboard/activity?days=${timeRange}`)
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (threadsRes?.success) setRecentThreads(threadsRes.data || []);
      if (postsRes?.success) setRecentPosts(postsRes.data || []);
      if (followersRes?.success) setFollowers(followersRes.data || []);
      if (activityRes?.success) setActivityData(activityRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {currentUser?.username}! 👋</h1>
              <p className="text-blue-100">Here's what's happening with your account</p>
            </div>
            <div className="text-right hidden md:block">
              <ReputationBadge reputation={currentUser?.reputation} size="lg" />
              <p className="text-blue-100 text-sm mt-2">
                Member since {new Date(currentUser?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Dashboard Overview
            </h2>
            <div className="flex gap-2">
              {['7', '30', '90', '365'].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeRange(days)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {days === '365' ? '1 Year' : `${days} Days`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.totalThreads || 0}</div>
                <div className="text-sm text-gray-500">Total Threads</div>
              </div>
            </div>
            <div className="text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{stats?.threadsThisPeriod || 0} this period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.totalPosts || 0}</div>
                <div className="text-sm text-gray-500">Total Posts</div>
              </div>
            </div>
            <div className="text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{stats?.postsThisPeriod || 0} this period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.totalViews || 0}</div>
                <div className="text-sm text-gray-500">Total Views</div>
              </div>
            </div>
            <div className="text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{stats?.viewsThisPeriod || 0} this period</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.totalLikes || 0}</div>
                <div className="text-sm text-gray-500">Total Likes</div>
              </div>
            </div>
            <div className="text-sm text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              <span>{stats?.likesThisPeriod || 0} this period</span>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800">{stats?.followersCount || 0}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800">{stats?.bookmarksCount || 0}</div>
                <div className="text-sm text-gray-500">Bookmarks</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800">{stats?.bestAnswers || 0}</div>
                <div className="text-sm text-gray-500">Best Answers</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Threads */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recent Threads
              </h2>
              <Link to="/dashboard/threads" className="text-sm text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {recentThreads.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No threads yet</p>
                  <Link to="/new-thread" className="text-blue-600 hover:underline mt-2 inline-block">
                    Create your first thread
                  </Link>
                </div>
              ) : (
                recentThreads.map((thread) => (
                  <div key={thread._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <Link to={`/thread/${thread.slug}`} className="block">
                      <h4 className="font-medium text-gray-800 mb-2 line-clamp-1">{thread.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {thread.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {thread.replies || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {thread.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Posts
              </h2>
              <Link to="/dashboard/posts" className="text-sm text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-200">
              {recentPosts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No posts yet</p>
                </div>
              ) : (
                recentPosts.map((post) => (
                  <div key={post._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <Link to={`/thread/${post.thread?.slug}#${post._id}`} className="block">
                      <p className="text-gray-700 mb-2 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="text-blue-600">{post.thread?.title}</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Followers & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Recent Followers */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Followers
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {followers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No followers yet</p>
                </div>
              ) : (
                followers.map((follower) => (
                  <div key={follower._id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    {follower.avatar ? (
                      <img src={follower.avatar} alt={follower.username} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {follower.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <Link to={`/user/${follower.username}`} className="font-medium text-gray-800 hover:text-blue-600">
                        {follower.username}
                      </Link>
                      <p className="text-sm text-gray-500">
                        Followed you {new Date(follower.followedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {activityData.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>No recent activity</p>
                </div>
              ) : (
                activityData.map((activity, index) => (
                  <div key={activity._id || index} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'thread_created' ? 'bg-blue-100' :
                      activity.type === 'post_created' ? 'bg-green-100' :
                      activity.type === 'like_received' ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'thread_created' ? <MessageSquare className="w-5 h-5 text-blue-600" /> :
                       activity.type === 'post_created' ? <FileText className="w-5 h-5 text-green-600" /> :
                       activity.type === 'like_received' ? <ThumbsUp className="w-5 h-5 text-yellow-600" /> :
                       <Clock className="w-5 h-5 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
