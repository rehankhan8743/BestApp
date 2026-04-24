import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi.js';
import { TrendingUp, MessageSquare, Eye, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/helpers';

const TrendingPage = () => {
  const { get } = useApi();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('day'); // day, week, month

  useEffect(() => {
    loadTrending();
  }, [timeRange]);

  const loadTrending = async () => {
    try {
      const res = await get(`/threads/trending?range=${timeRange}`);
      if (res?.success) {
        setThreads(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load trending:', error);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="w-8 h-8" />
            Trending Threads
          </h1>
          <p className="text-muted-foreground mt-1">
            Most popular discussions right now
          </p>
        </div>

        <div className="flex gap-2">
          {['day', 'week', 'month'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded font-medium ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-secondary hover:opacity-80'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {threads.length > 0 ? (
          threads.map((thread, index) => (
            <div
              key={thread._id}
              className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl font-bold text-primary/30 w-12 text-center">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <Link
                    to={`/thread/${thread.slug}`}
                    className="text-xl font-semibold hover:underline text-primary"
                  >
                    {thread.title}
                  </Link>
                  <p className="text-muted-foreground mt-2 line-clamp-2">
                    {thread.content}
                  </p>

                  <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
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
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card rounded-lg">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No trending threads</h3>
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
    </div>
  );
};

export default TrendingPage;
