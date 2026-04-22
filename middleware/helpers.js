const slugify = require('slugify');

const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()"'!:@]/g
  });
};

const generateUniqueSlug = async (baseSlug, model, field = 'slug') => {
  let slug = baseSlug;
  let counter = 1;
  while (await model.findOne({ [field]: slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const sanitizeContent = (content) => {
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

const parseBBCode = (content) => {
  let html = content
    .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>')
    .replace(/\[s\](.*?)\[\/s\]/g, '<del>$1</del>')
    .replace(/\[code\](.*?)\[\/code\]/g, '<pre><code>$1</code></pre>')
    .replace(/\[quote\](.*?)\[\/quote\]/g, '<blockquote>$1</blockquote>')
    .replace(/\[quote=(.*?)\](.*?)\[\/quote\]/g, '<blockquote><cite>$1</cite>$2</blockquote>')
    .replace(/\[url\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/g, '<a href="$1" target="_blank" rel="noopener">$2</a>')
    .replace(/\[img\](.*?)\[\/img\]/g, '<img src="$1" alt="" loading="lazy" />')
    .replace(/\[spoiler\](.*?)\[\/spoiler\]/g, '<details><summary>Spoiler</summary>$1</details>')
    .replace(/\[youtube\](.*?)\[\/youtube\]/g, '<div class="video-embed"><iframe src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe></div>')
    .replace(/\n/g, '<br>');
  return html;
};

module.exports = {
  generateSlug,
  generateUniqueSlug,
  formatFileSize,
  sanitizeContent,
  parseBBCode
};
