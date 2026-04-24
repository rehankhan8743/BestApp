import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, MessageSquare, Award, MapPin, Link as LinkIcon, Eye, Clock } from 'lucide-react';
import { formatDate, getRankColor } from '../utils/helpers';

const UserProfilePage = () => {
  const { username } = useParams();
  const { get } = useApi();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [recentThreads, setRecentThreads] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    bio: '',
    location: '',
    website: ''
  });

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, threadsRes, postsRes] = await Promise.all([
        get(`/users/${username}`),
        get(`/users/${username}/threads?limit=5`),
        get(`/users/${username}/posts?limit=5`)
      ]);

      if (profileRes?.success) {
        setProfile(profileRes.data);
        setIsFollowing(profileRes.data.isFollowing || false);
        setEditData({
          bio: profileRes.data.bio || '',
          location: profileRes.data.location || '',
          website: profileRes.data.website || ''
        });
      }
      if (threadsRes?.success) setRecentThreads(threadsRes.data || []);
      if (postsRes?.success) setRecentPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await get(`/users/${username}/${endpoint}`);

      if (res?.success) {
        setIsFollowing(!isFollowing);
        setProfile(prev => prev ? ({
          ...prev,
          followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
        }) : null);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleEditProfile = async () => {
    try {
      const res = await get('/users/profile/update', {
        method: 'PUT',
        body: editData
      });

      if (res?.success) {
        setProfile(prev => prev ? ({
          ...prev,
          ...editData
        }) : null);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">User not found</h1>
        <Link to="/" className="text-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-card rounded-lg shadow p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <img
              src={profile.avatar || '/default-avatar.png'}
              alt={profile.username}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
            />
            {profile.role === 'admin' && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full">
                <Award className="w-5 h-5" />
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.username}</h1>
                  {profile.rank && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRankColor(profile.rank)}`}>
                      {profile.rank}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">{profile.bio || 'No bio yet'}</p>
              </div>
              
              {!isOwnProfile && currentUser && (
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded font-medium ${
                    isFollowing
                      ? 'bg-secondary hover:bg-red-500/20 hover:text-red-500'
                      : 'bg-primary hover:opacity-90 text-white'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-6 py-2 bg-secondary hover:bg-primary hover:text-white rounded font-medium transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatItem icon={<MessageSquare className="w-5 h-5" />} label="Posts" value={profile.postsCount || 0} />
              <StatItem icon={<Eye className="w-5 h-5" />} label="Followers" value={profile.followersCount || 0} />
              <StatItem icon={<Award className="w-5 h-5" />} label="Reputation" value={profile.reputation || 0} />
              <StatItem icon={<Clock className="w-5 h-5" />} label="Days Active" value={profile.daysActive || 0} />
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {formatDate(profile.createdAt)}
              </span>
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <LinkIcon className="w-4 h-4" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Threads */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Threads
          </h2>
          <div className="space-y-3">
            {recentThreads.length > 0 ? (
              recentThreads.map(thread => (
                <Link
                  key={thread._id}
                  to={`/thread/${thread.slug}`}
                  className="block p-3 bg-secondary rounded hover:opacity-80 transition-opacity"
                >
                  <h3 className="font-medium line-clamp-1">{thread.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>{thread.category?.name}</span>
                    <span>•</span>
                    <span>{formatDate(thread.createdAt)}</span>
                    <span>•</span>
                    <span>{thread.views} views</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground">No threads yet</p>
            )}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Posts
          </h2>
          <div className="space-y-3">
            {recentPosts.length > 0 ? (
              recentPosts.map(post => (
                <Link
                  key={post._id}
                  to={`/thread/${post.thread?.slug}#post-${post._id}`}
                  className="block p-3 bg-secondary rounded hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                    <span>{post.thread?.title}</span>
                    <span>•</span>
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground">No posts yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => setEditData({...editData, location: e.target.value})}
                  className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Dhaka, Bangladesh"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <input
                  type="url"
                  value={editData.website}
                  onChange={(e) => setEditData({...editData, website: e.target.value})}
                  className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-secondary hover:opacity-80 rounded font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditProfile}
                className="flex-1 px-4 py-2 bg-primary text-white hover:opacity-90 rounded font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ icon, label, value }) => (
  <div className="bg-secondary rounded-lg p-4 text-center">
    <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground">
      {icon}
      <span className="text-sm">{label}</span>
    </div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default UserProfilePage;
