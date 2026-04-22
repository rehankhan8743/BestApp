/**
 * Helper utility functions
 */

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - Input text
 * @returns {string} Slug
 */
function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w-]+/g, '')     // Remove all non-word chars
    .replace(/--+/g, '-')        // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start
    .replace(/-+$/, '');         // Trim - from end
}

/**
 * Generate a unique slug by adding a random suffix if needed
 * @param {string} text - Input text
 * @returns {string} Unique slug
 */
function generateUniqueSlug(text) {
  const baseSlug = generateSlug(text);
  const randomSuffix = Math.random().toString(36).substring(2, 7); // 5 char random
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Format date to readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate time ago from a date
 * @param {Date} date - Date object
 * @returns {string} Time ago string (e.g., "2 hours ago")
 */
function timeAgo(date) {
  if (!date) return '';
  
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (!str) return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Parse BBCode to HTML (basic implementation)
 * @param {string} text - Text with BBCode
 * @returns {string} HTML
 */
function parseBBCode(text) {
  if (!text) return '';
  
  let html = text;
  
  // Bold
  html = html.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>');
  
  // Underline
  html = html.replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
  
  // Code
  html = html.replace(/\[code\](.*?)\[\/code\]/g, '<pre><code>$1</code></pre>');
  
  // Quote
  html = html.replace(/\[quote\](.*?)\[\/quote\]/g, '<blockquote>$1</blockquote>');
  
  // URL
  html = html.replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank">$2</a>');
  html = html.replace(/\[url\](.*?)\[\/url\]/g, '<a href="$1" target="_blank">$1</a>');
  
  // Image
  html = html.replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" alt="image" style="max-width: 100%;">');
  
  // Spoiler
  html = html.replace(/\[spoiler\](.*?)\[\/spoiler\]/g, '<span class="spoiler">$1</span>');
  
  return html;
}

module.exports = {
  generateSlug,
  generateUniqueSlug,
  formatDate,
  timeAgo,
  sanitizeString,
  parseBBCode
};
