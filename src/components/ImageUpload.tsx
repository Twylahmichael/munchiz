import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ImageUploadProps {
  bucket: string;
  currentUrl: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
}

export function ImageUpload({ bucket, currentUrl, onUpload, onRemove, folder = "" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
      onUpload(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const displayUrl = preview || currentUrl;

  return (
    <div className="space-y-2">
      {displayUrl ? (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt="Upload preview"
            className="w-32 h-32 object-cover rounded-xl border border-white/10"
          />
          {onRemove && (
            <button
              type="button"
              onClick={() => { onRemove(); setPreview(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:scale-110 transition-transform"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragActive ? "border-amber-500 bg-amber-500/5" : "border-white/10 hover:border-amber-500/50"
          }`}
        >
          {uploading ? (
            <div className="text-white/40">
              <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
              Uploading...
            </div>
          ) : (
            <>
              <ImageIcon size={32} className="mx-auto mb-2 text-white/20" />
              <p className="text-sm text-white/40">
                <span className="font-semibold text-amber-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-white/20 mt-1">JPEG, PNG, WebP (max 5MB)</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        className="hidden"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
