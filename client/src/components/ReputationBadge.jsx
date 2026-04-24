import { Award, Star, TrendingUp } from 'lucide-react';

const ReputationBadge = ({ reputation = 0, size = 'md', showLabel = true }) => {
  const getRank = (rep) => {
    if (rep >= 1000) return { name: 'Legend', color: 'from-yellow-400 to-orange-500', icon: Award };
    if (rep >= 500) return { name: 'Expert', color: 'from-purple-400 to-pink-500', icon: Star };
    if (rep >= 200) return { name: 'Senior', color: 'from-blue-400 to-cyan-500', icon: TrendingUp };
    if (rep >= 50) return { name: 'Member', color: 'from-green-400 to-emerald-500', icon: Star };
    return { name: 'Newbie', color: 'from-gray-400 to-gray-500', icon: Star };
  };

  const sizes = {
    sm: { badge: 'w-8 h-8', text: 'text-xs', rep: 'text-sm' },
    md: { badge: 'w-12 h-12', text: 'text-sm', rep: 'text-lg' },
    lg: { badge: 'w-16 h-16', text: 'text-base', rep: 'text-2xl' },
    xl: { badge: 'w-20 h-20', text: 'text-lg', rep: 'text-3xl' }
  };

  const rank = getRank(reputation);
  const Icon = rank.icon;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className="inline-flex items-center gap-3">
      <div className={`relative ${sizeClass.badge} rounded-full bg-gradient-to-br ${rank.color} flex items-center justify-center shadow-lg`}>
        <Icon className="w-1/2 h-1/2 text-white" />
      </div>
      {showLabel && (
        <div>
          <div className={`font-bold text-gray-800 ${sizeClass.rep}`}>{reputation}</div>
          <div className={`text-gray-500 ${sizeClass.text}`}>{rank.name}</div>
        </div>
      )}
    </div>
  );
};

export default ReputationBadge;
