import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { Plus, X } from 'lucide-react';

const NewThreadPage = () => {
  const navigate = useNavigate();
  const { get, post } = useApi();
  
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [threadType, setThreadType] = useState('discussion');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await get('/categories');
      if (res?.success) {
        setCategories(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && tags.length < 5) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !selectedCategory) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await post('/threads', {
        title,
        content,
        categoryId: selectedCategory,
        subcategoryId: selectedSubcategory || undefined,
        type: threadType,
        tags: tags.length > 0 ? tags : undefined
      });

      if (res?.success) {
        navigate(`/thread/${res.data.slug}`);
      } else {
        setError(res?.message || 'Failed to create thread');
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
      setError('Failed to create thread. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCatData = categories.find(c => c._id === selectedCategory);
  const subcategories = selectedCatData?.subcategories || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/categories" className="text-primary hover:underline mb-4 inline-block">
        ← Back to Categories
      </Link>

      <h1 className="text-3xl font-bold mb-2">Create New Thread</h1>
      <p className="text-muted-foreground mb-8">Start a new discussion in the forum</p>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded">
            {error}
          </div>
        )}

        {/* Thread Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Thread Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['discussion', 'release', 'request', 'guide'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setThreadType(type)}
                className={`p-3 rounded border ${
                  threadType === type
                    ? 'bg-primary text-white border-primary'
                    : 'bg-secondary border-border hover:border-primary'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory('');
            }}
            className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Selection (if available) */}
        {subcategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Subcategory
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a subcategory (optional)</option>
              {subcategories.map(sub => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title"
            className="w-full p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={200}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {title.length}/200 characters
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thread content here..."
            className="w-full h-64 p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use BBCode for formatting: [b]bold[/b], [i]italic[/i], [code]code[/code], [quote]quote[/quote]
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Tags (optional, max 5)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag(e)}
              placeholder="Add a tag"
              className="flex-1 p-3 bg-secondary rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={tags.length >= 5}
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={tags.length >= 5 || !tagInput.trim()}
              className="px-4 py-2 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Link
            to="/categories"
            className="px-6 py-2 bg-secondary text-foreground rounded hover:opacity-90"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Thread'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewThreadPage;
