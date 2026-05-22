export interface VideoProject {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  clips: VideoClip[];
  effects: Effect[];
  transitions: Transition[];
  backgroundMusic?: AudioTrack;
  outputFormat: OutputFormat;
  status: 'draft' | 'processing' | 'done' | 'error';
}

export interface VideoClip {
  id: string;
  filePath: string;
  fileName: string;
  duration: number;
  startTime: number;
  endTime: number;
  speed: number;
  volume: number;
  sceneInfo?: SceneInfo;
}

export interface SceneInfo {
  scenes: Scene[];
  dominantColors: string[];
  motionScore: number;
  qualityScore: number;
}

export interface Scene {
  start: number;
  end: number;
  type: 'static' | 'motion' | 'transition';
  description: string;
}

export interface Effect {
  id: string;
  type: EffectType;
  clipId: string;
  startTime: number;
  endTime: number;
  params: Record<string, number | string>;
}

export type EffectType =
  | 'brightness'
  | 'contrast'
  | 'saturate'
  | 'blur'
  | 'sharpen'
  | 'grayscale'
  | 'sepia'
  | 'vignette';

export interface Transition {
  id: string;
  type: TransitionType;
  duration: number;
  fromClipId: string;
  toClipId: string;
}

export type TransitionType =
  | 'fade'
  | 'dissolve'
  | 'slide_left'
  | 'slide_right'
  | 'zoom_in'
  | 'zoom_out'
  | 'wipe';

export interface AudioTrack {
  id: string;
  filePath: string;
  fileName: string;
  duration: number;
  volume: number;
  beats?: number[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  transitions: TransitionType[];
  effects: EffectType[];
  musicGenre?: string;
  pacing: 'slow' | 'medium' | 'fast';
}

export interface OutputFormat {
  resolution: '1080p' | '720p' | '480p';
  fps: number;
  codec: 'h264' | 'h265';
  quality: 'high' | 'medium' | 'low';
}

export interface ProcessingJob {
  id: string;
  projectId: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  progress: number;
  outputPath?: string;
  error?: string;
}

export interface AnalysisResult {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  scenes: Scene[];
  audioBeats?: number[];
  dominantColors: string[];
  motionScore: number;
  qualityScore: number;
  hasAudio: boolean;
}
