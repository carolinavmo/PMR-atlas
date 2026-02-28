import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { Search, Filter, ChevronRight, X } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialTag = searchParams.get('tag') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [diseases, setDiseases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, []);

  useEffect(() => {
    fetchDiseases();
  }, [initialQuery, initialCategory, initialTag]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API_URL}/tags`);
      setTags(response.data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const fetchDiseases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (initialQuery) params.append('search', initialQuery);
      if (initialCategory) params.append('category_id', initialCategory);
      if (initialTag) params.append('tag', initialTag);

      const response = await axios.get(`${API_URL}/diseases?${params.toString()}`);
      setDiseases(response.data);
    } catch (err) {
      console.error('Failed to fetch diseases:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateSearch({ q: query });
  };

  const updateSearch = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('');
    setSelectedTag('');
    setSearchParams({});
  };

  const getTagClass = (tag) => {
    const tagClasses = {
      acute: 'tag-badge acute',
      chronic: 'tag-badge chronic',
      traumatic: 'tag-badge traumatic',
      degenerative: 'tag-badge degenerative',
      neurological: 'tag-badge neurological',
      developmental: 'tag-badge developmental',
      neuropathic: 'tag-badge neuropathic',
      compressive: 'tag-badge compressive',
    };
    return tagClasses[tag] || 'tag-badge';
  };

  const hasActiveFilters = initialQuery || initialCategory || initialTag;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto" data-testid="search-page">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
            Search Diseases
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Find diseases by name, category, or tag
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by disease name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="search-btn">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Filter className="w-4 h-4" />
                <span>Filters:</span>
              </div>

              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  updateSearch({ category: value === 'all' ? '' : value });
                }}
              >
                <SelectTrigger className="w-[200px]" data-testid="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedTag}
                onValueChange={(value) => {
                  setSelectedTag(value);
                  updateSearch({ tag: value === 'all' ? '' : value });
                }}
              >
                <SelectTrigger className="w-[150px]" data-testid="tag-filter">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {tags.map((t) => (
                    <SelectItem key={t.tag} value={t.tag}>
                      {t.tag} ({t.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                  <X className="w-4 h-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {loading ? 'Loading...' : `${diseases.length} results found`}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : diseases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Search className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-heading font-semibold mb-2">No diseases found</h3>
              <p className="text-slate-500 mb-4">
                Try adjusting your search or filters
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {diseases.map((disease) => (
              <Link key={disease.id} to={`/disease/${disease.id}`} data-testid={`result-${disease.id}`}>
                <Card className="card-hover transition-all">
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                            {disease.category_name}
                          </Badge>
                          {disease.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className={`${getTagClass(tag)} text-xs`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-lg font-heading font-semibold text-slate-900 dark:text-white mb-2">
                          {disease.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                          {disease.definition}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 ml-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
