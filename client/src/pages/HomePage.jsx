import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, Clock, Users } from 'lucide-react';
import ThreadList from '../components/ThreadList.jsx';
import { useApi } from '../hooks/useApi.js';

const HomePage = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalThreads: 0, totalPosts: 0, onlineUsers: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const { data: trendingData, loading: trendingLoading } = useApi('/threads/trending');
  const { data: latestData, loading: latestLoading } = useApi('/threads/latest');
  const { data: categoriesData } = useApi('/categories');
  const categories = categoriesData?.data || [];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/');
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to BestApp Forum
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8">
            Your community for Android apps, games, eBooks & more
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/new-thread"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Start Discussion
            </Link>
            <Link
              to="/categories"
              className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statsLoading ? '...' : stats.totalUsers.toLocaleString()}
            </p>
            <p className="text-gray-500 dark:text-gray-400">Members</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <MessageSquare className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statsLoading ? '...' : stats.totalThreads.toLocaleString()}
            </p>
            <p className="text-gray-500 dark:text-gray-400">Threads</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statsLoading ? '...' : stats.totalPosts.toLocaleString()}
            </p>
            <p className="text-gray-500 dark:text-gray-400">Posts</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <Clock className="w-8 h-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {statsLoading ? '...' : stats.onlineUsers.toLocaleString()}
            </p>
            <p className="text-gray-500 dark:text-gray-400">Online</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Trending Threads */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                🔥 Trending Threads
              </h2>
              <Link
                to="/trending"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View All
              </Link>
            </div>
            <ThreadList 
              threads={trendingData?.data || []}
              loading={trendingLoading}
            />
          </div>

          {/* Latest Threads */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                📝 Latest Threads
              </h2>
              <Link
                to="/latest"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View All
              </Link>
            </div>
            <ThreadList 
              threads={latestData?.data || []}
              loading={latestLoading}
            />
          </div>
        </div>

        {/* Categories Preview */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📂 Browse Categories
          </h2>
          {categories.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {categories.map((cat, index) => {
                // Explicit gradient classes - must be complete class names for Tailwind to detect
                let gradientClass = '';
                if (cat.color && cat.color.includes('from-') && cat.color.includes('to-')) {
                  gradientClass = `bg-gradient-to-br ${cat.color}`;
                } else {
                  // Assign by index with hardcoded complete class names
                  const idx = index % 6;
                  if (idx === 0) gradientClass = 'bg-gradient-to-br from-blue-500 to-blue-600';
                  else if (idx === 1) gradientClass = 'bg-gradient-to-br from-red-500 to-red-600';
                  else if (idx === 2) gradientClass = 'bg-gradient-to-br from-purple-500 to-purple-600';
                  else if (idx === 3) gradientClass = 'bg-gradient-to-br from-orange-500 to-orange-600';
                  else if (idx === 4) gradientClass = 'bg-gradient-to-br from-green-500 to-green-600';
                  else gradientClass = 'bg-gradient-to-br from-teal-500 to-teal-600';
                }

                return (
                  <Link
                    key={cat._id}
                    to={`/categories/${cat._id}`}
                    className={`${gradientClass} p-6 rounded-lg text-white hover:shadow-lg transition-shadow shadow-md min-h-[140px]`}
                  >
                    <span className="text-3xl mb-2 block">{cat.icon || '📁'}</span>
                    <h3 className="text-lg font-semibold text-white">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-sm text-white/95 mt-1">{cat.description}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: 'Android Applications', icon: '📱', color: 'from-blue-500 to-blue-600' },
                { name: 'Android Games', icon: '🎮', color: 'from-red-500 to-red-600' },
                { name: 'eBooks', icon: '📚', color: 'from-purple-500 to-purple-600' },
                { name: 'Magazines', icon: '📰', color: 'from-orange-500 to-orange-600' },
                { name: 'Requests', icon: '💬', color: 'from-green-500 to-green-600' },
                { name: 'Off-Topic', icon: '☕', color: 'from-teal-500 to-teal-600' }
              ].map((cat, index) => (
                <Link
                  key={index}
                  to="/categories"
                  className={`bg-gradient-to-br ${cat.color} p-6 rounded-lg text-white hover:shadow-lg transition-shadow shadow-md`}
                >
                  <span className="text-3xl mb-2 block">{cat.icon}</span>
                  <h3 className="text-lg font-semibold">{cat.name}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
