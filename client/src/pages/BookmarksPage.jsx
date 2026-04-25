import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApiCall } from '../hooks/useApi.js';
import { Bookmark, MessageSquare, Eye, Clock, Trash2, Heart } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const BookmarksPage = () => {
  const { call } = useApiCall();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const res = await call('get', '/users/bookmarks');
      if (res?.success) {
        setBookmarks(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (threadId) => {
    try {
      const res = await call('post', `/threads/${threadId}/bookmark`);
      if (res?.success) {
        setBookmarks(prev => prev.filter(b => b._id !== threadId));
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
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
      <h1 className="text-3xl font-bold mb-2">My Bookmarks</h1>
      <p className="text-muted-foreground mb-8">
        Saved threads for quick access
      </p>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Bookmark className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No bookmarks yet</h3>
          <p className="text-muted-foreground mb-4">
            Bookmark threads to save them here
          </p>
          <Link
            to="/categories"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90"
          >
            Browse Categories
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map(thread => (
            <div
              key={thread._id}
              className="bg-card rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    to={`/thread/${thread.slug}`}
                    className="text-lg font-semibold hover:text-primary"
                  >
                    {thread.title}
                  </Link>
                  <p className="text-muted-foreground mt-1 line-clamp-2">
                    {thread.content?.substring(0, 150)}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {thread.repliesCount || 0} replies
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {thread.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(thread.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeBookmark(thread._id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500 ml-4"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
