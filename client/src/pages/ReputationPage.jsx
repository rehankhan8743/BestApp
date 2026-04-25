import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApiCall } from '../hooks/useApi.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  Trophy, TrendingUp, Award, Star, ArrowUp, ArrowDown,
  Calendar, Medal, Crown, Target, Activity
} from 'lucide-react';
import ReputationBadge from '../components/ReputationBadge.jsx';

const ReputationPage = () => {
  const { username } = useParams();
  const { call } = useApiCall();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [reputationHistory, setReputationHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    loadReputation();
  }, [username, timeFilter]);

  const loadReputation = async () => {
    try {
      setLoading(true);

      // Load user profile
      const profileRes = await call('get', `/users/${username}`);
      if (profileRes?.success) {
        setUser(profileRes.data);
      }

      // Load reputation history
      const historyRes = await call('get', `/users/${username}/reputation?period=${timeFilter}`);
      if (historyRes?.success) {
        setReputationHistory(historyRes.data.history || []);
        setStats(historyRes.data.stats || {});
      }
    } catch (error) {
      console.error('Failed to load reputation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankInfo = (reputation) => {
    if (reputation >= 1000) return { 
      name: 'Legend', 
      icon: '⭐', 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-100',
      next: null,
      progress: 100
    };
    if (reputation >= 500) return { 
      name: 'Expert', 
      icon: '🟣', 
      color: 'text-purple-500', 
      bg: 'bg-purple-100',
      next: 1000,
      progress: ((reputation - 500) / 500) * 100
    };
    if (reputation >= 200) return { 
      name: 'Senior', 
      icon: '🟡', 
      color: 'text-blue-500', 
      bg: 'bg-blue-100',
      next: 500,
      progress: ((reputation - 200) / 300) * 100
    };
    if (reputation >= 50) return { 
      name: 'Member', 
      icon: '🔵', 
      color: 'text-green-500', 
      bg: 'bg-green-100',
      next: 200,
      progress: ((reputation - 50) / 150) * 100
    };
    return { 
      name: 'Newbie', 
      icon: '🟢', 
      color: 'text-gray-500', 
      bg: 'bg-gray-100',
      next: 50,
      progress: (reputation / 50) * 100
    };
  };

  const getEventTypeIcon = (type) => {
    switch(type) {
      case 'upvote_received': return { icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-100', points: 10 };
      case 'downvote_received': return { icon: ArrowDown, color: 'text-red-500', bg: 'bg-red-100', points: -5 };
      case 'best_answer': return { icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-100', points: 50 };
      case 'thread_liked': return { icon: Star, color: 'text-blue-500', bg: 'bg-blue-100', points: 5 };
      case 'post_liked': return { icon: Star, color: 'text-blue-500', bg: 'bg-blue-100', points: 3 };
      case 'daily_bonus': return { icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-100', points: 5 };
      default: return { icon: Activity, color: 'text-gray-500', bg: 'bg-gray-100', points: 0 };
    }
  };

  const currentRank = getRankInfo(user?.reputation || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">User not found</h1>
          <Link to="/" className="text-blue-600 hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-20 h-20 rounded-full border-4 border-white" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold">{user.username}</h1>
                  <div className="mt-2">
                    <ReputationBadge reputation={user.reputation} size="lg" />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold mb-2">{user.reputation || 0}</div>
              <div className="text-blue-100">Total Reputation Points</div>
            </div>
          </div>
        </div>

        {/* Rank Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Current Rank: {currentRank.name}
          </h2>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress to {currentRank.next ? currentRank.next + ' pts' : 'Max Rank'}</span>
              <span className="font-medium">{Math.round(currentRank.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${currentRank.bg.replace('bg-', 'bg-').replace('100', '500')}`}
                style={{ width: `${currentRank.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Rank Ladder */}
          <div className="grid grid-cols-5 gap-2 mt-6">
            {[
              { name: 'Newbie', min: 0, icon: '🟢' },
              { name: 'Member', min: 50, icon: '🔵' },
              { name: 'Senior', min: 200, icon: '🟡' },
              { name: 'Expert', min: 500, icon: '🟣' },
              { name: 'Legend', min: 1000, icon: '⭐' }
            ].map((rank) => (
              <div 
                key={rank.name}
                className={`p-3 rounded-lg text-center transition-all ${
                  (user.reputation || 0) >= rank.min 
                    ? `${getRankInfo(rank.min).bg} ${getRankInfo(rank.min).color} ring-2 ring-current`
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">{rank.icon}</div>
                <div className="text-xs font-medium">{rank.name}</div>
                <div className="text-xs opacity-75">{rank.min}+</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.upvotesReceived || 0}</div>
                <div className="text-sm text-gray-500">Upvotes Received</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.downvotesReceived || 0}</div>
                <div className="text-sm text-gray-500">Downvotes Received</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.bestAnswers || 0}</div>
                <div className="text-sm text-gray-500">Best Answers</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{stats?.totalLikes || 0}</div>
                <div className="text-sm text-gray-500">Total Likes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-6 h-6" />
              Reputation History
            </h2>
            <div className="flex gap-2">
              {['week', 'month', 'year', 'all'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeFilter === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {reputationHistory.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No Activity Yet</h3>
              <p className="text-gray-500">Reputation changes will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reputationHistory.map((item, index) => {
                const EventIcon = getEventTypeIcon(item.type).icon;
                const { color, bg, points } = getEventTypeIcon(item.type);
                
                return (
                  <div 
                    key={item._id || index}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                      <EventIcon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800 capitalize">
                          {item.type.replace(/_/g, ' ')}
                        </h4>
                        <span className={`font-bold ${points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {points > 0 ? '+' : ''}{points}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {item.description || `Received ${points > 0 ? '+' : ''}${points} reputation`}
                      </p>
                      {item.thread && (
                        <Link 
                          to={`/thread/${item.thread.slug}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {item.thread.title}
                        </Link>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* How to Earn Points */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            How to Earn Reputation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <ArrowUp className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Upvote received on post</span>
              <span className="ml-auto font-bold text-green-600">+10</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Star className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">Thread liked</span>
              <span className="ml-auto font-bold text-blue-600">+5</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Star className="w-5 h-5 text-blue-500" />
              <span className="text-gray-700">Post liked</span>
              <span className="ml-auto font-bold text-blue-600">+3</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-700">Best answer marked</span>
              <span className="ml-auto font-bold text-yellow-600">+50</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Calendar className="w-5 h-5 text-purple-500" />
              <span className="text-gray-700">Daily login bonus</span>
              <span className="ml-auto font-bold text-purple-600">+5</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <ArrowDown className="w-5 h-5 text-red-500" />
              <span className="text-gray-700">Downvote received</span>
              <span className="ml-auto font-bold text-red-600">-5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReputationPage;
