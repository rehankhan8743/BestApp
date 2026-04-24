import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, Lock, Pin } from 'lucide-react';
import { formatDate, formatNumber } from '../utils/helpers';

const ThreadList = ({ threads, loading, error }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
        <MessageSquare className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No threads yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Be the first to start a discussion!
        </p>
        <Link
          to="/new-thread"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Create Thread
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <div
          key={thread._id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {thread.isPinned && (
                    <Pin className="w-4 h-4 text-yellow-500" />
                  )}
                  {thread.isLocked && (
                    <Lock className="w-4 h-4 text-red-500" />
                  )}
                  <Link
                    to={`/thread/${thread.slug}`}
                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400"
                  >
                    {thread.title}
                  </Link>
                </div>
                
                {thread.preview && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {thread.preview}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <Link
                    to={`/user/${thread.author?.username}`}
                    className="hover:text-blue-500 transition-colors"
                  >
                    @{thread.author?.username}
                  </Link>
                  <span>•</span>
                  <span>{formatDate(thread.createdAt)}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {formatNumber(thread.repliesCount || 0)} replies
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {formatNumber(thread.views || 0)} views
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {thread.category && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
              <Link
                to={`/category/${thread.category.slug}`}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {thread.category.name}
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ThreadList;
