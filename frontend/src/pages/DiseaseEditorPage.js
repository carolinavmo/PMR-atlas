import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, Save, X, Plus } from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultDisease = {
  name: '',
  category_id: '',
  tags: [],
  definition: '',
  epidemiology: '',
  pathophysiology: '',
  biomechanics: '',
  clinical_presentation: '',
  physical_examination: '',
  imaging_findings: '',
  differential_diagnosis: '',
  treatment_conservative: '',
  treatment_interventional: '',
  treatment_surgical: '',
  rehabilitation_protocol: '',
  prognosis: '',
  references: [],
  images: []
};

const availableTags = [
  'acute', 'chronic', 'traumatic', 'degenerative', 
  'neurological', 'developmental', 'neuropathic', 'compressive'
];

export const DiseaseEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAuthHeaders, isEditor } = useAuth();
  
  const isNew = !id || id === 'new';
  
  const [disease, setDisease] = useState(defaultDisease);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newReference, setNewReference] = useState('');

  useEffect(() => {
    if (!isEditor) {
      navigate('/dashboard');
      return;
    }
    
    fetchCategories();
    if (!isNew) {
      fetchDisease();
    }
  }, [id, isEditor, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!disease.name.trim()) {
      toast.error('Disease name is required');
      return;
    }
    
    if (!disease.category_id) {
      toast.error('Please select a category');
      return;
    }

    setSaving(true);
    
    try {
      const headers = getAuthHeaders();
      
      if (isNew) {
        await axios.post(`${API_URL}/diseases`, disease, { headers });
        toast.success('Disease created successfully');
      } else {
        await axios.put(`${API_URL}/diseases/${id}`, disease, { headers });
        toast.success('Disease updated successfully');
      }
      
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save disease');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setDisease(prev => ({ ...prev, [field]: value }));
  };

  const addTag = (tag) => {
    if (tag && !disease.tags.includes(tag)) {
      setDisease(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setNewTag('');
  };

  const removeTag = (tag) => {
    setDisease(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addReference = () => {
    if (newReference.trim()) {
      setDisease(prev => ({ ...prev, references: [...prev.references, newReference.trim()] }));
      setNewReference('');
    }
  };

  const removeReference = (index) => {
    setDisease(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-[600px] bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto" data-testid="disease-editor">
        <Link to="/admin" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Admin
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-heading">
              {isNew ? 'Create New Disease' : `Edit: ${disease.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Disease Name *</Label>
                  <Input
                    id="name"
                    value={disease.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter disease name"
                    required
                    data-testid="disease-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={disease.category_id}
                    onValueChange={(v) => updateField('category_id', v)}
                  >
                    <SelectTrigger data-testid="disease-category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {disease.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select value={newTag} onValueChange={addTag}>
                    <SelectTrigger className="w-[200px]" data-testid="add-tag-select">
                      <SelectValue placeholder="Add tag..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTags.filter(t => !disease.tags.includes(t)).map((tag) => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content Sections */}
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-semibold border-b pb-2">Disease Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="definition">Definition</Label>
                  <Textarea
                    id="definition"
                    value={disease.definition}
                    onChange={(e) => updateField('definition', e.target.value)}
                    placeholder="Define the disease..."
                    className="min-h-[100px]"
                    data-testid="disease-definition"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="epidemiology">Epidemiology</Label>
                  <Textarea
                    id="epidemiology"
                    value={disease.epidemiology}
                    onChange={(e) => updateField('epidemiology', e.target.value)}
                    placeholder="Epidemiological data..."
                    className="min-h-[100px]"
                    data-testid="disease-epidemiology"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pathophysiology">Pathophysiology</Label>
                  <Textarea
                    id="pathophysiology"
                    value={disease.pathophysiology}
                    onChange={(e) => updateField('pathophysiology', e.target.value)}
                    placeholder="Pathophysiological mechanisms..."
                    className="min-h-[100px]"
                    data-testid="disease-pathophysiology"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biomechanics">Biomechanics</Label>
                  <Textarea
                    id="biomechanics"
                    value={disease.biomechanics}
                    onChange={(e) => updateField('biomechanics', e.target.value)}
                    placeholder="Biomechanical considerations..."
                    className="min-h-[100px]"
                    data-testid="disease-biomechanics"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clinical_presentation">Clinical Presentation</Label>
                  <Textarea
                    id="clinical_presentation"
                    value={disease.clinical_presentation}
                    onChange={(e) => updateField('clinical_presentation', e.target.value)}
                    placeholder="How does the patient present..."
                    className="min-h-[100px]"
                    data-testid="disease-clinical"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="physical_examination">Physical Examination</Label>
                  <Textarea
                    id="physical_examination"
                    value={disease.physical_examination}
                    onChange={(e) => updateField('physical_examination', e.target.value)}
                    placeholder="Key examination findings..."
                    className="min-h-[100px]"
                    data-testid="disease-exam"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imaging_findings">Imaging Findings</Label>
                  <Textarea
                    id="imaging_findings"
                    value={disease.imaging_findings}
                    onChange={(e) => updateField('imaging_findings', e.target.value)}
                    placeholder="Radiological findings..."
                    className="min-h-[100px]"
                    data-testid="disease-imaging"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="differential_diagnosis">Differential Diagnosis</Label>
                  <Textarea
                    id="differential_diagnosis"
                    value={disease.differential_diagnosis}
                    onChange={(e) => updateField('differential_diagnosis', e.target.value)}
                    placeholder="Alternative diagnoses to consider..."
                    className="min-h-[100px]"
                    data-testid="disease-differential"
                  />
                </div>

                <h3 className="text-lg font-heading font-semibold border-b pb-2 mt-6">Treatment</h3>

                <div className="space-y-2">
                  <Label htmlFor="treatment_conservative">Conservative Treatment</Label>
                  <Textarea
                    id="treatment_conservative"
                    value={disease.treatment_conservative}
                    onChange={(e) => updateField('treatment_conservative', e.target.value)}
                    placeholder="Non-invasive treatment options..."
                    className="min-h-[100px]"
                    data-testid="disease-treatment-conservative"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treatment_interventional">Interventional Treatment</Label>
                  <Textarea
                    id="treatment_interventional"
                    value={disease.treatment_interventional}
                    onChange={(e) => updateField('treatment_interventional', e.target.value)}
                    placeholder="Interventional procedures..."
                    className="min-h-[100px]"
                    data-testid="disease-treatment-interventional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treatment_surgical">Surgical Treatment</Label>
                  <Textarea
                    id="treatment_surgical"
                    value={disease.treatment_surgical}
                    onChange={(e) => updateField('treatment_surgical', e.target.value)}
                    placeholder="Surgical options..."
                    className="min-h-[100px]"
                    data-testid="disease-treatment-surgical"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rehabilitation_protocol">Rehabilitation Protocol</Label>
                  <Textarea
                    id="rehabilitation_protocol"
                    value={disease.rehabilitation_protocol}
                    onChange={(e) => updateField('rehabilitation_protocol', e.target.value)}
                    placeholder="Rehabilitation phases and exercises..."
                    className="min-h-[100px]"
                    data-testid="disease-rehab"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prognosis">Prognosis</Label>
                  <Textarea
                    id="prognosis"
                    value={disease.prognosis}
                    onChange={(e) => updateField('prognosis', e.target.value)}
                    placeholder="Expected outcomes..."
                    className="min-h-[100px]"
                    data-testid="disease-prognosis"
                  />
                </div>

                <h3 className="text-lg font-heading font-semibold border-b pb-2 mt-6">References</h3>

                <div className="space-y-2">
                  <Label>References</Label>
                  <div className="space-y-2 mb-2">
                    {disease.references.map((ref, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <span className="flex-1 text-sm">{ref}</span>
                        <button
                          type="button"
                          onClick={() => removeReference(index)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      placeholder="Add reference (e.g., Author et al. Title. Journal. Year)"
                      data-testid="add-reference-input"
                    />
                    <Button type="button" variant="outline" onClick={addReference} data-testid="add-reference-btn">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                  data-testid="save-disease-btn"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : (isNew ? 'Create Disease' : 'Update Disease')}
                </Button>
                <Link to="/admin">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
