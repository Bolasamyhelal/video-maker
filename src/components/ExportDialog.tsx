'use client';

import { useState } from 'react';
import { Download, Film, Settings, X } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
  progress: number;
}

export interface ExportOptions {
  resolution: '1080p' | '720p' | '480p';
  fps: number;
  quality: 'high' | 'medium' | 'low';
  addWatermark: boolean;
  watermarkText: string;
}

export default function ExportDialog({ isOpen, onClose, onExport, isExporting, progress }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    resolution: '1080p',
    fps: 30,
    quality: 'high',
    addWatermark: false,
    watermarkText: '',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-bold text-zinc-100">تصدير الفيديو</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">الدقة</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1080p', '720p', '480p'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setOptions({ ...options, resolution: res })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    options.resolution === res
                      ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                      : 'border-zinc-800 hover:border-zinc-600 text-zinc-400'
                  }`}
                >
                  <span className="block text-sm font-semibold">{res}</span>
                  <span className="text-[10px] opacity-60">
                    {res === '1080p' ? 'Full HD' : res === '720p' ? 'HD' : 'SD'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">الإطار (FPS)</label>
            <div className="flex gap-2">
              {[24, 30, 60].map((fps) => (
                <button
                  key={fps}
                  onClick={() => setOptions({ ...options, fps })}
                  className={`px-4 py-2 rounded-xl border-2 transition-all ${
                    options.fps === fps
                      ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                      : 'border-zinc-800 hover:border-zinc-600 text-zinc-400'
                  }`}
                >
                  <span className="text-sm font-semibold">{fps} FPS</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">الجودة</label>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setOptions({ ...options, quality: q })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    options.quality === q
                      ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                      : 'border-zinc-800 hover:border-zinc-600 text-zinc-400'
                  }`}
                >
                  <span className="text-sm font-semibold">
                    {q === 'high' ? 'عالية' : q === 'medium' ? 'متوسطة' : 'منخفضة'}
                  </span>
                  <span className="text-[10px] opacity-60 block">
                    {q === 'high' ? 'CRF 18' : q === 'medium' ? 'CRF 23' : 'CRF 28'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={options.addWatermark}
                onChange={(e) => setOptions({ ...options, addWatermark: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
            </label>
            <span className="text-sm text-zinc-300">إضافة علامة مائية</span>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={() => onExport(options)}
            disabled={isExporting}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري التصدير... {progress}%</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>تصدير الفيديو</span>
              </>
            )}
          </button>

          {isExporting && (
            <div className="mt-4">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
