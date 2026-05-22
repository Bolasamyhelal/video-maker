'use client';

import { useState, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import TemplateSelector from '@/components/TemplateSelector';
import ExportDialog, { ExportOptions } from '@/components/ExportDialog';
import EffectsPanel from '@/components/EffectsPanel';
import { VideoClip, Effect, Transition } from '@/lib/types';
import { videoTemplates } from '@/lib/templates';
import { planAutoEdit } from '@/lib/editorEngine';
import { renderMontage } from '@/lib/ffmpegClient';
import {
  Film, Wand2, Play, Pause, Trash2, Download,
  Sparkles, Loader2, AlertCircle, CheckCircle2,
  Layers, Clock, Music, ArrowRight,
} from 'lucide-react';

interface StoredFile {
  id: string; file: File; url: string; duration: number;
}

export default function EditorPage() {
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [audioFile, setAudioFile] = useState<{ file: File; url: string; name: string } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('cinematic');
  const [effects, setEffects] = useState<Effect[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [orderedClipIds, setOrderedClipIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMsg, setExportMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [hasPlan, setHasPlan] = useState(false);
  const previewRef = useRef<HTMLVideoElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const getVideoDuration = (file: File): Promise<number> =>
    new Promise((resolve, reject) => {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
      v.onerror = () => reject(new Error('Cannot read video'));
      v.src = URL.createObjectURL(file);
    });

  const handleFilesSelected = async (files: FileList) => {
    setError(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i]; const id = crypto.randomUUID(); const url = URL.createObjectURL(file);
      try {
        const duration = await getVideoDuration(file);
        setStoredFiles(prev => [...prev, { id, file, url, duration }]);
        if (file.type.startsWith('video/')) {
          setClips(prev => [...prev, { id, filePath: url, fileName: file.name, duration, startTime: 0, endTime: duration, speed: 1, volume: 1 }]);
          setPreviewUrl(url);
        }
      } catch { setError(`فشل قراءة ${file.name}`); }
    }
  };

  const handleAudioSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile({ file, url, name: file.name });
      setSuccess('تم رفع الموسيقى');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const handleAutoEdit = () => {
    if (clips.length === 0) { setError('برجاء رفع فيديوهات أولاً'); return; }
    setIsProcessing(true); setError(null); setHasPlan(false);
    setTimeout(() => {
      const template = videoTemplates.find(t => t.id === selectedTemplate) || videoTemplates[0];
      const plan = planAutoEdit(clips, template);
      setEffects(plan.effects);
      setTransitions(plan.transitions);
      setTotalDuration(plan.totalDuration);
      setOrderedClipIds(plan.clips.map(c => c.id));
      setHasPlan(true);
      setIsProcessing(false);
      if (plan.clips.length > 0) setPreviewUrl(plan.clips[0].filePath);
      setSuccess(`تم تجهيز المونتاج: ${plan.clips.length} مقطع · ${plan.totalDuration.toFixed(1)} ثانية`);
      setTimeout(() => setSuccess(null), 4000);
    }, 800);
  };

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true); setExportProgress(0); setError(null);
    setExportMsg('جاري تحميل المحرك...');
    try {
      const readPromises = clips.map(async (clip) => {
        const stored = storedFiles.find(f => f.id === clip.id);
        if (!stored) throw new Error(`فقد ملف ${clip.fileName}`);
        const buffer = await stored.file.arrayBuffer();
        return { file: new Uint8Array(buffer), name: stored.file.name, start: clip.startTime, end: clip.endTime, speed: clip.speed };
      });
      const clipData = await Promise.all(readPromises);
      setExportMsg('جاري معالجة الفيديو...');
      const dlUrl = await renderMontage(clipData, (pct) => {
        setExportProgress(Math.round(pct * 0.9));
        if (pct > 10) setExportMsg('جاري تطبيق الترانزيشن والتأثيرات...');
        if (pct > 50) setExportMsg('جاري تصدير الفيديو النهائي...');
      });
      setExportProgress(100); setExportMsg('تم التصدير!');
      const a = document.createElement('a'); a.href = dlUrl; a.download = `montage_${selectedTemplate}.mp4`; a.click();
      URL.revokeObjectURL(dlUrl);
      setSuccess('تم تصدير الفيديو بنجاح!');
      setTimeout(() => { setShowExport(false); setSuccess(null); }, 2000);
    } catch (err: any) { setError(err.message || 'فشل التصدير'); }
    finally { setIsExporting(false); }
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
                    <video ref={previewRef} src={previewUrl} className="w-full rounded-xl bg-black" onEnded={() => setIsPlaying(false)} onTimeUpdate={() => setCurrentTime(previewRef.current?.currentTime || 0)} />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                      <button onClick={togglePreview} className="p-3 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500" style={{ width: `${(currentTime / (totalDuration || clips[0]?.duration || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">{Math.floor(currentTime)}s / {Math.floor(totalDuration || clips[0]?.duration || 0)}s</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl bg-zinc-900 flex items-center justify-center">
                    <Film className="w-16 h-16 text-zinc-700" />
                  </div>
                )}
              </div>

              {hasPlan && orderedClipIds.length > 0 && (
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowRight className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-zinc-200">ترتيب المونتاج</h3>
                    <span className="text-xs text-zinc-500 mr-auto">{totalDuration.toFixed(1)} ثانية</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {orderedClipIds.map((id, i) => {
                      const clip = clips.find(c => c.id === id);
                      const t = transitions[i];
                      if (!clip) return null;
                      return (
                        <div key={id} className="flex items-center gap-1 shrink-0">
                          <div className="flex flex-col items-center p-2 rounded-xl bg-zinc-800 min-w-[90px] border border-zinc-700">
                            <Film className="w-4 h-4 text-violet-400 mb-1" />
                            <span className="text-[10px] text-zinc-300 truncate w-full text-center">{clip.fileName.split('.')[0]}</span>
                            <span className="text-[10px] text-zinc-500">{(clip.endTime - clip.startTime).toFixed(1)}s</span>
                            {clip.speed !== 1 && <span className="text-[10px] text-amber-400">{clip.speed}x</span>}
                          </div>
                          {i < orderedClipIds.length - 1 && (
                            <div className="flex flex-col items-center text-[10px] text-zinc-600 w-8">
                              <span>{t?.type === 'fade' ? 'fade' : t?.type === 'slide_left' || t?.type === 'slide_right' ? 'slide' : t?.type === 'zoom_in' || t?.type === 'zoom_out' ? 'zoom' : t?.type || '→'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-zinc-200">المقاطع ({clips.length})</h3>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {clips.map(clip => (
                    <div key={clip.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 group hover:border-zinc-700 transition-all">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0"><Film className="w-5 h-5 text-zinc-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-300 truncate">{clip.fileName}</p>
                        <p className="text-xs text-zinc-500">{clip.duration.toFixed(1)}s</p>
                      </div>
                      <button onClick={() => removeClip(clip.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <UploadZone onFilesSelected={handleFilesSelected} uploading={false} />
            </div>

            <div className="space-y-6">
              {/* Audio/Music Upload */}
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Music className="w-5 h-5 text-rose-400" />
                  <h3 className="text-lg font-semibold text-zinc-200">موسيقى خلفية</h3>
                </div>
                <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioSelected} className="hidden" />
                {audioFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                    <Music className="w-5 h-5 text-rose-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{audioFile.name}</p>
                      <p className="text-xs text-zinc-500">تم الرفع</p>
                    </div>
                    <button onClick={() => setAudioFile(null)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    <audio src={audioFile.url} controls className="h-8 w-32" />
                  </div>
                ) : (
                  <button onClick={() => audioInputRef.current?.click()} className="w-full p-4 rounded-xl border-2 border-dashed border-zinc-700 hover:border-rose-500 text-zinc-400 hover:text-rose-400 transition-all text-sm">
                    + إضافة موسيقى خلفية
                  </button>
                )}
              </div>

              <TemplateSelector selectedId={selectedTemplate} onSelect={t => setSelectedTemplate(t.id)} />

              {hasPlan && (
                <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5">
                  <EffectsPanel effects={effects} onUpdateEffect={(id, params) => setEffects(prev => prev.map(e => e.id === id ? { ...e, params } : e))} />
                </div>
              )}

              <button onClick={handleAutoEdit} disabled={isProcessing || clips.length === 0}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-violet-500/20">
                {isProcessing ? <><Loader2 className="w-6 h-6 animate-spin" /> جاري التجهيز...</> : <><Wand2 className="w-6 h-6" /> مونتاج تلقائي</>}
              </button>

              <button onClick={() => setShowExport(true)} disabled={clips.length === 0}
                className="w-full py-3.5 rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-zinc-700">
                <Download className="w-5 h-5" /> تصدير الفيديو
              </button>
            </div>
          </div>
        )}
      </main>

      <ExportDialog isOpen={showExport} onClose={() => setShowExport(false)} onExport={handleExport} isExporting={isExporting} progress={exportProgress} message={exportMsg} />
    </div>
  );
}
