'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { videoTemplates } from '@/lib/templates';
import { Template } from '@/lib/types';

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (template: Template) => void;
}

export default function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-zinc-200">اختر قالب المونتاج</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {videoTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={`
              relative p-4 rounded-xl border-2 text-right transition-all duration-200
              ${selectedId === template.id
                ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/50'
              }
            `}
          >
            {selectedId === template.id && (
              <div className="absolute top-2 left-2 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getTemplateEmoji(template.id)}</span>
              <span className="font-medium text-zinc-200">{template.name}</span>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              {template.description}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                template.pacing === 'fast' ? 'bg-amber-500/20 text-amber-400' :
                template.pacing === 'medium' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {template.pacing === 'fast' ? 'سريع' : template.pacing === 'medium' ? 'متوسط' : 'بطيء'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-medium">
                {template.transitions.length} ترانزيشن
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function getTemplateEmoji(id: string): string {
  const emojis: Record<string, string> = {
    cinematic: '🎬',
    modern: '⚡',
    vlog: '📹',
    promo: '📢',
    travel: '🌍',
    retro: '📼',
    gaming: '🎮',
    wedding: '💍',
  };
  return emojis[id] || '🎥';
}
