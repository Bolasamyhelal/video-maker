'use client';

import { Effect, EffectType } from '@/lib/types';
import { Sliders, RotateCcw } from 'lucide-react';

interface EffectsPanelProps {
  effects: Effect[];
  onUpdateEffect: (effectId: string, params: Record<string, number | string>) => void;
}

const effectLabels: Record<EffectType, string> = {
  brightness: 'سطوع',
  contrast: 'تباين',
  saturate: 'تشبع',
  blur: 'ضبابية',
  sharpen: 'وضوح',
  grayscale: 'أبيض وأسود',
  sepia: 'سيبيا',
  vignette: 'ظل',
};

const effectIcons: Record<EffectType, string> = {
  brightness: '☀️',
  contrast: '◐',
  saturate: '🎨',
  blur: '🌫️',
  sharpen: '🔍',
  grayscale: '⚫',
  sepia: '🟫',
  vignette: '🌑',
};

export default function EffectsPanel({ effects, onUpdateEffect }: EffectsPanelProps) {
  if (effects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <Sliders className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">لا توجد مؤثرات مضافة</p>
        <p className="text-xs text-zinc-600 mt-1">اختر قالب لإضافة مؤثرات تلقائية</p>
      </div>
    );
  }

  const uniqueEffects = effects.reduce<Effect[]>((acc, effect) => {
    if (!acc.find(e => e.type === effect.type)) {
      acc.push(effect);
    }
    return acc;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Sliders className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-zinc-200">المؤثرات</h3>
      </div>

      {uniqueEffects.map((effect) => (
        <EffectSlider
          key={effect.id}
          effect={effect}
          onUpdate={(params) => onUpdateEffect(effect.id, params)}
        />
      ))}
    </div>
  );
}

function EffectSlider({
  effect,
  onUpdate,
}: {
  effect: Effect;
  onUpdate: (params: Record<string, number | string>) => void;
}) {
  const currentValue = (effect.params.value as number) ?? 1;
  const sliderMin = effect.type === 'brightness' || effect.type === 'contrast' ? 0 : -1;
  const sliderMax = effect.type === 'blur' ? 10 : 2;
  const sliderStep = 0.1;

  const resetValue = effect.type === 'blur' || effect.type === 'vignette' ? 0 :
                     effect.type === 'grayscale' || effect.type === 'sepia' ? 0 : 1;

  const handleChange = (value: number) => {
    onUpdate({ value: Math.round(value * 10) / 10 });
  };

  return (
    <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{effectIcons[effect.type]}</span>
          <span className="text-sm font-medium text-zinc-300">
            {effectLabels[effect.type]}
          </span>
        </div>
        <button
          onClick={() => handleChange(resetValue)}
          className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={sliderStep}
          value={currentValue}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-violet-500/30"
        />
        <span className="text-xs text-zinc-400 w-8 text-left font-mono">
          {currentValue.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
