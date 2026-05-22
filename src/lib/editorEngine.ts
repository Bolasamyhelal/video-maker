import { VideoClip, Scene, Transition, Effect, VideoProject, Template } from './types';

export interface EditorState {
  clips: VideoClip[];
  transitions: Transition[];
  effects: Effect[];
  currentTime: number;
  duration: number;
}

export function createProject(name: string): VideoProject {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date(),
    updatedAt: new Date(),
    clips: [],
    effects: [],
    transitions: [],
    outputFormat: {
      resolution: '1080p',
      fps: 30,
      codec: 'h264',
      quality: 'high',
    },
    status: 'draft',
  };
}

export function trimClip(clip: VideoClip, start: number, end: number): VideoClip {
  return {
    ...clip,
    startTime: Math.max(0, clip.startTime + start),
    endTime: Math.min(clip.duration, clip.startTime + end),
  };
}

export function applySpeed(clip: VideoClip, speed: number): VideoClip {
  return {
    ...clip,
    speed,
    startTime: clip.startTime,
    endTime: clip.endTime,
  };
}

export function generateTransition(
  fromClip: VideoClip,
  toClip: VideoClip,
  type: Transition['type'],
  duration: number = 0.5
): Transition {
  return {
    id: crypto.randomUUID(),
    type,
    duration,
    fromClipId: fromClip.id,
    toClipId: toClip.id,
  };
}

export function addEffect(
  clip: VideoClip,
  type: Effect['type'],
  params: Effect['params']
): Effect {
  return {
    id: crypto.randomUUID(),
    type,
    clipId: clip.id,
    startTime: clip.startTime,
    endTime: clip.endTime,
    params,
  };
}

export function extractDominantColors(sceneInfo: Scene[]): string[] {
  const timeOfDayColors: Record<string, string[]> = {
    morning: ['#87CEEB', '#90EE90', '#FFD700'],
    sunset: ['#FF6B35', '#FF4500', '#8B0000', '#FFD700'],
    night: ['#191970', '#000080', '#2F4F4F', '#C0C0C0'],
    indoor: ['#FFF8DC', '#DEB887', '#A0522D', '#F5DEB3'],
    vibrant: ['#FF1493', '#00CED1', '#FFD700', '#7B68EE', '#FF6347'],
    natural: ['#228B22', '#8B4513', '#4682B4', '#DAA520', '#D2691E'],
  };

  const randomKey = Object.keys(timeOfDayColors)[Math.floor(Math.random() * Object.keys(timeOfDayColors).length)];
  return timeOfDayColors[randomKey];
}

export function calculateAutoDuration(clips: VideoClip[], template: Template): number {
  const totalRaw = clips.reduce((sum, c) => sum + (c.endTime - c.startTime), 0);

  switch (template.pacing) {
    case 'fast':
      return Math.min(totalRaw * 0.3, 60);
    case 'medium':
      return Math.min(totalRaw * 0.5, 120);
    case 'slow':
      return Math.min(totalRaw * 0.7, 180);
  }
}

function buildSceneDurationMap(
  scenes: Scene[],
  targetDuration: number
): Map<number, { scene: Scene; duration: number }> {
  const sceneDurations = new Map<number, { scene: Scene; duration: number }>();
  const totalSceneDuration = scenes.reduce((sum, s) => sum + (s.end - s.start), 0);

  if (totalSceneDuration === 0) return sceneDurations;

  const scaleFactor = targetDuration / totalSceneDuration;

  scenes.forEach((scene, index) => {
    const originalDuration = scene.end - scene.start;
    const adjustedDuration = Math.max(0.5, originalDuration * scaleFactor);
    sceneDurations.set(index, { scene, duration: adjustedDuration });
  });

  return sceneDurations;
}

export function planAutoEdit(
  clips: VideoClip[],
  template: Template,
  beats?: number[]
): {
  clips: VideoClip[];
  transitions: Transition[];
  effects: Effect[];
  totalDuration: number;
} {
  const targetDuration = calculateAutoDuration(clips, template);
  const sortedClips = clips.sort((a, b) => b.duration - a.duration);

  const sceneDurations = buildSceneDurationMap(
    sortedClips.map(c => ({
      start: c.startTime,
      end: c.endTime,
      type: 'motion' as const,
      description: '',
    })),
    targetDuration
  );

  const usedClips: VideoClip[] = [];
  let accumulatedTime = 0;

  sortedClips.forEach((clip, index) => {
    if (accumulatedTime >= targetDuration) return;

    const durationInfo = sceneDurations.get(index);
    const assignedDuration = durationInfo ? durationInfo.duration : Math.min(clip.duration, 2);

    const speedFactor = clip.duration / Math.max(assignedDuration, 0.1);

    usedClips.push({
      ...clip,
      startTime: clip.startTime,
      endTime: clip.startTime + Math.min(assignedDuration, clip.duration),
      speed: Math.max(0.5, Math.min(speedFactor, 4)),
    });

    accumulatedTime += assignedDuration;
  });

  const transitions: Transition[] = [];
  for (let i = 1; i < usedClips.length; i++) {
    const transitionType = template.transitions[i % template.transitions.length];
    const duration = template.pacing === 'fast' ? 0.3 : template.pacing === 'medium' ? 0.5 : 0.8;
    transitions.push({
      id: crypto.randomUUID(),
      type: transitionType,
      duration,
      fromClipId: usedClips[i - 1].id,
      toClipId: usedClips[i].id,
    });
  }

  const effects: Effect[] = [];
  usedClips.forEach((clip, index) => {
    const templateEffectsToUse =
      template.effects.length > 0
        ? template.effects
        : (['brightness', 'contrast', 'saturate'] as Effect['type'][]);

    templateEffectsToUse.forEach((effectType) => {
      const defaultParams = {
        brightness: { value: 1.0 },
        contrast: { value: 1.0 },
        saturate: { value: 1.2 },
        blur: { value: 0 },
        sharpen: { value: 0.5 },
        grayscale: { value: 0 },
        sepia: { value: 0 },
        vignette: { value: 0.3 },
      } as const;

      effects.push({
        id: crypto.randomUUID(),
        type: effectType,
        clipId: clip.id,
        startTime: clip.startTime,
        endTime: clip.endTime,
        params: (defaultParams[effectType] || { value: 1.0 }) as any,
      });
    });
  });

  return {
    clips: usedClips,
    transitions,
    effects,
    totalDuration: accumulatedTime,
  };
}

export function getTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function getTransitionFFmpegFilter(transition: Transition): string {
  const filters: Record<string, string> = {
    fade: `fade=t=in:st=0:d=${transition.duration}`,
    dissolve: `mix=frames=${Math.round(transition.duration * 30)}`,
    slide_left: `slide=duration=${transition.duration}:slide=left`,
    slide_right: `slide=duration=${transition.duration}:slide=right`,
    zoom_in: `zoompan=z=zoom+0.002:d=${transition.duration * 30}:s=1920x1080`,
    zoom_out: `zoompan=z=zoom-0.001:d=${transition.duration * 30}:s=1920x1080`,
    wipe: `wipe=duration=${transition.duration}:direction=left`,
  };

  return filters[transition.type] || filters.fade;
}
