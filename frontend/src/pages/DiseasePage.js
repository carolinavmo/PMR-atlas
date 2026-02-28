import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Bookmark, BookmarkCheck, FileText, ChevronRight, Edit,
  ArrowLeft, Share2, Printer, Clock
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const sections = [
  { id: 'definition', label: 'Definition' },
  { id: 'epidemiology', label: 'Epidemiology' },
  { id: 'pathophysiology', label: 'Pathophysiology' },
  { id: 'biomechanics', label: 'Biomechanics' },
  { id: 'clinical_presentation', label: 'Clinical Presentation' },
  { id: 'physical_examination', label: 'Physical Examination' },
  { id: 'imaging_findings', label: 'Imaging Findings' },
  { id: 'differential_diagnosis', label: 'Differential Diagnosis' },
  { id: 'treatment_conservative', label: 'Conservative Treatment' },
  { id: 'treatment_interventional', label: 'Interventional Treatment' },
  { id: 'treatment_surgical', label: 'Surgical Treatment' },
  { id: 'rehabilitation_protocol', label: 'Rehabilitation Protocol' },
  { id: 'prognosis', label: 'Prognosis' },
  { id: 'references', label: 'References' },
];

export const DiseasePage = () => {
  const { id } = useParams();
  const { getAuthHeaders, isEditor } = useAuth();
  
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [note, setNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [activeSection, setActiveSection] = useState('definition');

  useEffect(() => {
    if (id) {
      fetchDisease();
      checkBookmark();
      fetchNote();
      recordView();
    }
  }, [id]);

  const fetchDisease = async () => {
    try {
      const response = await axios.get(`${API_URL}/diseases/${id}`);
      setDisease(response.data);
    } catch (err) {
      console.error('Failed to fetch disease:', err);
      toast.error('Failed to load disease');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmark = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/bookmarks`, { headers });
      const bookmarked = response.data.some(b => b.disease_id === id);
      setIsBookmarked(bookmarked);
    } catch (err) {
      console.error('Failed to check bookmark:', err);
    }
  };

  const fetchNote = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await axios.get(`${API_URL}/notes/${id}`, { headers });
      if (response.data) {
        setNote(response.data.content);
      }
    } catch (err) {
      // No note exists
    }
  };

  const recordView = async () => {
    try {
      const headers = getAuthHeaders();
      await axios.post(`${API_URL}/recent-views/${id}`, {}, { headers });
    } catch (err) {
      console.error('Failed to record view:', err);
    }
  };

  const toggleBookmark = async () => {
    try {
      const headers = getAuthHeaders();
      if (isBookmarked) {
        await axios.delete(`${API_URL}/bookmarks/${id}`, { headers });
        setIsBookmarked(false);
        toast.success('Bookmark removed');
      } else {
        await axios.post(`${API_URL}/bookmarks`, { disease_id: id }, { headers });
        setIsBookmarked(true);
        toast.success('Disease bookmarked');
      }
    } catch (err) {
      toast.error('Failed to update bookmark');
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      const headers = getAuthHeaders();
      await axios.post(`${API_URL}/notes`, {
        disease_id: id,
        content: note
      }, { headers });
      toast.success('Note saved');
    } catch (err) {
      toast.error('Failed to save note');
    } finally {
      setSavingNote(false);
    }
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

  const renderContent = (content) => {
    if (!content) return <p className="text-slate-400 italic">No information available</p>;
    
    // Handle array content (like references)
    if (Array.isArray(content)) {
      if (content.length === 0) return <p className="text-slate-400 italic">No references</p>;
      return (
        <ol className="list-decimal list-inside space-y-2">
          {content.map((item, i) => (
            <li key={i} className="text-slate-600 dark:text-slate-400">{item}</li>
          ))}
        </ol>
      );
    }
    
    // Handle string content with line breaks and lists
    const lines = content.split('\n').filter(line => line.trim());
    
    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          if (line.startsWith('- ')) {
            return (
              <div key={i} className="flex gap-2 text-slate-600 dark:text-slate-400">
                <span className="text-sage-500 mt-1">•</span>
                <span>{line.substring(2)}</span>
              </div>
            );
          }
          return (
            <p key={i} className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!disease) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-heading font-bold mb-2">Disease Not Found</h2>
          <p className="text-slate-500 mb-4">The disease you're looking for doesn't exist.</p>
          <Link to="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex gap-6" data-testid="disease-page">
        {/* Main Content */}
        <div className="flex-1 max-w-4xl">
          {/* Back Button */}
          <Link to="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <Badge variant="outline" className="mb-2 text-sage-600 border-sage-300">
                  {disease.category_name}
                </Badge>
                <h1 className="text-3xl lg:text-4xl font-heading font-bold text-slate-900 dark:text-white" data-testid="disease-title">
                  {disease.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                {isEditor && (
                  <Link to={`/admin/diseases/${disease.id}/edit`}>
                    <Button variant="outline" size="sm" data-testid="edit-btn">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleBookmark}
                  className={isBookmarked ? 'text-amber-600 border-amber-300' : ''}
                  data-testid="bookmark-btn"
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4 mr-1" />
                  ) : (
                    <Bookmark className="w-4 h-4 mr-1" />
                  )}
                  {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotes(!showNotes)}
                  data-testid="notes-toggle"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Notes
                </Button>
              </div>
            </div>

            {/* Tags */}
            {disease.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {disease.tags.map((tag) => (
                  <span key={tag} className={getTagClass(tag)} data-testid={`tag-${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes Panel */}
          {showNotes && (
            <Card className="mb-6" data-testid="notes-panel">
              <CardContent className="pt-6">
                <h3 className="text-lg font-heading font-semibold mb-3">Personal Notes</h3>
                <Textarea
                  placeholder="Write your notes about this disease..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[120px] mb-3"
                  data-testid="notes-textarea"
                />
                <Button 
                  onClick={saveNote} 
                  disabled={savingNote}
                  className="bg-sage-600 hover:bg-sage-700"
                  data-testid="save-notes-btn"
                >
                  {savingNote ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Content Sections */}
          <div className="space-y-6 disease-content">
            {sections.map((section) => {
              const content = section.id === 'references' ? disease.references : disease[section.id];
              if (!content || (Array.isArray(content) && content.length === 0 && section.id !== 'references')) return null;
              
              return (
                <Card key={section.id} id={section.id} className="scroll-mt-20" data-testid={`section-${section.id}`}>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-heading font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                      {section.label}
                    </h3>
                    {renderContent(content)}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Version Info */}
          <div className="mt-8 text-sm text-slate-400 flex items-center gap-4">
            <span>Version {disease.version}</span>
            <span>•</span>
            <span>Last updated: {new Date(disease.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Right Sidebar - Table of Contents */}
        <div className="hidden xl:block w-64 shrink-0">
          <div className="sticky top-24">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  On This Page
                </h3>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <nav className="space-y-1">
                    {sections.map((section) => {
                      const content = section.id === 'references' ? disease.references : disease[section.id];
                      if (!content || (Array.isArray(content) && content.length === 0 && section.id !== 'references')) return null;
                      
                      return (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          className={`toc-item block py-1.5 text-sm transition-colors ${
                            activeSection === section.id
                              ? 'active text-sage-600 font-medium'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                          onClick={() => setActiveSection(section.id)}
                        >
                          {section.label}
                        </a>
                      );
                    })}
                  </nav>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
