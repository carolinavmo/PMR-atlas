import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { Clock, ChevronRight, History } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const RecentPage = () => {
  const { getAuthHeaders } = useAuth();
  const [recentViews, setRecentViews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentViews();
  }, []);

  const fetchRecentViews = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/recent-views`, { headers });
      setRecentViews(response.data);
    } catch (err) {
      console.error('Failed to fetch recent views:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto" data-testid="recent-page">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
            Recently Viewed
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Your browsing history (last 20 items)
          </p>
        </div>

        {recentViews.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <History className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-heading font-semibold mb-2">No history yet</h3>
              <p className="text-slate-500 mb-4">
                Start exploring diseases to build your history
              </p>
              <Link to="/search">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Browse Diseases
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentViews.map((view) => (
              <Link 
                key={view.id} 
                to={`/disease/${view.disease_id}`}
                data-testid={`recent-${view.id}`}
              >
                <Card className="card-hover">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-slate-900 dark:text-white">
                            {view.disease_name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Viewed {formatDate(view.viewed_at)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
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
