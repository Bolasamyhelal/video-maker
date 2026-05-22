import { AnalysisResult, Scene } from './types';

export function analyzeScenesFromFFmpeg(output: string): Scene[] {
  const scenes: Scene[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    const match = line.match(/^\[Parsed_showinfo.*\]\s+(\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)/);
    if (match) {
      scenes.push({
        start: parseFloat(match[1]),
        end: parseFloat(match[2]),
        type: parseFloat(match[3]) > 0.3 ? 'transition' : 'static',
        description: `Scene at ${match[1]}`,
      });
    }
  }

  return scenes;
}

export function detectSceneChanges(sceneFile: string): Scene[] {
  const scenes: Scene[] = [];
  const lines = sceneFile.split('\n').filter(line => line.trim());

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length >= 2) {
      const start = parseFloat(parts[0].trim());
      const end = parts[1] ? parseFloat(parts[1].trim()) : start + 2;
      scenes.push({
        start,
        end,
        type: 'motion',
        description: `Auto-detected scene`,
      });
    }
  }

  return scenes;
}

export function selectBestScenes(scenes: Scene[], targetDuration: number): Scene[] {
  if (scenes.length === 0) return [];

  const sorted = [...scenes].sort((a, b) => {
    const aDuration = a.end - a.start;
    const bDuration = b.end - b.start;
    return bDuration - aDuration;
  });

  const selected: Scene[] = [];
  let totalDuration = 0;

  for (const scene of sorted) {
    const duration = scene.end - scene.start;
    if (totalDuration + duration <= targetDuration) {
      selected.push(scene);
      totalDuration += duration;
    } else if (totalDuration < targetDuration) {
      const trimmedEnd = scene.start + (targetDuration - totalDuration);
      selected.push({ ...scene, end: trimmedEnd });
      totalDuration = targetDuration;
      break;
    }
  }

  return selected.sort((a, b) => a.start - b.start);
}

export function calculateQualityMetrics(analysis: AnalysisResult): {
  motionScore: number;
  qualityScore: number;
} {
  const sceneCount = analysis.scenes.length;
  const hasVariety = sceneCount > 2;

  const resolutionScore = Math.min(
    (analysis.width * analysis.height) / (1920 * 1080),
    1
  );

  const fpsScore = Math.min(analysis.fps / 60, 1);

  const motionScore = hasVariety
    ? Math.min(analysis.motionScore * 1.5, 1)
    : analysis.motionScore;

  const qualityScore = Math.round(
    (resolutionScore * 0.4 + fpsScore * 0.3 + motionScore * 0.3) * 100
  );

  return { motionScore, qualityScore };
}
