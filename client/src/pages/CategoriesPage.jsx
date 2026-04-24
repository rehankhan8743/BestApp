import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { MessageSquare, Eye, Clock, TrendingUp, Pin, Lock } from 'lucide-react';

const CategoriesPage = () => {
  const { slug } = useParams();
  const { get } = useApi();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, [slug]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await get('/categories');
      if (res?.success) {
        let data = res.data;

        if (slug) {
          const found = data.find(c => c.slug === slug || c._id === slug);
          if (found) {
            setCategory(found);
            // Load threads for this category
            const threadsRes = await get(`/threads?category=${found._id}&limit=50`);
            if (threadsRes?.success) {
              setThreads(threadsRes.data || []);
            }
            // If has subcategories, show them instead
            if (found.subcategories?.length > 0) {
              data = found.subcategories;
            } else {
              data = []; // Show threads, not subcategories
            }
          }
        }

        setCategories(data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
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
      {category && (
        <Link
          to="/categories"
          className="text-primary hover:underline mb-4 inline-block"
        >
          ← Back to Categories
        </Link>
      )}

      <h1 className="text-3xl font-bold mb-2">
        {category ? category.name : 'All Categories'}
      </h1>
      <p className="text-muted-foreground mb-8">
        {category ? category.description : 'Browse all forum categories'}
      </p>

      {/* Show subcategories if available */}
      {categories.length > 0 && (
        <div className="space-y-4 mb-8">
          {categories.map(cat => (
            <div
              key={cat._id}
              className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/category/${cat.slug}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-primary hover:underline">
                    {cat.name}
                  </h3>
                  <p className="text-muted-foreground mt-1">{cat.description}</p>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {cat.threadCount || 0} threads
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {cat.postCount || 0} posts
                    </span>
                  </div>
                </div>

                {cat.icon && (
                  <div className="text-4xl ml-4">{cat.icon}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show threads for selected category */}
      {category && threads.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Threads in {category.name}</h2>
          <div className="space-y-3">
            {threads.map(thread => (
              <Link
                key={thread._id}
                to={`/thread/${thread.slug}`}
                className="block bg-card rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold hover:text-primary">
                      {thread.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>by {thread.author?.username}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {thread.repliesCount || 0} replies
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {thread.views || 0} views
                      </span>
                      <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {thread.isPinned && <Pin className="w-5 h-5 text-blue-500" />}
                  {thread.isLocked && <Lock className="w-5 h-5 text-red-500" />}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No threads message */}
      {category && threads.length === 0 && categories.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No threads yet</h3>
          <p className="text-muted-foreground mb-4">Be the first to start a discussion!</p>
          <Link
            to="/new-thread"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90"
          >
            Create Thread
          </Link>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
