'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileVideo, X, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  uploading: boolean;
}

export default function UploadZone({ onFilesSelected, uploading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [onFilesSelected]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed p-16
        transition-all duration-300
        ${isDragOver
          ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
          : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900/50'
        }
        ${uploading ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,audio/*"
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-4 text-center">
        {uploading ? (
          <>
            <div className="relative">
              <Loader2 className="w-16 h-16 text-violet-400 animate-spin" />
            </div>
            <div>
              <p className="text-lg font-medium text-zinc-200">جاري رفع الملفات...</p>
              <p className="text-sm text-zinc-500 mt-1">برجاء الانتظار</p>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <div className={`absolute inset-0 bg-violet-500/20 rounded-full blur-xl transition-opacity duration-300 ${isDragOver ? 'opacity-100' : 'opacity-0'}`} />
              <Upload className={`w-16 h-16 relative transition-colors duration-300 ${isDragOver ? 'text-violet-400' : 'text-zinc-500'}`} />
            </div>
            <div>
              <p className="text-xl font-semibold text-zinc-200">
                {isDragOver ? 'افلت الملفات هنا' : 'اسحب وأفلت الفيديوهات هنا'}
              </p>
              <p className="text-sm text-zinc-500 mt-2">
                أو اضغط لاختيار الملفات
              </p>
              <p className="text-xs text-zinc-600 mt-3">
                MP4, MOV, AVI, MKV, WebM · MP3, WAV, AAC
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
