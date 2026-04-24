import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { MessageSquare, Eye, Clock, Heart, Flag, MessageCircle, Pin, Lock, Bookmark } from 'lucide-react';
import { formatDate, getRankColor } from '../utils/helpers';

const ThreadPage = () => {
  const { slug } = useParams();
  const { get, post } = useApi();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadThread();
  }, [slug]);

  const loadThread = async () => {
    try {
      const [threadRes, postsRes] = await Promise.all([
        get(`/threads/${slug}`),
        get(`/posts/thread/${slug}`)
      ]);

      if (threadRes?.success) setThread(threadRes.data);
      if (postsRes?.success) setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Failed to load thread:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim() || !thread) return;

    setSubmitting(true);
    try {
      const res = await post(`/posts`, {
        threadId: thread._id,
        content: newReply
      });

      if (res?.success) {
        setNewReply('');
        loadThread(); // Reload to show new post
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt('Enter reason for reporting:');
    if (!reason || !thread) return;

    try {
      const res = await post('/reports', {
        type: 'thread',
        contentId: thread._id,
        reason
      });

      if (res?.success) {
        alert('Report submitted successfully');
      }
    } catch (error) {
      console.error('Failed to report:', error);
    }
  };

  const handleLike = async () => {
    if (!thread) return;
    try {
      const res = await post(`/threads/${thread._id}/like`);
      if (res?.success) {
        setThread(prev => prev ? ({
          ...prev,
          likes: res.data.likes
        }) : null);
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleDelete = async () => {
    if (!thread || !confirm('Are you sure you want to delete this thread?')) return;
    try {
      const res = await get(`/threads/${thread._id}/delete`);
      if (res?.success) {
        navigate(`/category/${thread.category?.slug}`);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleBookmark = async () => {
    if (!thread) return;
    try {
      const res = await post(`/threads/${thread._id}/bookmark`);
      if (res?.success) {
        alert(res.message);
      }
    } catch (error) {
      console.error('Failed to bookmark:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Thread not found</h1>
        <Link to="/categories" className="text-primary hover:underline">
          ← Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to={`/category/${thread.category?.slug}`} className="text-primary hover:underline mb-4 inline-block">
        ← Back to {thread.category?.name}
      </Link>

      {/* Thread Header */}
      <div className="bg-card rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {thread.isPinned && <Pin className="w-5 h-5 text-blue-500" />}
              {thread.isLocked && <Lock className="w-5 h-5 text-red-500" />}
              <h1 className="text-3xl font-bold">{thread.title}</h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to={`/user/${thread.author?.username}`} className="hover:underline">
                {thread.author?.username}
              </Link>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(thread.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {thread.views} views
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`p-2 hover:bg-secondary rounded flex items-center gap-1 ${
                thread.likes?.includes(user?._id) ? 'text-red-500' : 'text-muted-foreground'
              }`}
              title="Like"
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm">{thread.likes?.length || 0}</span>
            </button>
            {user && (
              <button
                onClick={handleBookmark}
                className="p-2 hover:bg-secondary rounded"
                title="Bookmark"
              >
                <Bookmark className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={handleReport}
              className="p-2 hover:bg-secondary rounded"
              title="Report"
            >
              <Flag className="w-5 h-5 text-muted-foreground" />
            </button>
            {(user?._id === thread.author?._id || user?.role === 'admin') && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
                title="Delete"
              >
                <span className="text-sm font-medium">Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Thread Content */}
        <div className="prose dark:prose-invert max-w-none mt-4 p-4 bg-secondary rounded">
          <p className="whitespace-pre-wrap">{thread.content}</p>
        </div>

        {/* Tags */}
        {thread.tags && thread.tags.length > 0 && (
          <div className="flex gap-2 mt-4">
            {thread.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Posts/Replies */}
      <div className="space-y-4 mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Replies ({posts.length})
        </h2>

        {posts.map((post, index) => (
          <div key={post._id} className="bg-card rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Link to={`/user/${post.author?.username}`} className="hover:underline font-medium">
                  {post.author?.username}
                </Link>
                {post.author?.rank && (
                  <span className={`px-2 py-1 rounded text-xs ${getRankColor(post.author.rank)}`}>
                    {post.author.rank}
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDate(post.createdAt)}
              </span>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Form */}
      {user && !thread.isLocked ? (
        <form onSubmit={handleReply} className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Post a Reply</h3>
          <textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder="Write your reply..."
            className="w-full h-32 p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            disabled={submitting}
          />
          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={submitting || !newReply.trim()}
              className="px-6 py-2 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      ) : thread.isLocked ? (
        <div className="bg-secondary rounded-lg p-6 text-center text-muted-foreground">
          <Lock className="w-6 h-6 mx-auto mb-2" />
          <p>This thread is locked. No new replies allowed.</p>
        </div>
      ) : (
        <div className="bg-secondary rounded-lg p-6 text-center">
          <Link to="/login" className="text-primary hover:underline">
            Login to reply
          </Link>
        </div>
      )}
    </div>
  );
};

export default ThreadPage;
