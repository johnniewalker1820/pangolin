"use client";

import { useState, useRef } from "react";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { Upload, X } from "lucide-react";
import { toast } from "@app/hooks/useToast";

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accept?: string;
  maxSize?: number; // in MB
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value = "",
  onChange,
  placeholder = "Enter image URL or upload a file",
  accept = "image/*",
  maxSize = 2
}) => {
  const [preview, setPreview] = useState<string | null>(
    value && (value.startsWith('data:') || value.startsWith('http')) ? value : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    onChange(url);
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileUpload}
        className="hidden"
      />

      {preview && (
        <div className="relative inline-block">
          <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
            <img
              src={preview}
              alt="Preview"
              className="w-16 h-16 object-contain rounded"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={clearImage}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
