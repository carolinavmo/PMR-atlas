import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { 
  Plus, X, Image, Video, Link, Upload, Settings, 
  AlignLeft, AlignCenter, AlignRight, Move,
  ArrowUp, ArrowDown, FileImage
} from 'lucide-react';

const ALIGNMENT_OPTIONS = [
  { value: 'before', label: 'Before text', icon: ArrowUp },
  { value: 'after', label: 'After text', icon: ArrowDown },
  { value: 'left', label: 'Float left', icon: AlignLeft },
  { value: 'right', label: 'Float right', icon: AlignRight },
  { value: 'center', label: 'Centered', icon: AlignCenter },
];

const SIZE_OPTIONS = [
  { value: '25', label: '25%' },
  { value: '50', label: '50%' },
  { value: '75', label: '75%' },
  { value: '100', label: '100%' },
];

export const SectionMedia = ({ 
  media = [], 
  onChange, 
  readOnly = false,
  position = 'after' // 'before' or 'after' the text content
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [mediaForm, setMediaForm] = useState({
    url: '',
    type: 'image', // 'image' or 'video'
    description: '',
    size: '50',
    alignment: 'center'
  });

  const resetForm = () => {
    setMediaForm({
      url: '',
      type: 'image',
      description: '',
      size: '50',
      alignment: 'center'
    });
    setUploadPreview(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a data URL for local preview and storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setMediaForm(prev => ({ ...prev, url: dataUrl }));
        setUploadPreview({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddMedia = () => {
    if (mediaForm.url.trim()) {
      const newMedia = [...media, { ...mediaForm }];
      onChange(newMedia);
      resetForm();
      setShowAddDialog(false);
    }
  };

  const handleEditMedia = () => {
    if (editingIndex !== null && mediaForm.url.trim()) {
      const newMedia = [...media];
      newMedia[editingIndex] = { ...mediaForm };
      onChange(newMedia);
      resetForm();
      setEditingIndex(null);
      setShowEditDialog(false);
    }
  };

  const handleRemoveMedia = (index) => {
    const newMedia = media.filter((_, i) => i !== index);
    onChange(newMedia);
  };

  const openEditDialog = (index) => {
    const item = media[index];
    setMediaForm({
      url: item.url || '',
      type: item.type || 'image',
      description: item.description || '',
      size: item.size || '50',
      alignment: item.alignment || 'center'
    });
    setEditingIndex(index);
    setShowEditDialog(true);
  };

  const getMediaStyle = (item) => {
    const width = `${item.size || 50}%`;
    const alignment = item.alignment || 'center';
    
    let containerStyle = {};
    let wrapperClass = '';
    
    switch (alignment) {
      case 'left':
        containerStyle = { float: 'left', marginRight: '1rem', marginBottom: '0.5rem' };
        break;
      case 'right':
        containerStyle = { float: 'right', marginLeft: '1rem', marginBottom: '0.5rem' };
        break;
      case 'center':
        wrapperClass = 'flex justify-center';
        break;
      case 'before':
      case 'after':
      default:
        wrapperClass = 'flex justify-center';
        break;
    }
    
    return { containerStyle, wrapperClass, width };
  };

  const renderMediaItem = (item, index) => {
    const { containerStyle, wrapperClass, width } = getMediaStyle(item);
    const isVideo = item.type === 'video' || item.url?.includes('youtube') || item.url?.includes('vimeo');
    
    return (
      <div 
        key={index} 
        className={`relative group my-4 ${wrapperClass}`}
        style={containerStyle}
      >
        <div style={{ width }} className="relative">
          {isVideo ? (
            <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
              {item.url?.includes('youtube') ? (
                <iframe
                  src={item.url.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                  title={item.description || 'Video'}
                />
              ) : item.url?.includes('vimeo') ? (
                <iframe
                  src={item.url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                  className="w-full h-full"
                  allowFullScreen
                  title={item.description || 'Video'}
                />
              ) : (
                <video 
                  src={item.url} 
                  controls 
                  className="w-full h-full object-cover"
                >
                  Your browser does not support video.
                </video>
              )}
            </div>
          ) : (
            <img 
              src={item.url} 
              alt={item.description || 'Section image'} 
              className="w-full rounded-lg object-cover"
            />
          )}
          
          {/* Description */}
          {item.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2 italic">
              {item.description}
            </p>
          )}
          
          {/* Edit/Delete overlay */}
          {!readOnly && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openEditDialog(index)}
                className="h-8"
              >
                <Settings className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRemoveMedia(index)}
                className="h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filter media by position
  const beforeMedia = media.filter(m => m.alignment === 'before');
  const afterMedia = media.filter(m => m.alignment === 'after');
  const inlineMedia = media.filter(m => !['before', 'after'].includes(m.alignment));

  if (readOnly && media.length === 0) {
    return null;
  }

  return (
    <>
      {/* Render based on position prop */}
      {position === 'before' && beforeMedia.map((item, i) => renderMediaItem(item, media.indexOf(item)))}
      
      {position === 'inline' && inlineMedia.map((item, i) => renderMediaItem(item, media.indexOf(item)))}
      
      {position === 'after' && (
        <>
          {afterMedia.map((item, i) => renderMediaItem(item, media.indexOf(item)))}
          
          {/* Add Media Button */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowAddDialog(true)}
              className="mt-4 w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg 
                         flex items-center justify-center gap-2 text-slate-400 hover:text-blue-500 
                         hover:border-blue-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add media to this section</span>
            </button>
          )}
        </>
      )}

      {/* Add Media Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Media to Section</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Media Type */}
            <div className="space-y-2">
              <Label>Media Type</Label>
              <RadioGroup
                value={mediaForm.type}
                onValueChange={(v) => setMediaForm(prev => ({ ...prev, type: v }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="type-image" />
                  <Label htmlFor="type-image" className="flex items-center gap-2 cursor-pointer">
                    <Image className="w-4 h-4" /> Image
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="type-video" />
                  <Label htmlFor="type-video" className="flex items-center gap-2 cursor-pointer">
                    <Video className="w-4 h-4" /> Video
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="media-url">
                {mediaForm.type === 'video' ? 'Video URL (YouTube, Vimeo, or direct link)' : 'Image URL'}
              </Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="media-url"
                  value={mediaForm.url.startsWith('data:') ? 'File uploaded' : mediaForm.url}
                  onChange={(e) => setMediaForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder={mediaForm.type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://example.com/image.jpg'}
                  className="pl-10"
                  disabled={mediaForm.url.startsWith('data:')}
                />
              </div>
            </div>

            {/* File Upload Option for Images */}
            {mediaForm.type === 'image' && (
              <div className="space-y-2">
                <Label>Or upload from computer</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Choose File
                  </Button>
                  {uploadPreview && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <FileImage className="w-4 h-4 text-blue-500" />
                      <span>{uploadPreview.name}</span>
                      <span className="text-slate-400">({uploadPreview.size})</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                        onClick={() => {
                          setMediaForm(prev => ({ ...prev, url: '' }));
                          setUploadPreview(null);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {/* Preview uploaded image */}
                {uploadPreview && mediaForm.url && (
                  <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <img 
                      src={mediaForm.url} 
                      alt="Preview" 
                      className="max-h-32 mx-auto rounded"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Size */}
            <div className="space-y-2">
              <Label>Size</Label>
              <div className="flex gap-2">
                {SIZE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={mediaForm.size === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMediaForm(prev => ({ ...prev, size: opt.value }))}
                    className={mediaForm.size === opt.value ? 'bg-blue-600' : ''}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div className="space-y-2">
              <Label>Position / Alignment</Label>
              <div className="grid grid-cols-5 gap-2">
                {ALIGNMENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={mediaForm.alignment === opt.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaForm(prev => ({ ...prev, alignment: opt.value }))}
                      className={`flex flex-col items-center py-3 h-auto ${mediaForm.alignment === opt.value ? 'bg-blue-600' : ''}`}
                      title={opt.label}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-xs">{opt.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="media-desc">Description / Caption</Label>
              <Textarea
                id="media-desc"
                value={mediaForm.description}
                onChange={(e) => setMediaForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this media"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowAddDialog(false); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMedia}
              disabled={!mediaForm.url.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Media
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Media Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Media Type */}
            <div className="space-y-2">
              <Label>Media Type</Label>
              <RadioGroup
                value={mediaForm.type}
                onValueChange={(v) => setMediaForm(prev => ({ ...prev, type: v }))}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="edit-type-image" />
                  <Label htmlFor="edit-type-image" className="flex items-center gap-2 cursor-pointer">
                    <Image className="w-4 h-4" /> Image
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="edit-type-video" />
                  <Label htmlFor="edit-type-video" className="flex items-center gap-2 cursor-pointer">
                    <Video className="w-4 h-4" /> Video
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="edit-media-url">
                {mediaForm.type === 'video' ? 'Video URL' : 'Image URL'}
              </Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="edit-media-url"
                  value={mediaForm.url}
                  onChange={(e) => setMediaForm(prev => ({ ...prev, url: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Preview */}
            {mediaForm.url && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-2 bg-slate-50 dark:bg-slate-800">
                  {mediaForm.type === 'video' ? (
                    <div className="aspect-video bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                      <Video className="w-8 h-8 text-slate-400" />
                    </div>
                  ) : (
                    <img 
                      src={mediaForm.url} 
                      alt="Preview" 
                      className="max-h-40 mx-auto rounded"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Size */}
            <div className="space-y-2">
              <Label>Size</Label>
              <div className="flex gap-2">
                {SIZE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={mediaForm.size === opt.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMediaForm(prev => ({ ...prev, size: opt.value }))}
                    className={mediaForm.size === opt.value ? 'bg-blue-600' : ''}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Alignment */}
            <div className="space-y-2">
              <Label>Position / Alignment</Label>
              <div className="grid grid-cols-5 gap-2">
                {ALIGNMENT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={mediaForm.alignment === opt.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMediaForm(prev => ({ ...prev, alignment: opt.value }))}
                      className={`flex flex-col items-center py-3 h-auto ${mediaForm.alignment === opt.value ? 'bg-blue-600' : ''}`}
                      title={opt.label}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-xs">{opt.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-media-desc">Description / Caption</Label>
              <Textarea
                id="edit-media-desc"
                value={mediaForm.description}
                onChange={(e) => setMediaForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for this media"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setEditingIndex(null); setShowEditDialog(false); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditMedia}
              disabled={!mediaForm.url.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
