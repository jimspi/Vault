'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  workspaceId: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function UploadZone({ workspaceId }: UploadZoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const fileId = Math.random().toString(36).substring(7);

        setUploadingFiles((prev) => [
          ...prev,
          {
            id: fileId,
            file,
            progress: 0,
            status: 'uploading',
          },
        ]);

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('workspaceId', workspaceId);

          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          await response.json();

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? { ...f, progress: 100, status: 'processing' }
                : f
            )
          );

          // Simulate processing completion (in reality, you'd poll or use websockets)
          setTimeout(() => {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === fileId ? { ...f, status: 'complete' } : f
              )
            );

            toast({
              title: 'Upload successful',
              description: `${file.name} has been processed`,
            });

            // Remove after 3 seconds
            setTimeout(() => {
              setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
            }, 3000);
          }, 2000);
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : f
            )
          );

          toast({
            title: 'Upload failed',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
        }
      }
    },
    [workspaceId, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Drag and drop files or click to browse. Supports PDF, DOCX, TXT, MD, and images (up to 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, DOCX, TXT, MD, PNG, JPG (max 10MB)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium truncate max-w-[300px]">
                      {file.file.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {file.status === 'processing' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {file.status === 'complete' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                {file.status !== 'error' && (
                  <Progress value={file.progress} />
                )}
                {file.error && (
                  <p className="text-xs text-destructive">{file.error}</p>
                )}
                {file.status === 'processing' && (
                  <p className="text-xs text-muted-foreground">
                    Processing with AI...
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
