export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num?.toString() || '0';
};

export const getRankColor = (rank) => {
  const colors = {
    'Newbie': 'text-gray-400',
    'Member': 'text-green-400',
    'Senior': 'text-blue-400',
    'Expert': 'text-purple-400',
    'Legend': 'text-yellow-400'
  };
  return colors[rank] || 'text-gray-400';
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const parseBBCode = (content) => {
  if (!content) return '';
  
  return content
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
    .replace(/\[s\](.*?)\[\/s\]/g, '<del>$1</del>')
    .replace(/\[code\](.*?)\[\/code\]/g, '<pre class="bg-gray-800 p-3 rounded overflow-x-auto"><code>$1</code></pre>')
    .replace(/\[quote\](.*?)\[\/quote\]/g, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-2 bg-gray-800/50">$1</blockquote>')
    .replace(/\[quote=(.*?)\](.*?)\[\/quote\]/g, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-2 bg-gray-800/50"><cite class="text-blue-400 font-semibold block mb-1">$1 said:</cite>$2</blockquote>')
    .replace(/\[url\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$2</a>')
    .replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" alt="" class="max-w-full rounded-lg my-2" loading="lazy" />')
    .replace(/\[spoiler\](.*?)\[\/spoiler\]/g, '<details class="my-2"><summary class="cursor-pointer text-blue-400">Spoiler</summary><div class="mt-2 p-3 bg-gray-800 rounded">$1</div></details>')
    .replace(/\n/g, '<br>');
};

export const getReputationRank = (reputation) => {
  if (reputation >= 1000) return 'Legend';
  if (reputation >= 500) return 'Expert';
  if (reputation >= 200) return 'Senior';
  if (reputation >= 50) return 'Member';
  return 'Newbie';
};
