import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Bookmark, Trash2, ChevronRight, BookmarkX } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const BookmarksPage = () => {
  const { getAuthHeaders } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/bookmarks`, { headers });
      setBookmarks(response.data);
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (diseaseId) => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/bookmarks/${diseaseId}`, { headers });
      setBookmarks(prev => prev.filter(b => b.disease_id !== diseaseId));
      toast.success('Bookmark removed');
    } catch (err) {
      toast.error('Failed to remove bookmark');
    }
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
      <div className="max-w-3xl mx-auto" data-testid="bookmarks-page">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
            Your Bookmarks
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Quick access to your saved diseases
          </p>
        </div>

        {bookmarks.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookmarkX className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-heading font-semibold mb-2">No bookmarks yet</h3>
              <p className="text-slate-500 mb-4">
                Bookmark diseases to access them quickly later
              </p>
              <Link to="/search">
                <Button className="bg-sage-600 hover:bg-sage-700">
                  Browse Diseases
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="card-hover" data-testid={`bookmark-${bookmark.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <Link 
                      to={`/disease/${bookmark.disease_id}`}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Bookmark className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-slate-900 dark:text-white">
                          {bookmark.disease_name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Saved on {new Date(bookmark.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBookmark(bookmark.disease_id)}
                        className="text-slate-400 hover:text-red-500"
                        data-testid={`remove-bookmark-${bookmark.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Link to={`/disease/${bookmark.disease_id}`}>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
