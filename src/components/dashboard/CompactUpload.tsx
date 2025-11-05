'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

interface CompactUploadProps {
  workspaceId: string;
}

export default function CompactUpload({ workspaceId }: CompactUploadProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspaceId', workspaceId);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        toast({
          title: 'Document uploaded!',
          description: `${file.name} has been processed`,
        });

        router.refresh();
        setIsExpanded(false);
      } catch (error) {
        toast({
          title: 'Upload failed',
          description: error instanceof Error ? error.message : 'Could not upload document',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [workspaceId, toast, router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
  });

  return (
    <div className="border-b pb-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 px-3 hover:bg-muted rounded-md transition-colors"
      >
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Upload</span>
        </div>
      </button>

      {/* Upload Area */}
      {isExpanded && (
        <div className="mt-2 px-3">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
              transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground">Uploading...</p>
                <Progress value={progress} className="h-1" />
              </div>
            ) : isDragActive ? (
              <div className="space-y-2">
                <Upload className="h-6 w-6 mx-auto text-primary" />
                <p className="text-xs text-primary font-medium">Drop here</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Click or drag to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, TXT, or images
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
