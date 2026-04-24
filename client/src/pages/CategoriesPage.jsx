import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { MessageSquare, Eye, Clock, TrendingUp } from 'lucide-react';

const CategoriesPage = () => {
  const { slug } = useParams();
  const { get } = useApi();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, [slug]);

  const loadCategories = async () => {
    try {
      const res = await get('/categories');
      if (res?.success) {
        let data = res.data;
        
        if (slug) {
          const found = data.find(c => c.slug === slug);
          if (found) {
            setSelectedCategory(found);
            if (found.subcategories?.length > 0) {
              data = found.subcategories;
            }
          }
        }
        
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {selectedCategory && (
        <Link 
          to="/categories" 
          className="text-primary hover:underline mb-4 inline-block"
        >
          ← Back to Categories
        </Link>
      )}
      
      <h1 className="text-3xl font-bold mb-2">
        {selectedCategory ? selectedCategory.name : 'All Categories'}
      </h1>
      <p className="text-muted-foreground mb-8">
        {selectedCategory ? selectedCategory.description : 'Browse all forum categories'}
      </p>

      <div className="space-y-4">
        {categories.map(category => (
          <div 
            key={category._id}
            className="bg-card rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link 
                  to={category.subcategories?.length > 0 
                    ? `/category/${category.slug}` 
                    : `/category/${category.slug}`
                  }
                  className="text-xl font-semibold text-primary hover:underline"
                >
                  {category.name}
                </Link>
                <p className="text-muted-foreground mt-1">{category.description}</p>
                
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {category.threadCount || 0} threads
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {category.postCount || 0} posts
                  </span>
                </div>
              </div>
              
              {category.icon && (
                <div className="text-4xl ml-4">{category.icon}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
