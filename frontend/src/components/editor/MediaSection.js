import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, X, Image, Link, Upload } from 'lucide-react';

export const MediaSection = ({ 
  images = [], 
  onChange, 
  readOnly = false 
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');
  const fileInputRef = useRef(null);

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      const newImages = [...images, { url: newImageUrl, caption: newImageCaption }];
      onChange(newImages);
      setNewImageUrl('');
      setNewImageCaption('');
      setShowAddDialog(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, create a local URL - in production this would upload to cloud storage
      const url = URL.createObjectURL(file);
      const newImages = [...images, { url, caption: file.name, isLocal: true }];
      onChange(newImages);
    }
  };

  // Parse images - can be array of strings or objects
  const parsedImages = images.map(img => 
    typeof img === 'string' ? { url: img, caption: '' } : img
  );

  if (readOnly && parsedImages.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="section-heading flex items-center gap-2" id="media">
        <Image className="w-5 h-5 text-blue-500" />
        Media & Images
      </h3>
      
      <div className="media-grid">
        {parsedImages.map((img, index) => (
          <div key={index} className="media-item group">
            <img src={img.url} alt={img.caption || `Image ${index + 1}`} />
            {!readOnly && (
              <div className="media-overlay">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemoveImage(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {img.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-xs text-white truncate">{img.caption}</p>
              </div>
            )}
          </div>
        ))}
        
        {!readOnly && (
          <button
            type="button"
            className="add-media-btn"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm">Add Media</span>
          </button>
        )}
      </div>

      {/* Add Media Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="image-url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="image-caption">Caption (optional)</Label>
              <Input
                id="image-caption"
                value={newImageCaption}
                onChange={(e) => setNewImageCaption(e.target.value)}
                placeholder="Image description"
              />
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">or</span>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload from computer</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddImage}
              disabled={!newImageUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
