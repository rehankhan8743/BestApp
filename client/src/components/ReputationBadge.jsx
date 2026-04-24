import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Star, TrendingUp, Award, Zap } from 'lucide-react';

const ReputationBadge = ({ reputation, size = 'md' }) => {
  const { user } = useAuth();
  
  const getRank = (rep) => {
    if (rep >= 1000) return { name: 'Legend', color: 'text-yellow-500', bg: 'bg-yellow-100', icon: '⭐' };
    if (rep >= 500) return { name: 'Expert', color: 'text-purple-500', bg: 'bg-purple-100', icon: '🟣' };
    if (rep >= 200) return { name: 'Senior', color: 'text-blue-500', bg: 'bg-blue-100', icon: '🟡' };
    if (rep >= 50) return { name: 'Member', color: 'text-green-500', bg: 'bg-green-100', icon: '🔵' };
    return { name: 'Newbie', color: 'text-gray-500', bg: 'bg-gray-100', icon: '🟢' };
  };

  const rank = getRank(reputation || 0);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${rank.bg} ${rank.color} ${sizeClasses[size]}`}>
      <span>{rank.icon}</span>
      <span>{rank.name}</span>
      {size !== 'sm' && <span className="opacity-75">({reputation})</span>}
    </span>
  );
};

export default ReputationBadge;
