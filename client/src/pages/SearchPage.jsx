import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApiCall } from '../hooks/useApi.js';
import { Search, MessageSquare, Eye, Clock, User, Calendar, Filter } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { call } = useApiCall();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ threads: [], posts: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('threads');
  const [filters, setFilters] = useState({
    category: 'all',
    sortBy: 'relevance',
    dateRange: 'all'
  });

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
      const queryParams = new URLSearchParams({
        q: searchQuery,
        category: filters.category,
        sortBy: filters.sortBy,
        dateRange: filters.dateRange
      });

      const [threadsRes, postsRes, usersRes] = await Promise.all([
        call('get', `/threads/search?${queryParams.toString()}`),
        call('get', `/posts/search?${queryParams.toString()}`),
        call('get', `/users/search?${queryParams.toString()}`)
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

      {/* Advanced Filters */}
      {searched && (
        <div className="mb-6 bg-card rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full p-2 bg-background rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                <option value="android-apps">Android Apps</option>
                <option value="games">Games</option>
                <option value="ebooks">eBooks</option>
                <option value="magazines">Magazines</option>
                <option value="requests">Requests</option>
                <option value="off-topic">Off-Topic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full p-2 bg-background rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-replies">Most Replies</option>
                <option value="most-views">Most Views</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full p-2 bg-background rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={() => performSearch(query)}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 font-medium"
          >
            Apply Filters
          </button>
        </div>
      )}

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
