import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { SectionMedia } from '../components/editor/SectionMedia';
import { DiseaseSearch } from '../components/DiseaseSearch';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Bookmark, BookmarkCheck, FileText, Pencil, Check, X,
  ArrowLeft, Save, Clock, Loader2, Globe, AlertTriangle, User, Image
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Section definitions with translation keys
const sectionDefs = [
  { id: 'definition', key: 'definition' },
  { id: 'epidemiology', key: 'epidemiology' },
  { id: 'pathophysiology', key: 'pathophysiology' },
  { id: 'biomechanics', key: 'biomechanics' },
  { id: 'clinical_presentation', key: 'clinicalPresentation' },
  { id: 'physical_examination', key: 'physicalExamination' },
  { id: 'imaging_findings', key: 'imagingFindings' },
  { id: 'differential_diagnosis', key: 'differentialDiagnosis' },
  { id: 'treatment_conservative', key: 'conservativeTreatment' },
  { id: 'treatment_interventional', key: 'interventionalTreatment' },
  { id: 'treatment_surgical', key: 'surgicalTreatment' },
  { id: 'rehabilitation_protocol', key: 'rehabilitationProtocol' },
  { id: 'prognosis', key: 'prognosis' },
  { id: 'references', key: 'references' },
];

const LANGUAGE_NAMES = {
  en: 'English',
  pt: 'Português',
  es: 'Español'
};

export const DiseasePage = () => {
  const { id } = useParams();
  const { getAuthHeaders, isAdmin } = useAuth();
  const { currentLanguage, t, languages } = useLanguage();
  
  // Generate sections with translated labels
  const sections = sectionDefs.map(s => ({
    id: s.id,
    label: t(s.key)
  }));
  
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [note, setNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [activeSection, setActiveSection] = useState('definition');
  
  // Per-section editing state
  const [editingSection, setEditingSection] = useState(null); // Which section is being edited
  const [editedContent, setEditedContent] = useState(''); // Content being edited
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [showTranslateConfirm, setShowTranslateConfirm] = useState(false);
  
  // Per-section media editing state
  const [editingMediaSection, setEditingMediaSection] = useState(null); // Which section's media is being edited
  const [savingMedia, setSavingMedia] = useState(false);

  const contentRef = useRef(null);
  const sectionRefs = useRef({});

  useEffect(() => {
    if (id) {
      fetchDisease();
      checkBookmark();
      fetchNote();
      recordView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Cancel editing if language changes
  useEffect(() => {
    if (editingSection) {
      cancelSectionEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);

  // Scroll spy for TOC
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const scrollPosition = window.scrollY + 150;
      
      for (const section of sections) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [disease, sections]);

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

  // Start editing a section
  const startSectionEdit = (sectionId) => {
    const content = getCurrentContent(sectionId);
    setEditingSection(sectionId);
    setEditedContent(content || '');
  };

  // Cancel editing
  const cancelSectionEdit = () => {
    setEditingSection(null);
    setEditedContent('');
  };

  // Save only the current language for this section
  const saveSectionCurrentLanguage = async () => {
    if (!editingSection) return;
    
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      await axios.put(
        `${API_URL}/diseases/${id}/inline-save`,
        {
          language: currentLanguage,
          section_id: editingSection,
          content: editedContent
        },
        { headers }
      );
      
      await fetchDisease();
      setEditingSection(null);
      setEditedContent('');
      toast.success(`Saved in ${LANGUAGE_NAMES[currentLanguage]}`);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Save and translate this section to other languages
  const saveSectionAndTranslate = async () => {
    setShowTranslateConfirm(false);
    if (!editingSection) return;
    
    setSaving(true);
    setTranslating(true);
    
    try {
      const headers = getAuthHeaders();
      const targetLanguages = languages.map(l => l.code);
      
      await axios.put(
        `${API_URL}/diseases/${id}/inline-save-translate`,
        {
          source_language: currentLanguage,
          section_id: editingSection,
          content: editedContent,
          target_languages: targetLanguages
        },
        { headers }
      );
      
      await fetchDisease();
      setEditingSection(null);
      setEditedContent('');
      toast.success('Saved and translated to all languages');
    } catch (err) {
      console.error('Save & translate error:', err);
      toast.error('Failed to save and translate');
    } finally {
      setSaving(false);
      setTranslating(false);
    }
  };

  // Start editing media for a section
  const startMediaEdit = (sectionId) => {
    setEditingMediaSection(sectionId);
  };

  // Cancel media editing
  const cancelMediaEdit = () => {
    setEditingMediaSection(null);
  };

  // Save section media
  const saveSectionMedia = async (sectionId, newMedia) => {
    setSavingMedia(true);
    try {
      const headers = getAuthHeaders();
      await axios.put(
        `${API_URL}/diseases/${id}/section-media`,
        {
          section_id: sectionId,
          media: newMedia
        },
        { headers }
      );
      
      await fetchDisease();
      setEditingMediaSection(null);
      toast.success('Media saved successfully');
    } catch (err) {
      console.error('Save media error:', err);
      toast.error('Failed to save media');
    } finally {
      setSavingMedia(false);
    }
  };

  const scrollToSection = (sectionId) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(sectionId);
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

  const getCurrentContent = (sectionId) => {
    // For non-English, check for translated content
    if (currentLanguage !== 'en') {
      const translatedKey = `${sectionId}_${currentLanguage}`;
      if (disease?.[translatedKey]) {
        return disease[translatedKey];
      }
    }
    
    // Default to original content
    if (sectionId === 'references') {
      return disease?.references || [];
    }
    return disease?.[sectionId] || '';
  };

  const getDiseaseName = () => {
    if (currentLanguage !== 'en') {
      const translatedName = disease?.[`name_${currentLanguage}`];
      if (translatedName) return translatedName;
    }
    return disease?.name || '';
  };

  // Get section edit metadata
  const getSectionEditMeta = (sectionId) => {
    const metaKey = `${sectionId}_edit_meta`;
    return disease?.[metaKey] || null;
  };

  // Format relative time
  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSectionMedia = (sectionId) => {
    const mediaKey = `${sectionId}_media`;
    return disease?.[mediaKey] || [];
  };

  // Convert markdown text to JSX with formatting
  const parseFormattedText = (text) => {
    if (!text) return text;
    
    // Split into lines
    const lines = text.split('\n');
    const result = [];
    let currentList = [];
    let listType = null;
    
    const processInlineFormatting = (line) => {
      const parts = [];
      let remaining = line;
      let key = 0;
      
      while (remaining.length > 0) {
        // Bold: **text**
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Italic: *text* (but not **)
        const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);
        
        let firstMatch = null;
        let matchType = null;
        
        if (boldMatch && (!italicMatch || boldMatch.index <= italicMatch.index)) {
          firstMatch = boldMatch;
          matchType = 'bold';
        } else if (italicMatch) {
          firstMatch = italicMatch;
          matchType = 'italic';
        }
        
        if (firstMatch) {
          if (firstMatch.index > 0) {
            parts.push(<span key={key++}>{remaining.substring(0, firstMatch.index)}</span>);
          }
          
          if (matchType === 'bold') {
            parts.push(<strong key={key++} className="font-semibold">{firstMatch[1]}</strong>);
          } else {
            parts.push(<em key={key++} className="italic">{firstMatch[1]}</em>);
          }
          
          remaining = remaining.substring(firstMatch.index + firstMatch[0].length);
        } else {
          parts.push(<span key={key++}>{remaining}</span>);
          break;
        }
      }
      
      return parts.length > 0 ? parts : line;
    };
    
    const flushList = () => {
      if (currentList.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        const listClass = listType === 'ol' 
          ? 'list-decimal list-inside space-y-1 ml-4' 
          : 'list-disc list-inside space-y-1 ml-4';
        result.push(
          <ListTag key={result.length} className={listClass}>
            {currentList.map((item, idx) => (
              <li key={idx}>{processInlineFormatting(item)}</li>
            ))}
          </ListTag>
        );
        currentList = [];
        listType = null;
      }
    };
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Unordered list: "- " at START of line (with optional leading spaces)
      const unorderedMatch = line.match(/^(\s*)- (.+)$/);
      if (unorderedMatch) {
        if (listType && listType !== 'ul') {
          flushList();
        }
        listType = 'ul';
        currentList.push(unorderedMatch[2]);
        return;
      }
      
      // Ordered list: "1. ", "2. " etc at start of line
      const orderedMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
      if (orderedMatch) {
        if (listType && listType !== 'ol') {
          flushList();
        }
        listType = 'ol';
        currentList.push(orderedMatch[2]);
        return;
      }
      
      // Not a list item - flush any existing list
      flushList();
      
      // Empty line
      if (!trimmedLine) {
        result.push(<br key={result.length} />);
        return;
      }
      
      // Regular text
      result.push(
        <p key={result.length} className="mb-2 last:mb-0">
          {processInlineFormatting(trimmedLine)}
        </p>
      );
    });
    
    // Flush any remaining list
    flushList();
    
    return result;
  };

  const renderSectionContent = (sectionId, content) => {
    if (sectionId === 'references' && Array.isArray(content)) {
      if (content.length === 0) {
        return <p className="text-slate-400 italic">No references added yet.</p>;
      }
      return (
        <ol className="list-decimal list-inside space-y-2 text-sm">
          {content.map((ref, idx) => (
            <li key={idx} className="text-slate-700 dark:text-slate-300">
              {ref.startsWith('http') ? (
                <a 
                  href={ref} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {ref}
                </a>
              ) : (
                ref
              )}
            </li>
          ))}
        </ol>
      );
    }
    
    if (!content) {
      return <p className="text-slate-400 italic">No content available.</p>;
    }
    
    return (
      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {parseFormattedText(content)}
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!disease) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">Disease not found</p>
          <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Return to dashboard
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex" ref={contentRef}>
        {/* Main Content - with right margin for TOC on xl screens */}
        <div className="w-full xl:mr-56 px-4 md:px-6 lg:px-8 py-6" data-testid="disease-content">
          {/* Inline Disease Search at top */}
          <div className="mb-6">
            <DiseaseSearch />
          </div>

          {/* Back Button */}
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-4"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('backToDashboard')}
          </Link>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 dark:text-white" data-testid="disease-title">
                {getDiseaseName()}
              </h1>
              
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleBookmark}
                  className={isBookmarked ? 'text-amber-500' : ''}
                  data-testid="bookmark-btn"
                >
                  {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  <span className="hidden sm:inline ml-1">{isBookmarked ? t('saved') : t('save')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotes(!showNotes)}
                  data-testid="notes-btn"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">{t('notes')}</span>
                </Button>
              </div>
            </div>

            {/* Category Badge */}
            {disease.category_name && (
              <Badge variant="secondary" className="mb-3" data-testid="category-badge">
                {disease.category_name}
              </Badge>
            )}

            {/* Tags */}
            {disease.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
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
            <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700" data-testid="notes-panel">
              <h3 className="text-lg font-heading font-semibold mb-3">{t('yourNotesForThisDisease')}</h3>
              <Textarea
                placeholder={t('writeYourNotesHere')}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[120px] mb-3 bg-white dark:bg-slate-900"
                data-testid="notes-textarea"
              />
              <Button 
                onClick={saveNote} 
                disabled={savingNote}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="save-notes-btn"
              >
                {savingNote ? t('saving') : t('saveNote')}
              </Button>
            </div>
          )}

          {/* Content Sections - Per-Section Editing */}
          <div>
            {sections.map((section) => {
              const content = getCurrentContent(section.id);
              const sectionMedia = getSectionMedia(section.id);
              const editMeta = getSectionEditMeta(section.id);
              const isEditing = editingSection === section.id;
              const isEditingMedia = editingMediaSection === section.id;
              
              // Skip empty sections in view mode (except if references or editing media)
              if (!isEditing && !isEditingMedia && !content && sectionMedia.length === 0 && section.id !== 'references') return null;
              if (!isEditing && !isEditingMedia && section.id === 'references' && Array.isArray(content) && content.length === 0 && sectionMedia.length === 0) return null;
              
              return (
                <div 
                  key={section.id} 
                  ref={el => sectionRefs.current[section.id] = el}
                  className={`w-full mb-6 ${isEditing ? 'p-4 rounded-lg border-2 border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : ''} ${isEditingMedia ? 'p-4 rounded-lg border-2 border-purple-400 bg-purple-50/50 dark:bg-purple-900/20' : ''}`}
                  data-testid={`section-${section.id}`}
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between group w-full mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white" id={section.id}>
                        {section.label}
                      </h3>
                      
                      {/* Last Edited indicator - visible to all */}
                      {editMeta && (
                        <span className="text-xs text-slate-400 flex items-center gap-1" data-testid={`edit-meta-${section.id}`}>
                          <User className="w-3 h-3" />
                          {editMeta.last_edited_by_name || 'Admin'} • {formatRelativeTime(editMeta.last_edited_at)}
                          {editMeta.translated_at && (
                            <span className="ml-1 text-blue-500" title={`Translated ${formatRelativeTime(editMeta.translated_at)}`}>
                              <Globe className="w-3 h-3 inline" />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    
                    {/* Edit button - only for admins, only when not already editing */}
                    {isAdmin && !editingSection && !editingMediaSection && section.id !== 'references' && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-blue-600"
                          onClick={() => startSectionEdit(section.id)}
                          data-testid={`edit-btn-${section.id}`}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          {t('edit')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-purple-600"
                          onClick={() => startMediaEdit(section.id)}
                          data-testid={`media-btn-${section.id}`}
                        >
                          <Image className="w-4 h-4 mr-1" />
                          Media
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Section Content */}
                  {isEditing ? (
                    // Edit Mode for this section
                    <div className="space-y-4">
                      {/* Language indicator */}
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                        <Globe className="w-4 h-4" />
                        <span>Editing in {LANGUAGE_NAMES[currentLanguage]}</span>
                      </div>
                      
                      {/* Textarea */}
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder={`Enter ${section.label.toLowerCase()}...`}
                        className="min-h-[180px] bg-white dark:bg-slate-800 border-blue-300 focus:border-blue-500"
                        data-testid={`edit-textarea-${section.id}`}
                        autoFocus
                      />
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelSectionEdit}
                          disabled={saving}
                          data-testid={`cancel-btn-${section.id}`}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={saveSectionCurrentLanguage}
                          disabled={saving}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          data-testid={`save-lang-btn-${section.id}`}
                        >
                          {saving && !translating ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1" />
                          )}
                          Save {LANGUAGE_NAMES[currentLanguage]} Only
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => setShowTranslateConfirm(true)}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          data-testid={`translate-btn-${section.id}`}
                        >
                          {translating ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Globe className="w-4 h-4 mr-1" />
                          )}
                          {translating ? 'Translating...' : 'Save + Translate All'}
                        </Button>
                      </div>
                    </div>
                  ) : isEditingMedia ? (
                    // Media Edit Mode
                    <div className="space-y-4">
                      {/* Media editing indicator */}
                      <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                        <Image className="w-4 h-4" />
                        <span>Editing media for {section.label}</span>
                      </div>
                      
                      {/* Media Editor Component */}
                      <SectionMedia
                        media={sectionMedia}
                        onChange={(newMedia) => saveSectionMedia(section.id, newMedia)}
                        readOnly={false}
                        position="all"
                      />
                      
                      {/* Done button */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelMediaEdit}
                          disabled={savingMedia}
                          data-testid={`done-media-btn-${section.id}`}
                        >
                          {savingMedia ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          Done Editing Media
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="mb-4 w-full">
                      {/* Before text media */}
                      <SectionMedia
                        media={sectionMedia.filter(m => m.alignment === 'before')}
                        onChange={() => {}}
                        readOnly={true}
                        position="before"
                      />
                      
                      {/* Content with floated media */}
                      <div className="clearfix">
                        {/* Left-floated media */}
                        {sectionMedia.filter(m => m.alignment === 'left').map((item, idx) => (
                          <div key={`left-${idx}`} className="float-left mr-4 mb-2" style={{ width: `${item.size || 50}%` }}>
                            <img 
                              src={item.url} 
                              alt={item.description || 'Section image'} 
                              className="w-full rounded-lg object-cover"
                            />
                            {item.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 italic">
                                {item.description}
                              </p>
                            )}
                          </div>
                        ))}
                        
                        {/* Right-floated media */}
                        {sectionMedia.filter(m => m.alignment === 'right').map((item, idx) => (
                          <div key={`right-${idx}`} className="float-right ml-4 mb-2" style={{ width: `${item.size || 50}%` }}>
                            <img 
                              src={item.url} 
                              alt={item.description || 'Section image'} 
                              className="w-full rounded-lg object-cover"
                            />
                            {item.description && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 italic">
                                {item.description}
                              </p>
                            )}
                          </div>
                        ))}
                        
                        {/* Text content */}
                        <div className="w-full">
                          {renderSectionContent(section.id, content)}
                        </div>
                      </div>
                      
                      {/* Center media */}
                      <SectionMedia
                        media={sectionMedia.filter(m => m.alignment === 'center' || !m.alignment)}
                        onChange={() => {}}
                        readOnly={true}
                        position="inline"
                      />
                      
                      {/* After text media */}
                      <SectionMedia
                        media={sectionMedia.filter(m => m.alignment === 'after')}
                        onChange={() => {}}
                        readOnly={true}
                        position="after"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Translate Confirmation Dialog */}
          <Dialog open={showTranslateConfirm} onOpenChange={setShowTranslateConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Confirm Translation
                </DialogTitle>
                <DialogDescription>
                  This will translate the <strong>{editingSection}</strong> section from <strong>{LANGUAGE_NAMES[currentLanguage]}</strong> to all other languages.
                  <br /><br />
                  <span className="text-amber-600 dark:text-amber-400">
                    Warning: This will overwrite any existing translations for this section.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTranslateConfirm(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={saveSectionAndTranslate}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Yes, Save & Translate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Version Info */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-400 flex items-center gap-4 flex-wrap">
            <Clock className="w-4 h-4" />
            <span>Version {disease.version}</span>
            <span>•</span>
            <span>Last updated: {new Date(disease.updated_at).toLocaleDateString()}</span>
            {disease.last_edited_language && (
              <>
                <span>•</span>
                <span>Last edited in: {LANGUAGE_NAMES[disease.last_edited_language] || disease.last_edited_language}</span>
              </>
            )}
          </div>
        </div>

        {/* Floating Table of Contents - Right Side */}
        <div className="hidden xl:block fixed right-4 top-32 w-48 z-10" data-testid="floating-toc">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              {t('onThisPage')}
            </h4>
            <nav className="space-y-1">
              {sections.map((section) => {
                const content = getCurrentContent(section.id);
                const sectionMedia = getSectionMedia(section.id);
                
                // Only show in TOC if section has content
                if (!content && sectionMedia.length === 0) return null;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block w-full text-left text-xs py-1 px-2 rounded transition-colors ${
                      activeSection === section.id
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 font-medium'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    data-testid={`toc-${section.id}`}
                  >
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
