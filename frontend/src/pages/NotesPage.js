import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { FileText, Trash2, ChevronRight, FileX } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const NotesPage = () => {
  const { getAuthHeaders } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/notes`, { headers });
      setNotes(response.data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/notes/${noteId}`, { headers });
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success('Note deleted');
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto" data-testid="notes-page">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
            My Notes
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Your personal notes on diseases
          </p>
        </div>

        {notes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileX className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-heading font-semibold mb-2">No notes yet</h3>
              <p className="text-slate-500 mb-4">
                Add notes to diseases while studying
              </p>
              <Link to="/search">
                <Button className="bg-sage-600 hover:bg-sage-700">
                  Browse Diseases
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <Card key={note.id} className="card-hover" data-testid={`note-${note.id}`}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between mb-3">
                    <Link to={`/disease/${note.disease_id}`} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-lavender-600 dark:text-lavender-400" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-slate-900 dark:text-white">
                          {note.disease_name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Last updated: {new Date(note.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNote(note.id)}
                        className="text-slate-400 hover:text-red-500"
                        data-testid={`delete-note-${note.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Link to={`/disease/${note.disease_id}`}>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="pl-13 ml-[52px]">
                    <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 whitespace-pre-line">
                      {note.content}
                    </p>
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
