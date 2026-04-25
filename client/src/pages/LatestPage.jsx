import { useState, useEffect } from 'react';
import { useApiCall } from '../hooks/useApi.js';
import { Clock, MessageSquare, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/helpers';

const LatestPage = () => {
  const { call } = useApiCall();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadLatest();
  }, [page]);

  const loadLatest = async () => {
    try {
      const res = await call('get', `/threads/latest?page=${page}&limit=20`);
      if (res?.success) {
        setThreads(prev => page === 1 ? res.data : [...prev, ...res.data]);
        setHasMore(res.data?.length === 20);
      }
    } catch (error) {
      console.error('Failed to load latest:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Clock className="w-8 h-8" />
          Latest Threads
        </h1>
        <p className="text-muted-foreground mt-1">
          Most recently created discussions
        </p>
      </div>

      <div className="space-y-4">
        {threads.length > 0 ? (
          threads.map(thread => (
            <div
              key={thread._id}
              className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <Link
                to={`/thread/${thread.slug}`}
                className="text-xl font-semibold hover:underline text-primary block mb-2"
              >
                {thread.title}
              </Link>
              <p className="text-muted-foreground line-clamp-2 mb-4">
                {thread.content}
              </p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <Link
                  to={`/user/${thread.author?.username}`}
                  className="hover:underline"
                >
                  {thread.author?.username}
                </Link>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {thread.replies || 0} replies
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {thread.views} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(thread.createdAt)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card rounded-lg">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No threads yet</h3>
            <p className="text-muted-foreground">
              Be the first to start a discussion!
            </p>
            <Link
              to="/new-thread"
              className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded hover:opacity-90"
            >
              Create Thread
            </Link>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LatestPage;
