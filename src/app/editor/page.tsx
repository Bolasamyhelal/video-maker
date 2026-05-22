'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import TemplateSelector from '@/components/TemplateSelector';
import ExportDialog, { ExportOptions } from '@/components/ExportDialog';
import EffectsPanel from '@/components/EffectsPanel';
import { Template, VideoClip, Effect, Transition, AnalysisResult } from '@/lib/types';
import { videoTemplates } from '@/lib/templates';
import { createProject, planAutoEdit, extractDominantColors } from '@/lib/editorEngine';
import {
  Film, Wand2, Play, Pause, Trash2, Music, Download,
  Sparkles, Loader2, AlertCircle, ChevronLeft, CheckCircle2,
  Image, Layers, Clock, Scissors,
} from 'lucide-react';

export default function EditorPage() {
  const router = useRouter();
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; url: string; type: string }[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('cinematic');
  const [analysisResults, setAnalysisResults] = useState<Map<string, AnalysisResult>>(new Map());
  const [effects, setEffects] = useState<Effect[]>([]);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const previewRef = useRef<HTMLVideoElement>(null);

  const handleFilesSelected = async (files: FileList) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const uploadForm = new FormData();
        uploadForm.append('file', file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm });
        if (!uploadRes.ok) throw new Error(`فشل رفع ${file.name}`);
        const uploadData = await uploadRes.json();

        setUploadedFiles(prev => [...prev, { id: uploadData.id, name: uploadData.originalName, url: uploadData.url, type: uploadData.type }]);

        if (uploadData.type === 'video') {
          const analyzeRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: uploadData.url, fileName: uploadData.name }),
          });
          if (!analyzeRes.ok) throw new Error(`فشل تحليل ${file.name}`);
          const analysis: AnalysisResult = await analyzeRes.json();

          setAnalysisResults(prev => {
            const next = new Map(prev);
            next.set(uploadData.id, analysis);
            return next;
          });

          const clip: VideoClip = {
            id: uploadData.id,
            filePath: uploadData.url,
            fileName: uploadData.name,
            duration: analysis.duration,
            startTime: 0,
            endTime: analysis.duration,
            speed: 1,
            volume: 1,
            sceneInfo: {
              scenes: analysis.scenes,
              dominantColors: analysis.dominantColors,
              motionScore: analysis.motionScore,
              qualityScore: analysis.qualityScore,
            },
          };

          setClips(prev => [...prev, clip]);
          setPreviewUrl(uploadData.url);
        }
      }

      setSuccessMsg(`تم رفع ${files.length} ملف بنجاح`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الرفع');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoEdit = async () => {
    if (clips.length === 0) {
      setError('برجاء رفع فيديوهات أولاً');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const template = videoTemplates.find(t => t.id === selectedTemplate) || videoTemplates[0];
      const editPlan = planAutoEdit(clips, template);

      setEffects(editPlan.effects);
      setTransitions(editPlan.transitions);
      setTotalDuration(editPlan.totalDuration);

      if (editPlan.clips.length > 0) {
        const sortedClips = [...editPlan.clips].sort((a, b) => a.startTime - b.startTime);
        const firstClip = sortedClips.find(c => c.filePath) || editPlan.clips[0];
        setPreviewUrl(firstClip.filePath);
      }

      setSuccessMsg('تم تجهيز المونتاج التلقائي بنجاح');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'فشل المونتاج التلقائي');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true);
    setExportProgress(0);
    setError(null);

    try {
      const exportClips = clips.map(clip => {
        const clipEffects = effects.filter(e => e.clipId === clip.id);
        const effectParams: any = { contrast: 1, brightness: 1, saturate: 1 };
        clipEffects.forEach(e => {
          effectParams[e.type] = (e.params.value as number) ?? 1;
        });

        return {
          filePath: clip.filePath,
          videoPath: clip.filePath,
          startTime: clip.startTime,
          endTime: clip.endTime,
          speed: clip.speed,
          volume: clip.volume,
          effects: effectParams,
        };
      });

      const exportTransitions = transitions.map(t => ({
        type: t.type,
        duration: t.duration,
        fromIndex: clips.findIndex(c => c.id === t.fromClipId),
        toIndex: clips.findIndex(c => c.id === t.toClipId),
      }));

      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 2000);

      const renderRes = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips: exportClips,
          transitions: exportTransitions,
          output: options,
          template: selectedTemplate,
          projectName: 'My_Montage',
        }),
      });

      clearInterval(progressInterval);

      if (!renderRes.ok) throw new Error('فشل التصدير');

      const renderData = await renderRes.json();
      setExportProgress(100);

      const downloadUrl = renderData.outputPath;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `montage_${selectedTemplate}.mp4`;
      a.click();

      setSuccessMsg('تم تصدير الفيديو بنجاح!');
      setTimeout(() => {
        setShowExport(false);
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'فشل التصدير');
    } finally {
      setIsExporting(false);
    }
  };

  const removeClip = (id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    setEffects(prev => prev.filter(e => e.clipId !== id));
    setTransitions(prev => prev.filter(t => t.fromClipId !== id && t.toClipId !== id));
  };

  const togglePreview = () => {
    if (!previewRef.current) return;
    if (isPlaying) {
      previewRef.current.pause();
    } else {
      previewRef.current.play();
    }
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
            <button onClick={() => setError(null)} className="mr-auto text-red-400 hover:text-red-300">
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm">{successMsg}</p>
          </div>
        )}

        {clips.length === 0 ? (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                هل أنت مستعد لمونتاج احترافي؟
              </h2>
              <p className="text-zinc-400">
                ارفع الفيديوهات الخام اللي عندك، واختر قالب مونتاج، وهخلي المونتاج يجنن!
              </p>
            </div>
            <UploadZone onFilesSelected={handleFilesSelected} uploading={isAnalyzing} />
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
                      <button
                        onClick={togglePreview}
                        className="p-3 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 transition-all"
                          style={{ width: `${(currentTime / totalDuration) * 100 || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        {Math.floor(currentTime)}s / {Math.floor(totalDuration)}s
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video rounded-xl bg-zinc-900 flex items-center justify-center">
                    <div className="text-center">
                      <Film className="w-16 h-16 text-zinc-700 mx-auto mb-3" />
                      <p className="text-zinc-500">معاينة الفيديو</p>
                    </div>
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
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {clips.map((clip) => (
                    <div key={clip.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 group hover:border-zinc-700 transition-all">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                        <Film className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-300 truncate">{clip.fileName}</p>
                        <p className="text-xs text-zinc-500">
                          {clip.duration.toFixed(1)}s · سرعة {clip.speed}x
                        </p>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {clip.sceneInfo?.scenes.length || 0} مشهد
                      </span>
                      <button
                        onClick={() => removeClip(clip.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <UploadZone onFilesSelected={handleFilesSelected} uploading={isAnalyzing} />
            </div>

            <div className="space-y-6">
              <TemplateSelector
                selectedId={selectedTemplate}
                onSelect={(t) => setSelectedTemplate(t.id)}
              />

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
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    جاري التجهيز...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    مونتاج تلقائي
                  </>
                )}
              </button>

              <button
                onClick={() => setShowExport(true)}
                disabled={clips.length === 0}
                className="w-full py-3.5 rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 border border-zinc-700"
              >
                <Download className="w-5 h-5" />
                تصدير الفيديو
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
