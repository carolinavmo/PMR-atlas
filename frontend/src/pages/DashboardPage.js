import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { 
  BookOpen, Bookmark, FileText, Clock, TrendingUp, 
  ChevronRight, Sparkles, Search
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const DashboardPage = () => {
  const { user, getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentViews, setRecentViews] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const headers = getAuthHeaders();
      
      const [categoriesRes, recentRes, bookmarksRes] = await Promise.all([
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/recent-views`, { headers }),
        axios.get(`${API_URL}/bookmarks`, { headers })
      ]);

      setCategories(categoriesRes.data);
      setRecentViews(recentRes.data.slice(0, 5));
      setBookmarks(bookmarksRes.data.slice(0, 5));
      
      // Calculate total stats
      const totalDiseases = categoriesRes.data.reduce((acc, cat) => acc + cat.disease_count, 0);
      setStats({
        totalDiseases,
        totalCategories: categoriesRes.data.length,
        bookmarkCount: bookmarksRes.data.length,
        recentCount: recentRes.data.length
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in" data-testid="dashboard">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-slate-900 p-6 lg:p-8 border border-blue-200 dark:border-blue-800">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">{getTimeGreeting()}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-lg">
              Continue your learning journey with our comprehensive PMR disease database.
            </p>
            <div className="mt-4">
              <Link to="/search?q=">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="explore-btn">
                  <Search className="w-4 h-4 mr-2" />
                  Explore Diseases
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 opacity-10">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path fill="currentColor" className="text-blue-500" d="M40.5,-62.9C51.9,-54.7,60.1,-42.1,66.1,-28.3C72.1,-14.6,75.9,0.3,73.8,14.7C71.7,29,63.7,42.8,52.2,53.3C40.7,63.8,25.7,71,9.2,74.3C-7.2,77.5,-25.1,76.7,-39.8,69.4C-54.6,62.1,-66.2,48.3,-73.1,32.6C-80,16.9,-82.2,-0.7,-77.7,-16.4C-73.2,-32.1,-62,-45.8,-48.5,-53.5C-35,-61.2,-19.2,-62.8,-2.5,-59.5C14.3,-56.2,29.1,-71.1,40.5,-62.9Z" transform="translate(100 100)" />
            </svg>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover" data-testid="stat-diseases">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Diseases</p>
                  <p className="text-3xl font-heading font-bold mt-1">{stats?.totalDiseases || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover" data-testid="stat-categories">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Categories</p>
                  <p className="text-3xl font-heading font-bold mt-1">{stats?.totalCategories || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-lavender-600 dark:text-lavender-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover" data-testid="stat-bookmarks">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Bookmarks</p>
                  <p className="text-3xl font-heading font-bold mt-1">{stats?.bookmarkCount || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover" data-testid="stat-recent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Recent Views</p>
                  <p className="text-3xl font-heading font-bold mt-1">{stats?.recentCount || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Viewed */}
          <Card data-testid="recent-section">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-heading">Recently Viewed</CardTitle>
              <Link to="/recent">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentViews.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No recently viewed diseases</p>
                  <p className="text-sm">Start exploring to build your history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentViews.map((item) => (
                    <Link 
                      key={item.id} 
                      to={`/disease/${item.disease_id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      data-testid={`recent-item-${item.disease_id}`}
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.disease_name}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.viewed_at).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bookmarks */}
          <Card data-testid="bookmarks-section">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-heading">Your Bookmarks</CardTitle>
              <Link to="/bookmarks">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  View all <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Bookmark className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No bookmarks yet</p>
                  <p className="text-sm">Save diseases for quick access</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((item) => (
                    <Link 
                      key={item.id} 
                      to={`/disease/${item.disease_id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      data-testid={`bookmark-item-${item.disease_id}`}
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.disease_name}</span>
                      <Bookmark className="w-4 h-4 text-amber-500" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories Overview */}
        <Card data-testid="categories-overview">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Browse by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link 
                  key={category.id}
                  to={`/search?category=${category.id}`}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
                  data-testid={`category-card-${category.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {category.disease_count} diseases
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="font-heading font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {category.description}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
