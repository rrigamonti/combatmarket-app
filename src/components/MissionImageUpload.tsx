import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { db } from '@/integrations/supabase/db';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface MissionImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

const MissionImageUpload = ({ imageUrl, onImageChange }: MissionImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await db.storage.from('mission-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = db.storage.from('mission-images').getPublicUrl(path);
      onImageChange(data.publicUrl);
    } catch (err: any) {
      console.error('Upload failed:', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Mission Image</Label>
      {imageUrl ? (
        <div className="relative w-full max-w-sm">
          <img src={imageUrl} alt="Mission" className="w-full h-40 object-cover rounded-md border border-border" />
          <button
            type="button"
            onClick={() => onImageChange(null)}
            className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="w-full max-w-sm h-40 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload</span>
            </>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default MissionImageUpload;
