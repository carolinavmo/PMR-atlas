import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Plus, Search, Edit, Trash2, Users, BookOpen, FolderTree,
  BarChart3, Shield, ChevronRight, GripVertical, ArrowUp, ArrowDown
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AdminPage = () => {
  const { getAuthHeaders, isAdmin, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showDiseaseDialog, setShowDiseaseDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'folder', order: 0 });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      
      const [statsRes, usersRes, diseasesRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, { headers }),
        axios.get(`${API_URL}/admin/users`, { headers }),
        axios.get(`${API_URL}/diseases`),
        axios.get(`${API_URL}/categories`)
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setDiseases(diseasesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`${API_URL}/admin/users/${userId}/role?role=${newRole}`, {}, { headers });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('User role updated');
    } catch (err) {
      toast.error('Failed to update user role');
    }
  };

  const saveCategory = async () => {
    try {
      const headers = getAuthHeaders();
      
      if (editingCategory) {
        await axios.put(`${API_URL}/categories/${editingCategory.id}`, categoryForm, { headers });
        toast.success('Category updated');
      } else {
        await axios.post(`${API_URL}/categories`, categoryForm, { headers });
        toast.success('Category created');
      }
      
      setShowCategoryDialog(false);
      setCategoryForm({ name: '', description: '', icon: 'folder', order: 0 });
      setEditingCategory(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to save category');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/categories/${categoryId}`, { headers });
      toast.success('Category deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete category');
    }
  };

  const deleteDisease = async (diseaseId) => {
    if (!window.confirm('Are you sure you want to delete this disease?')) return;
    
    try {
      const headers = getAuthHeaders();
      await axios.delete(`${API_URL}/diseases/${diseaseId}`, { headers });
      toast.success('Disease deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete disease');
    }
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
      order: category.order
    });
    setShowCategoryDialog(true);
  };

  // Move category up/down in order
  const moveCategory = async (categoryId, direction) => {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === categories.length - 1) return;
    
    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap positions
    [newCategories[currentIndex], newCategories[swapIndex]] = 
    [newCategories[swapIndex], newCategories[currentIndex]];
    
    // Update local state immediately for responsiveness
    setCategories(newCategories);
    
    // Save to backend
    try {
      const headers = getAuthHeaders();
      await axios.put(
        `${API_URL}/categories/reorder`,
        { category_ids: newCategories.map(c => c.id) },
        { headers }
      );
      toast.success(t('success'));
    } catch (err) {
      // Revert on error
      fetchData();
      toast.error(t('error'));
    }
  };

  const filteredDiseases = diseases.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6" data-testid="admin-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">
              {t('adminPanel')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t('manageContent')}
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            <Shield className="w-3 h-3 mr-1" />
            Administrator
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                  <p className="text-xs text-slate-500">Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-lavender-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total_diseases || 0}</p>
                  <p className="text-xs text-slate-500">Diseases</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <FolderTree className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total_categories || 0}</p>
                  <p className="text-xs text-slate-500">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-rose-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total_bookmarks || 0}</p>
                  <p className="text-xs text-slate-500">Bookmarks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.total_notes || 0}</p>
                  <p className="text-xs text-slate-500">Notes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="diseases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="diseases" data-testid="tab-diseases">Diseases</TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">Categories</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          </TabsList>

          {/* Diseases Tab */}
          <TabsContent value="diseases">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Diseases Management</CardTitle>
                <Link to="/admin/diseases/new">
                  <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-disease-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Disease
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search diseases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 max-w-sm"
                      data-testid="search-diseases"
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDiseases.map((disease) => (
                      <TableRow key={disease.id} data-testid={`disease-row-${disease.id}`}>
                        <TableCell className="font-medium">{disease.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{disease.category_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {disease.tags?.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>v{disease.version}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link to={`/admin/diseases/${disease.id}/edit`}>
                              <Button variant="ghost" size="icon" data-testid={`edit-disease-${disease.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteDisease(disease.id)}
                              className="text-red-500 hover:text-red-600"
                              data-testid={`delete-disease-${disease.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('categoriesManagement')}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">{t('dragToReorder')}</p>
                </div>
                <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: '', description: '', icon: 'folder', order: 0 });
                      }}
                      data-testid="add-category-btn"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('addNewCategory')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
                      <DialogDescription>
                        {editingCategory ? 'Update the category details' : 'Create a new disease category'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="cat-name">Name</Label>
                        <Input
                          id="cat-name"
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Category name"
                          data-testid="category-name-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cat-desc">Description</Label>
                        <Textarea
                          id="cat-desc"
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Category description"
                          data-testid="category-desc-input"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cat-icon">Icon</Label>
                          <Select
                            value={categoryForm.icon}
                            onValueChange={(v) => setCategoryForm(prev => ({ ...prev, icon: v }))}
                          >
                            <SelectTrigger data-testid="category-icon-select">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bone">Bone</SelectItem>
                              <SelectItem value="brain">Brain</SelectItem>
                              <SelectItem value="activity">Activity</SelectItem>
                              <SelectItem value="trophy">Trophy</SelectItem>
                              <SelectItem value="heart-pulse">Heart</SelectItem>
                              <SelectItem value="baby">Baby</SelectItem>
                              <SelectItem value="accessibility">Accessibility</SelectItem>
                              <SelectItem value="zap">Zap</SelectItem>
                              <SelectItem value="folder">Folder</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cat-order">Order</Label>
                          <Input
                            id="cat-order"
                            type="number"
                            value={categoryForm.order}
                            onChange={(e) => setCategoryForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                            data-testid="category-order-input"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>{t('cancel')}</Button>
                      <Button onClick={saveCategory} className="bg-blue-600 hover:bg-blue-700" data-testid="save-category-btn">
                        {editingCategory ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Diseases</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category, index) => (
                      <TableRow key={category.id} data-testid={`category-row-${category.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => moveCategory(category.id, 'up')}
                              disabled={index === 0}
                              data-testid={`move-up-${category.id}`}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => moveCategory(category.id, 'down')}
                              disabled={index === categories.length - 1}
                              data-testid={`move-down-${category.id}`}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-slate-500 ml-1">{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{category.disease_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEditCategory(category)}
                              data-testid={`edit-category-${category.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteCategory(category.id)}
                              className="text-red-500 hover:text-red-600"
                              data-testid={`delete-category-${category.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge className={
                            u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'editor' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {u.id !== user?.id && (
                            <Select
                              value={u.role}
                              onValueChange={(value) => updateUserRole(u.id, value)}
                            >
                              <SelectTrigger className="w-32" data-testid={`role-select-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};
