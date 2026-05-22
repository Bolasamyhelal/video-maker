'use client';

import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import TemplateSelector from '@/components/TemplateSelector';
import ExportDialog, { ExportOptions } from '@/components/ExportDialog';
import EffectsPanel from '@/components/EffectsPanel';
import { VideoClip, Effect, Transition, AnalysisResult } from '@/lib/types';
import { videoTemplates } from '@/lib/templates';
import { planAutoEdit, createProject } from '@/lib/editorEngine';
import { renderMontage } from '@/lib/ffmpegClient';
import {
  Film, Wand2, Play, Pause, Trash2, Download,
  Sparkles, Loader2, AlertCircle, CheckCircle2,
  Layers, Clock,
} from 'lucide-react';

interface StoredFile {
  id: string;
  file: File;
  url: string;
  duration: number;
}

export default function EditorPage() {
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('cinematic');
  const [effects, setEffects] = useState<Effect[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const previewRef = useRef<HTMLVideoElement>(null);

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject(new Error('Cannot read video'));
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFilesSelected = async (files: FileList) => {
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);

      try {
        const duration = await getVideoDuration(file);
        const newFile: StoredFile = { id, file, url, duration };
        setStoredFiles(prev => [...prev, newFile]);

        if (file.type.startsWith('video/')) {
          const clip: VideoClip = {
            id,
            filePath: url,
            fileName: file.name,
            duration,
            startTime: 0,
            endTime: duration,
            speed: 1,
            volume: 1,
          };
          setClips(prev => [...prev, clip]);
          setPreviewUrl(url);
        }
      } catch (err: any) {
        setError(`فشل قراءة ${file.name}`);
      }
    }
  };

  const handleAutoEdit = () => {
    if (clips.length === 0) {
      setError('برجاء رفع فيديوهات أولاً');
      return;
    }

    setIsProcessing(true);
    setError(null);

    setTimeout(() => {
      const template = videoTemplates.find(t => t.id === selectedTemplate) || videoTemplates[0];
      const plan = planAutoEdit(clips, template);
      setEffects(plan.effects);
      setTransitions(plan.transitions);
      setTotalDuration(plan.totalDuration);
      setIsProcessing(false);
      setSuccess('تم تجهيز المونتاج التلقائي');
      setTimeout(() => setSuccess(null), 3000);
    }, 800);
  };

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true);
    setExportProgress(0);
    setError(null);

    try {
      const readPromises = clips.map(async (clip) => {
        const stored = storedFiles.find(f => f.id === clip.id);
        if (!stored) throw new Error(`فقد ملف ${clip.fileName}`);
        const buffer = await stored.file.arrayBuffer();
        return {
          file: new Uint8Array(buffer),
          name: stored.file.name,
          start: clip.startTime,
          end: clip.endTime,
          speed: clip.speed,
        };
      });

      const clipData = await Promise.all(readPromises);

      const dlUrl = await renderMontage(clipData, (pct) => {
        setExportProgress(pct);
      });

      setExportProgress(100);

      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `montage_${selectedTemplate}.mp4`;
      a.click();
      URL.revokeObjectURL(dlUrl);

      setSuccess('تم تصدير الفيديو بنجاح!');
      setTimeout(() => {
        setShowExport(false);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'فشل التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  const removeClip = (id: string) => {
    const stored = storedFiles.find(f => f.id === id);
    if (stored) URL.revokeObjectURL(stored.url);
    setStoredFiles(prev => prev.filter(f => f.id !== id));
    setClips(prev => prev.filter(c => c.id !== id));
    setEffects(prev => prev.filter(e => e.clipId !== id));
    setTransitions(prev => prev.filter(t => t.fromClipId !== id && t.toClipId !== id));
  };

  const togglePreview = () => {
    if (!previewRef.current) return;
    isPlaying ? previewRef.current.pause() : previewRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Film className="w-7 h-7 text-violet-400" />
          <h1 className="text-3xl font-bold">محرر الفيديو الذكي</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
            <button onClick={() => setError(null)} className="mr-auto">✕</button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {clips.length === 0 ? (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                هل أنت مستعد لمونتاج احترافي؟
              </h2>
              <p className="text-zinc-400">ارفع الفيديوهات الخام، اختار قالب، وهخلي المونتاج يجنن!</p>
              <p className="text-zinc-600 text-sm mt-2">كل حاجة بتشتغل في المتصفح - خصوصيتك تامة</p>
            </div>
            <UploadZone onFilesSelected={handleFilesSelected} uploading={false} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4">
                {previewUrl ? (
                  <div className="relative">
                    <video
                      ref={previewRef}
                      src={previewUrl}
                      className="w-full rounded-xl bg-black"
                      onEnded={() => setIsPlaying(false)}
                      onTimeUpdate={() => setCurrentTime(previewRef.current?.currentTime || 0)}
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                      <button onClick={togglePreview} className="p-3 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 transition-all" style={{ width: `${(currentTime / (totalDuration || clips[0]?.duration || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        {Math.floor(currentTime)}s / {Math.floor(totalDuration || clips[0]?.duration || 0)}s
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl bg-zinc-900 flex items-center justify-center">
                    <Film className="w-16 h-16 text-zinc-700" />
                  </div>
                )}
              </div>

              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-zinc-200">المقاطع ({clips.length})</h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Clock className="w-4 h-4" />
                    <span>{totalDuration.toFixed(1)} ثانية</span>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {clips.map(clip => (
                    <div key={clip.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 group hover:border-zinc-700 transition-all">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                        <Film className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-300 truncate">{clip.fileName}</p>
                        <p className="text-xs text-zinc-500">{clip.duration.toFixed(1)}s · سرعة {clip.speed}x</p>
                      </div>
                      <button onClick={() => removeClip(clip.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <UploadZone onFilesSelected={handleFilesSelected} uploading={false} />
            </div>

            <div className="space-y-6">
              <TemplateSelector selectedId={selectedTemplate} onSelect={t => setSelectedTemplate(t.id)} />

              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                <EffectsPanel
                  effects={effects}
                  onUpdateEffect={(id, params) =>
                    setEffects(prev => prev.map(e => e.id === id ? { ...e, params } : e))
                  }
                />
              </div>

              <button
                onClick={handleAutoEdit}
                disabled={isProcessing || clips.length === 0}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-violet-500/20"
              >
                {isProcessing ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> جاري التجهيز...</>
                ) : (
                  <><Wand2 className="w-6 h-6" /> مونتاج تلقائي</>
                )}
              </button>

              <button
                onClick={() => setShowExport(true)}
                disabled={clips.length === 0}
                className="w-full py-3.5 rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-zinc-700"
              >
                <Download className="w-5 h-5" /> تصدير الفيديو
              </button>
            </div>
          </div>
        )}
      </main>

      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExport={handleExport}
        isExporting={isExporting}
        progress={exportProgress}
      />
    </div>
  );
}
