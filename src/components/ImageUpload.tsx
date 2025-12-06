import { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Upload, Link, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  recipeId: string;
  currentImages: Array<{ id: string; image_url: string; is_primary: boolean }>;
  onImagesUpdate: () => void;
}

export function ImageUpload({ recipeId, currentImages, onImagesUpdate }: ImageUploadProps) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const addImageFromUrl = async () => {
    if (!imageUrl.trim()) return;

    setAdding(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const isPrimaryImage = currentImages.length === 0;

    const { error } = await supabase.from('recipe_images').insert({
      recipe_id: recipeId,
      image_url: imageUrl,
      is_primary: isPrimaryImage,
      uploaded_by: userData.user.id,
    });

    if (!error) {
      if (isPrimaryImage) {
        await supabase
          .from('recipes')
          .update({ hero_image_url: imageUrl })
          .eq('id', recipeId);
      }

      setImageUrl('');
      setShowUrlInput(false);
      onImagesUpdate();
    } else {
      alert('Failed to add image');
    }

    setAdding(false);
  };

  const removeImage = async (imageId: string) => {
    if (!confirm('Remove this image?')) return;

    const { error } = await supabase
      .from('recipe_images')
      .delete()
      .eq('id', imageId);

    if (!error) {
      onImagesUpdate();
    }
  };

  const setPrimaryImage = async (imageId: string, imageUrl: string) => {
    await supabase
      .from('recipe_images')
      .update({ is_primary: false })
      .eq('recipe_id', recipeId);

    await supabase
      .from('recipe_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    await supabase
      .from('recipes')
      .update({ hero_image_url: imageUrl })
      .eq('id', recipeId);

    onImagesUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recipe Images</h3>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
        >
          <Link size={16} className="mr-1" />
          Add Image URL
        </Button>
      </div>

      {showUrlInput && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-3">
            Add an image from a URL (e.g., from Pexels, Unsplash, or your own hosting)
          </p>
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={addImageFromUrl}
              disabled={!imageUrl.trim() || adding}
            >
              {adding ? 'Adding...' : 'Add'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowUrlInput(false);
                setImageUrl('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {currentImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentImages.map((image) => (
            <div
              key={image.id}
              className={`relative group rounded-lg overflow-hidden border-2 ${
                image.is_primary ? 'border-emerald-500' : 'border-gray-200'
              }`}
            >
              <img
                src={image.image_url}
                alt="Recipe"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                {!image.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPrimaryImage(image.id, image.image_url)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Check size={14} className="mr-1" />
                    Set Primary
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => removeImage(image.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </Button>
              </div>
              {image.is_primary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Upload size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">No images yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Add images to make your recipe more appealing
          </p>
        </div>
      )}
    </div>
  );
}
