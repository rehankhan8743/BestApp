import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Search, MessageSquare, Eye, Clock, User, Calendar } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { get } = useApi();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ threads: [], posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('threads');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [location.search]);

  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const [threadsRes, postsRes, usersRes] = await Promise.all([
        get(`/threads/search?q=${encodeURIComponent(searchQuery)}`),
        get(`/posts/search?q=${encodeURIComponent(searchQuery)}`),
        get(`/users/search?q=${encodeURIComponent(searchQuery)}`)
      ]);

      setResults({
        threads: threadsRes?.data || [],
        posts: postsRes?.data || [],
        users: usersRes?.data || []
      });
      setSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads, posts, users..."
            className="flex-1 p-4 bg-card rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
          >
            {loading ? 'Searching...' : <Search className="w-6 h-6" />}
          </button>
        </div>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && searched && (
        <>
          {/* Results Summary */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              Search Results for "{query}"
            </h1>
            <p className="text-muted-foreground">
              {results.threads.length} threads • {results.posts.length} posts • {results.users.length} users
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('threads')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'threads'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Threads ({results.threads.length})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'posts'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Posts ({results.posts.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'users'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Users ({results.users.length})
            </button>
          </div>

          {/* Threads Results */}
          {activeTab === 'threads' && (
            <div className="space-y-3">
              {results.threads.length > 0 ? (
                results.threads.map(thread => (
                  <a
                    key={thread._id}
                    href={`/thread/${thread.slug}`}
                    className="block bg-card rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-semibold hover:text-primary">
                      {thread.title}
                    </h3>
                    <p className="text-muted-foreground mt-1 line-clamp-2">
                      {thread.content?.substring(0, 200)}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {thread.author?.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {thread.repliesCount || 0} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {thread.views || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(thread.createdAt)}
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No threads found</p>
                </div>
              )}
            </div>
          )}

          {/* Posts Results */}
          {activeTab === 'posts' && (
            <div className="space-y-3">
              {results.posts.length > 0 ? (
                results.posts.map(post => (
                  <a
                    key={post._id}
                    href={`/thread/${post.thread?.slug}#post-${post._id}`}
                    className="block bg-card rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                  >
                    <p className="text-muted-foreground line-clamp-3">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {post.author?.username}
                      </span>
                      <span>In: {post.thread?.title}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No posts found</p>
                </div>
              )}
            </div>
          )}

          {/* Users Results */}
          {activeTab === 'users' && (
            <div className="grid md:grid-cols-3 gap-4">
              {results.users.length > 0 ? (
                results.users.map(user => (
                  <a
                    key={user._id}
                    href={`/user/${user.username}`}
                    className="block bg-card rounded-lg shadow p-4 hover:shadow-md transition-shadow text-center"
                  >
                    <img
                      src={user.avatar || '/uploads/avatars/default.png'}
                      alt={user.username}
                      className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                    />
                    <h3 className="font-semibold hover:text-primary">
                      {user.username}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user.role === 'admin' ? '👑 Admin' : `${user.threadsCount || 0} threads • ${user.postsCount || 0} posts`}
                    </p>
                  </a>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground col-span-full">
                  <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="text-center py-12">
          <Search className="w-24 h-24 mx-auto text-muted-foreground mb-6 opacity-20" />
          <h2 className="text-2xl font-bold mb-2">Search BestApp Forum</h2>
          <p className="text-muted-foreground">
            Find threads, posts, and users
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
