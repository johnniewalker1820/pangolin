"use client";

import { useState } from "react";
import { Button } from "@app/components/ui/button";
import { Eye, ExternalLink } from "lucide-react";
import { useResourceContext } from "@app/hooks/useResourceContext";

interface AuthPreviewProps {
  customization: {
    authCustomCSS?: string;
    authCustomHTML?: string;
    authCustomLogo?: string;
    authCustomTitle?: string;
    authCustomDescription?: string;
    authCustomBackground?: string;
    authCustomEnabled?: boolean;
  };
}

const AuthPreview: React.FC<AuthPreviewProps> = ({ customization }) => {
  const { resource } = useResourceContext();

  const openPreview = () => {
    // Create preview URL with customization data
    const previewData = encodeURIComponent(JSON.stringify(customization));
    const previewUrl = `/auth/resource/${resource.resourceId}?preview=true&data=${previewData}`;
    
    // Open in new window
    window.open(previewUrl, 'auth-preview', 'width=800,height=600,scrollbars=yes,resizable=yes');
  };

  const getPreviewUrl = () => {
    return `/auth/resource/${resource.resourceId}`;
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={openPreview}
        className="flex items-center gap-2"
      >
        <Eye className="w-4 h-4" />
        Preview Changes
      </Button>
      
      <Button
        type="button"
        variant="outline"
        onClick={() => window.open(getPreviewUrl(), '_blank')}
        className="flex items-center gap-2"
      >
        <ExternalLink className="w-4 h-4" />
        View Live Page
      </Button>
    </div>
  );
};

export default AuthPreview;
