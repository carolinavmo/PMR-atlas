import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Activity, Search, ChevronRight, ChevronDown, Moon, Sun, 
  Menu, X, Bookmark, FileText, Clock, Settings, LogOut,
  User, Home, Shield, Bone, Brain, Zap, Trophy, HeartPulse,
  Baby, Accessibility, PanelLeftClose, PanelLeft, Globe,
  ArrowUp, ArrowDown, GripVertical
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categoryIcons = {
  'bone': Bone,
  'brain': Brain,
  'activity': Activity,
  'trophy': Trophy,
  'heart-pulse': HeartPulse,
  'baby': Baby,
  'accessibility': Accessibility,
  'zap': Zap,
  'folder': FileText,
};

// Blue pastel theme colors
const themeColors = {
  primary: 'blue',
  accent: 'blue',
};

export const MainLayout = ({ children }) => {
  const { user, logout, isAdmin, getAuthHeaders } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { currentLanguage, setLanguage, getCurrentLanguageInfo, languages, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchDiseases();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchDiseases = async () => {
    try {
      const response = await axios.get(`${API_URL}/diseases`);
      setDiseases(response.data);
    } catch (err) {
      console.error('Failed to fetch diseases:', err);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getFilteredDiseases = (categoryId) => {
    return diseases
      .filter(d => d.category_id === categoryId)
      .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Reorder category in sidebar (admin only)
  const moveCategoryInSidebar = async (categoryId, direction) => {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === categories.length - 1) return;
    
    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    [newCategories[currentIndex], newCategories[swapIndex]] = 
    [newCategories[swapIndex], newCategories[currentIndex]];
    
    setCategories(newCategories);
    
    try {
      const headers = getAuthHeaders();
      await axios.put(
        `${API_URL}/categories/reorder`,
        { category_ids: newCategories.map(c => c.id) },
        { headers }
      );
    } catch (err) {
      fetchCategories(); // Revert on error
      toast.error('Failed to reorder');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const IconComponent = ({ iconName }) => {
    const Icon = categoryIcons[iconName] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-[hsl(var(--sidebar-bg))] border-r border-slate-200 dark:border-slate-800 sidebar-transition ${
          sidebarOpen ? 'w-[280px]' : 'w-0 lg:w-16'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        data-testid="sidebar"
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
            {sidebarOpen && (
              <Link to="/dashboard" className="flex items-center gap-2.5" data-testid="logo-link">
                <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading font-bold text-lg">PMR Atlas</span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex"
              data-testid="sidebar-toggle"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </Button>
          </div>

          {sidebarOpen && (
            <>
              {/* Search */}
              <div className="p-4">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder={t('searchDiseases')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 search-input"
                      data-testid="sidebar-search"
                    />
                  </div>
                </form>
              </div>

              {/* Quick Links */}
              <div className="px-4 pb-4 space-y-1">
                <Link to="/dashboard" className={`sidebar-item ${location.pathname === '/dashboard' ? 'active' : ''}`} data-testid="nav-dashboard">
                  <Home className="w-4 h-4" />
                  <span>{t('dashboard')}</span>
                </Link>
                <Link to="/bookmarks" className={`sidebar-item ${location.pathname === '/bookmarks' ? 'active' : ''}`} data-testid="nav-bookmarks">
                  <Bookmark className="w-4 h-4" />
                  <span>{t('bookmarks')}</span>
                </Link>
                <Link to="/notes" className={`sidebar-item ${location.pathname === '/notes' ? 'active' : ''}`} data-testid="nav-notes">
                  <FileText className="w-4 h-4" />
                  <span>{t('myNotes')}</span>
                </Link>
                <Link to="/recent" className={`sidebar-item ${location.pathname === '/recent' ? 'active' : ''}`} data-testid="nav-recent">
                  <Clock className="w-4 h-4" />
                  <span>{t('recentlyViewed')}</span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className={`sidebar-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`} data-testid="nav-admin">
                    <Shield className="w-4 h-4" />
                    <span>{t('adminPanel')}</span>
                  </Link>
                )}
              </div>

              {/* Categories */}
              <div className="px-4 py-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('categories')}</h3>
              </div>

              <ScrollArea className="flex-1 px-2">
                <div className="space-y-1 pb-4">
                  {categories.map((category, index) => {
                    const filteredDiseases = getFilteredDiseases(category.id);
                    const isExpanded = expandedCategories[category.id];
                    
                    return (
                      <Collapsible key={category.id} open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                        <div className="flex items-center group">
                          {/* Admin reorder buttons */}
                          {isAdmin && (
                            <div className="flex flex-col mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); moveCategoryInSidebar(category.id, 'up'); }}
                                disabled={index === 0}
                                className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                title="Move up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveCategoryInSidebar(category.id, 'down'); }}
                                disabled={index === categories.length - 1}
                                className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                title="Move down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <CollapsibleTrigger className="flex-1" data-testid={`category-${category.id}`}>
                            <div className="sidebar-item justify-between group">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <IconComponent iconName={category.icon} />
                                <span className="text-sm truncate">{category.name}</span>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge variant="secondary" className="text-xs h-5 min-w-[24px] justify-center">
                                  {filteredDiseases.length}
                                </Badge>
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent>
                          <div className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-700 space-y-0.5 mt-1">
                            {filteredDiseases.map((disease) => (
                              <Link
                                key={disease.id}
                                to={`/disease/${disease.id}`}
                                className={`block py-2 px-3 text-sm rounded-md transition-colors ${
                                  location.pathname === `/disease/${disease.id}`
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                data-testid={`disease-link-${disease.id}`}
                              >
                                {disease.name}
                              </Link>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between" data-testid="header">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          {/* Breadcrumb / Page Title */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-heading font-semibold text-slate-900 dark:text-white">
              {location.pathname === '/dashboard' && 'Dashboard'}
              {location.pathname === '/bookmarks' && 'Bookmarks'}
              {location.pathname === '/notes' && 'My Notes'}
              {location.pathname === '/recent' && 'Recently Viewed'}
              {location.pathname.startsWith('/admin') && 'Admin Panel'}
              {location.pathname.startsWith('/disease/') && 'Disease Detail'}
              {location.pathname === '/search' && 'Search Results'}
            </h1>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 min-w-[100px] justify-between border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30"
                  data-testid="language-toggle"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-lg">{getCurrentLanguageInfo().flag}</span>
                    <span className="text-sm font-medium">{getCurrentLanguageInfo().code.toUpperCase()}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                  {t('selectLanguage')}
                </div>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center justify-between cursor-pointer ${
                      currentLanguage === lang.code ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                    }`}
                    data-testid={`lang-option-${lang.code}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    {currentLanguage === lang.code && (
                      <span className="text-blue-600 font-bold">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              data-testid="theme-toggle"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="user-menu">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" data-testid="user-menu-content">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <Badge variant="outline" className="mt-1 text-xs capitalize">{user?.role}</Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <Home className="w-4 h-4 mr-2" />
                    {t('dashboard')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/bookmarks" className="cursor-pointer">
                    <Bookmark className="w-4 h-4 mr-2" />
                    {t('bookmarks')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notes" className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    {t('myNotes')}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="w-4 h-4 mr-2" />
                        {t('adminPanel')}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer" data-testid="logout-btn">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-visible">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};
