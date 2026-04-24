import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, User, Clock } from 'lucide-react';
import { formatDate, formatNumber, getReputationRank, getRankColor } from '../utils/helpers';

const ThreadCard = ({ thread }) => {
  const rank = getReputationRank(thread.author?.reputation || 0);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-4">
        {/* Thread Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Link 
              to={`/thread/${thread.slug}`}
              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              {thread.title}
            </Link>
            {thread.tags && thread.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {thread.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Thread Status Badges */}
          <div className="flex gap-2 ml-2">
            {thread.isPinned && (
              <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 rounded">
                📌 Pinned
              </span>
            )}
            {thread.isLocked && (
              <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded">
                🔒 Locked
              </span>
            )}
          </div>
        </div>
        
        {/* Thread Preview */}
        {thread.preview && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {thread.preview}
          </p>
        )}
        
        {/* Thread Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          {/* Author Info */}
          <div className="flex items-center gap-3">
            <Link 
              to={`/user/${thread.author?.username}`}
              className="flex items-center gap-2 hover:text-blue-500 transition-colors"
            >
              {thread.author?.avatar ? (
                <img 
                  src={thread.author.avatar} 
                  alt={thread.author.username}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {thread.author?.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="font-medium">{thread.author?.username}</span>
              <span className={`text-xs ${getRankColor(rank)}`}>• {rank}</span>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1" title="Replies">
              <MessageSquare className="w-4 h-4" />
              <span>{formatNumber(thread.repliesCount || 0)}</span>
            </div>
            <div className="flex items-center gap-1" title="Views">
              <User className="w-4 h-4" />
              <span>{formatNumber(thread.views || 0)}</span>
            </div>
            <div className="flex items-center gap-1" title="Created">
              <Clock className="w-4 h-4" />
              <span>{formatDate(thread.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Footer */}
      {thread.category && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
          <Link 
            to={`/category/${thread.category.slug}`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {thread.category.name}
          </Link>
        </div>
      )}
    </div>
  );
};

export default ThreadCard;
